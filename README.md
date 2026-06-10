# GriddyTest

A real-time multiplayer grid game. Open the site, get a random identity, and start clicking blocks to claim them. Everyone online sees every capture the instant it happens.

![GriddyTest UI](https://i.imgur.com/placeholder.png)
> Dark-themed 40×30 grid with a live leaderboard sidebar.

---

## What it does

- **1 200 blocks** (40 columns × 30 rows) on a shared canvas
- Click any unclaimed block — or steal one from another player — to capture it
- **All clients see the update in real time** via Socket.IO WebSockets
- You get a random name + colour on connect (no sign-up)
- **3-second cooldown** between captures, enforced server-side
- Live leaderboard, online count, map-claim percentage
- Zoom (scroll wheel) + pan (Shift + drag) the grid

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Fast HMR, strong types, small bundle |
| Backend | Node.js + Express + Socket.IO | Event-loop concurrency is ideal for fan-out broadcast; Socket.IO handles WS + polling fallback |
| State | In-memory (server) | Keeps the demo self-contained. A Redis adapter would make it horizontally scalable |
| Styling | Hand-written CSS (custom properties) | Zero build-time deps, full control over animations |

---

## Setup

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install dependencies

```bash
# from the repo root
npm run install:all
```

Or individually:

```bash
cd server && npm install
cd ../client && npm install
```

### Run in development

```bash
# from repo root — starts both server and client with hot-reload
npm run dev
```

- **Server** → `http://localhost:3001`
- **Client** → `http://localhost:5173`

Open multiple browser tabs to simulate multiple players.

### Environment variables

The client reads `VITE_SERVER_URL` to find the backend. For local dev the default (`http://localhost:3001`) is used automatically.

```bash
# client/.env (optional)
VITE_SERVER_URL=http://localhost:3001
```

```bash
# server/.env (optional)
PORT=3001
```

---

## Project structure

```
.
├── server/
│   ├── src/
│   │   ├── index.ts        # Express + Socket.IO entry point
│   │   ├── types.ts        # Shared constants & interfaces
│   │   ├── GridManager.ts  # Grid state + capture logic
│   │   └── UserManager.ts  # Session management + rate-limiting
│   ├── package.json
│   └── tsconfig.json
│
├── client/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── types/          # Client-side type definitions
│   │   ├── hooks/
│   │   │   └── useSocket.ts  # All WebSocket logic lives here
│   │   └── components/
│   │       ├── Grid.tsx      # Viewport with zoom/pan
│   │       ├── Block.tsx     # Single cell (memo'd)
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── UserPanel.tsx
│   │       ├── CooldownBar.tsx
│   │       ├── MapStats.tsx
│   │       └── Leaderboard.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── package.json   # root (concurrently dev script)
└── README.md
```

---

## Key business logic

### 1 · Block capture — `server/src/GridManager.ts`

The grid is a flat array of 1 200 `Block` objects indexed by `id = row * COLS + col`.

```typescript
capture(
  blockId: number,
  userId: string,
  username: string,
  color: string
): Block | false | null {
  const block = this.getBlock(blockId);
  if (!block) return null;          // out-of-range id
  if (block.ownerId === userId) return false;  // already yours

  block.ownerId    = userId;
  block.ownerName  = username;
  block.ownerColor = color;
  block.capturedAt = Date.now();
  return block;
}
```

**Why this is race-condition-free**: Node.js is single-threaded. Every `capture_block` Socket.IO event is processed sequentially in the event loop. The first one to arrive wins — no locks, no transactions needed.

---

### 2 · Server-side rate limiting — `server/src/UserManager.ts`

Each `User` object carries a `lastCapture` timestamp. Every capture attempt checks elapsed time before touching the grid.

```typescript
canCapture(socketId: string): { allowed: boolean; remaining: number } {
  const user = this.users.get(socketId);
  if (!user) return { allowed: false, remaining: 0 };

  const elapsed   = Date.now() - user.lastCapture;
  const remaining = Math.max(0, COOLDOWN_MS - elapsed);  // COOLDOWN_MS = 3000
  return { allowed: remaining === 0, remaining };
}
```

The client also checks this locally before sending the event, which eliminates unnecessary round-trips. The server re-checks regardless — the client check is an optimisation, not a security boundary.

---

### 3 · Real-time fan-out — `server/src/index.ts`

After a valid capture, one `io.emit()` pushes the update to **every connected socket**, including the sender. There is no separate "ack" — the sender learns their capture succeeded the same way everyone else does.

```typescript
socket.on('capture_block', (blockId: number) => {
  const currentUser = users.get(socket.id);
  if (!currentUser) return;

  const { allowed, remaining } = users.canCapture(socket.id);
  if (!allowed) {
    socket.emit('capture_failed', { blockId, reason: 'cooldown', cooldownRemaining: remaining });
    return;
  }

  const result = grid.capture(blockId, currentUser.id, currentUser.username, currentUser.color);
  if (!result || result === false) {
    socket.emit('capture_failed', { blockId, reason: result === false ? 'own_block' : 'invalid' });
    return;
  }

  users.recordCapture(socket.id);

  // Single authoritative broadcast → every client, same payload
  io.emit('block_captured', {
    block: result,
    leaderboard: users.leaderboard(),
    onlineCount: users.count(),
  });
});
```

---

### 4 · Client state — `client/src/hooks/useSocket.ts`

All socket events feed into a single `useReducer`. This makes state transitions explicit and testable.

```typescript
case 'BLOCK_CAPTURED': {
  // Splice the updated block into the array — O(1) logical change,
  // O(n) spread for immutability (n=1200, negligible).
  const blocks = [...state.blocks];
  blocks[action.block.id] = action.block;

  const isMyCapture = state.user !== null && action.block.ownerId === state.user.id;

  return {
    ...state,
    blocks,
    leaderboard:   action.leaderboard,
    onlineCount:   action.onlineCount,
    justCaptured:  action.block.id,          // triggers CSS burst animation
    cooldownUntil: isMyCapture
      ? Date.now() + COOLDOWN_MS            // start local countdown
      : state.cooldownUntil,
    user: isMyCapture ? syncCaptureCount(state.user!, action.leaderboard) : state.user,
  };
}
```

---

### 5 · Efficient grid rendering — `client/src/components/Block.tsx`

With 1 200 blocks in the DOM, React's default reconciliation would re-render all of them on every state change. `React.memo` with a custom comparator cuts that down to **only the block that actually changed**.

```typescript
const Block = React.memo(
  ({ block, isCurrentUser, justCaptured, onCapture }: BlockProps) => { /* ... */ },
  (prev, next) =>
    prev.block.ownerId    === next.block.ownerId    &&
    prev.block.ownerColor === next.block.ownerColor &&
    prev.isCurrentUser    === next.isCurrentUser    &&
    prev.justCaptured     === next.justCaptured
);
```

Result: one capture event → one DOM update, regardless of grid size.

---

### 6 · Capture animation

A CSS keyframe fires on the `just-captured` class (added for 600 ms):

```css
@keyframes burst {
  0%   { transform: scale(1);    filter: brightness(1); }
  28%  { transform: scale(1.35); filter: brightness(2.8); }
  65%  { transform: scale(.95);  filter: brightness(1.1); }
  100% { transform: scale(1);    filter: brightness(1); }
}
```

Every client sees this animation on every capture, not just the capturer.

---

## Socket.IO event reference

| Direction | Event | Payload |
|---|---|---|
| S → C | `init` | `{ user, grid, onlineCount, leaderboard }` |
| S → C | `block_captured` | `{ block, leaderboard, onlineCount }` |
| S → C | `user_joined` | `{ userId, username, color, onlineCount }` |
| S → C | `user_left` | `{ userId, username, onlineCount }` |
| S → C | `capture_failed` | `{ blockId, reason, cooldownRemaining? }` |
| C → S | `capture_block` | `blockId: number` |

---

## Design decisions

**In-memory state, no database** — for a demo this is the right call. State resets on restart, but the app is self-contained and has zero infra requirements. Adding a Redis adapter to Socket.IO and persisting the grid to Redis would make it multi-instance and durable.

**Last-write-wins conflict resolution** — the simplest correct policy for this game. Because the server is single-threaded and processes events serially, "last write" is actually "first event to arrive", which feels fair to players.

**No auth, no persistent identity** — a random name + colour is generated on each socket connection. Players who refresh lose their colour. This was a deliberate scope decision; adding a `userId` cookie + session store would preserve identity across refreshes.

**Cooldown on the server, not just the client** — the client checks cooldown to avoid sending noisy events, but the server re-validates on every request. The client is untrusted.

---

## Possible extensions

- Redis adapter for Socket.IO → horizontal scaling
- Persist grid to Redis/Postgres → survives restarts
- Cookie-based identity → persistent username and score
- Configurable game modes (timed rounds, zone control, etc.)
- Minimap overlay for the full grid
