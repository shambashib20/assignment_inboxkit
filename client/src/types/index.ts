// Keep in sync with server/src/types.ts
export const GRID_ROWS = 30;
export const GRID_COLS = 40;
export const TOTAL_BLOCKS = GRID_ROWS * GRID_COLS;
export const COOLDOWN_MS = 3000;

export interface Block {
  id: number;
  row: number;
  col: number;
  ownerId: string | null;
  ownerName: string | null;
  ownerColor: string | null;
  capturedAt: number | null;
}

export interface User {
  id: string;
  username: string;
  color: string;
  captureCount: number;
  lastCapture: number;
  joinedAt: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  color: string;
  count: number;
}

export interface GameState {
  user: User | null;
  blocks: Block[];
  onlineCount: number;
  leaderboard: LeaderboardEntry[];
  connected: boolean;
  cooldownUntil: number;
  justCaptured: number | null;
}
