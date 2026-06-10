import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GridManager } from './GridManager';
import { UserManager } from './UserManager';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());

const grid = new GridManager();
const users = new UserManager();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', online: users.count(), ...grid.getStats() });
});

io.on('connection', (socket) => {
  const user = users.create(socket.id);


  socket.emit('init', {
    user,
    grid: grid.getGrid(),
    onlineCount: users.count(),
    leaderboard: users.leaderboard(),
  });


  socket.broadcast.emit('user_joined', {
    userId: user.id,
    username: user.username,
    color: user.color,
    onlineCount: users.count(),
  });

  socket.on('capture_block', (blockId: number) => {
    const currentUser = users.get(socket.id);
    if (!currentUser) return;

    // Rate-limit check — enforced on the server regardless of client state
    const { allowed, remaining } = users.canCapture(socket.id);
    if (!allowed) {
      socket.emit('capture_failed', {
        blockId,
        reason: 'cooldown',
        cooldownRemaining: remaining,
      });
      return;
    }

    const result = grid.capture(
      blockId,
      currentUser.id,
      currentUser.username,
      currentUser.color
    );

    if (result === null) {
      socket.emit('capture_failed', { blockId, reason: 'invalid' });
      return;
    }
    if (result === false) {
      socket.emit('capture_failed', { blockId, reason: 'own_block' });
      return;
    }

    users.recordCapture(socket.id);

    // Single authoritative broadcast to every connected client
    io.emit('block_captured', {
      block: result,
      leaderboard: users.leaderboard(),
      onlineCount: users.count(),
    });
  });

  socket.on('disconnect', () => {
    const departed = users.remove(socket.id);
    if (departed) {
      io.emit('user_left', {
        userId: departed.id,
        username: departed.username,
        onlineCount: users.count(),
      });
    }
  });
});

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`GriddyTest server listening on :${PORT}`);
});
