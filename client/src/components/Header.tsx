import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onlineCount: number;
  connected: boolean;
}

export default function Header({ user, onlineCount, connected }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <svg
          className="brand-icon"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="9" height="9" rx="1.5" fill="#818cf8" />
          <rect
            x="12"
            y="1"
            width="9"
            height="9"
            rx="1.5"
            fill="#a78bfa"
            opacity="0.7"
          />
          <rect
            x="1"
            y="12"
            width="9"
            height="9"
            rx="1.5"
            fill="#a78bfa"
            opacity="0.7"
          />
          <rect x="12" y="12" width="9" height="9" rx="1.5" fill="#818cf8" />
        </svg>
        <span className="brand-name">GriddyTest</span>
        <span className="brand-sep">·</span>
        <span className="brand-tag">Claim your territory</span>
      </div>

      <div className="header-right">
        <div className={`conn-badge ${connected ? "online" : "offline"}`}>
          <span className="conn-dot" />
          {connected ? `${onlineCount} online` : "Reconnecting…"}
        </div>

        {user && (
          <div className="header-user">
            <span
              className="header-user-dot"
              style={{ backgroundColor: user.color }}
            />
            <span className="header-user-name">{user.username}</span>
          </div>
        )}
      </div>
    </header>
  );
}
