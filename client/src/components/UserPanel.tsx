import { User } from '../types';
import CooldownBar from './CooldownBar';

interface UserPanelProps {
  user: User | null;
  cooldownUntil: number;
  ownedCount: number;
}

export default function UserPanel({
  user,
  cooldownUntil,
  ownedCount,
}: UserPanelProps) {
  if (!user) {
    return (
      <div className="user-panel">
        <div className="panel-loading">Connecting…</div>
      </div>
    );
  }

  return (
    <div className="user-panel">
      <div className="user-identity">
        <div
          className="user-swatch"
          style={
            {
              backgroundColor: user.color,
              boxShadow: `0 0 16px ${user.color}66`,
            } as React.CSSProperties
          }
        />
        <div className="user-meta">
          <div className="user-name">{user.username}</div>
          <div className="user-sub">Your color for this session</div>
        </div>
      </div>

      <div className="user-stats">
        <div className="stat-card">
          <span className="stat-num">{user.captureCount}</span>
          <span className="stat-lbl">Captures</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{ownedCount}</span>
          <span className="stat-lbl">Owned now</span>
        </div>
      </div>

      <CooldownBar cooldownUntil={cooldownUntil} />
    </div>
  );
}
