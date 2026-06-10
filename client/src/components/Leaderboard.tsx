import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string | null;
}

const RANK_COLORS = ['#fbbf24', '#94a3b8', '#b45309'];

export default function Leaderboard({
  entries,
  currentUserId,
}: LeaderboardProps) {
  return (
    <div className="leaderboard">
      <h3 className="section-title">Leaderboard</h3>

      {entries.length === 0 ? (
        <p className="empty-msg">No captures yet — be the first!</p>
      ) : (
        <ol className="lb-list">
          {entries.map((entry, i) => (
            <li
              key={entry.userId}
              className={`lb-item${entry.userId === currentUserId ? ' is-me' : ''}`}
            >
              <span
                className="lb-rank"
                style={{ color: RANK_COLORS[i] ?? 'var(--text3)' }}
              >
                {i + 1}
              </span>
              <span
                className="lb-dot"
                style={{ backgroundColor: entry.color }}
              />
              <span className="lb-name">
                {entry.username}
                {entry.userId === currentUserId && (
                  <span className="lb-you"> you</span>
                )}
              </span>
              <span className="lb-count">{entry.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
