import { Block, LeaderboardEntry, User } from '../types';
import UserPanel from './UserPanel';
import MapStats from './MapStats';
import Leaderboard from './Leaderboard';

interface SidebarProps {
  user: User | null;
  blocks: Block[];
  leaderboard: LeaderboardEntry[];
  onlineCount: number;
  cooldownUntil: number;
}

export default function Sidebar({
  user,
  blocks,
  leaderboard,
  onlineCount,
  cooldownUntil,
}: SidebarProps) {
  const ownedCount = user
    ? blocks.filter((b) => b.ownerId === user.id).length
    : 0;

  return (
    <aside className="sidebar">
      <UserPanel
        user={user}
        cooldownUntil={cooldownUntil}
        ownedCount={ownedCount}
      />
      <MapStats blocks={blocks} onlineCount={onlineCount} />
      <Leaderboard entries={leaderboard} currentUserId={user?.id ?? null} />
    </aside>
  );
}
