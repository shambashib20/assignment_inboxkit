import { User, LeaderboardEntry, COOLDOWN_MS } from './types';

const ADJECTIVES = [
  'Swift', 'Bold', 'Fierce', 'Calm', 'Wild', 'Sleek', 'Brave', 'Nimble',
  'Sharp', 'Bright', 'Dark', 'Sly', 'Quick', 'Keen', 'Loud', 'Quiet',
  'Rapid', 'Steady', 'Crafty', 'Proud',
];

const ANIMALS = [
  'Fox', 'Wolf', 'Eagle', 'Bear', 'Tiger', 'Hawk', 'Lion', 'Puma',
  'Viper', 'Falcon', 'Shark', 'Lynx', 'Cobra', 'Raven', 'Jaguar',
  'Panther', 'Orca', 'Bison', 'Crane', 'Drake',
];

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f43f5e', '#a855f7', '#0ea5e9', '#10b981', '#f59e0b',
  '#6366f1', '#d946ef', '#64748b', '#78716c', '#dc2626',
];

export class UserManager {
  private users = new Map<string, User>();
  private usedColors = new Set<string>();

  create(socketId: string): User {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const available = COLORS.filter((c) => !this.usedColors.has(c));
    const color =
      available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : COLORS[Math.floor(Math.random() * COLORS.length)];

    const user: User = {
      id: socketId,
      username: `${adj} ${animal}`,
      color,
      captureCount: 0,
      lastCapture: 0,
      joinedAt: Date.now(),
    };
    this.users.set(socketId, user);
    this.usedColors.add(color);
    return user;
  }

  remove(socketId: string): User | undefined {
    const user = this.users.get(socketId);
    if (user) {
      this.usedColors.delete(user.color);
      this.users.delete(socketId);
    }
    return user;
  }

  get(socketId: string): User | undefined {
    return this.users.get(socketId);
  }

  count(): number {
    return this.users.size;
  }

  /**
   * Enforces per-user rate limiting.
   * Returns whether the user may capture and how long until they can.
   */
  canCapture(socketId: string): { allowed: boolean; remaining: number } {
    const user = this.users.get(socketId);
    if (!user) return { allowed: false, remaining: 0 };
    const elapsed = Date.now() - user.lastCapture;
    const remaining = Math.max(0, COOLDOWN_MS - elapsed);
    return { allowed: remaining === 0, remaining };
  }

  recordCapture(socketId: string): void {
    const user = this.users.get(socketId);
    if (user) {
      user.captureCount++;
      user.lastCapture = Date.now();
    }
  }

  leaderboard(limit = 10): LeaderboardEntry[] {
    return Array.from(this.users.values())
      .sort((a, b) => b.captureCount - a.captureCount)
      .slice(0, limit)
      .map((u) => ({
        userId: u.id,
        username: u.username,
        color: u.color,
        count: u.captureCount,
      }));
  }
}
