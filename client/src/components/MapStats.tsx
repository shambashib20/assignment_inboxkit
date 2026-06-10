import { Block, TOTAL_BLOCKS } from '../types';

interface MapStatsProps {
  blocks: Block[];
  onlineCount: number;
}

export default function MapStats({ blocks, onlineCount }: MapStatsProps) {
  const claimed = blocks.filter((b) => b.ownerId !== null).length;
  const pct = blocks.length > 0 ? Math.round((claimed / TOTAL_BLOCKS) * 100) : 0;

  return (
    <div className="map-stats">
      <h3 className="section-title">Map</h3>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-num" style={{ color: '#22c55e' }}>
            {claimed}
          </span>
          <span className="stat-lbl">Claimed</span>
        </div>
        <div className="stat-card">
          <span className="stat-num" style={{ color: '#64748b' }}>
            {TOTAL_BLOCKS - claimed}
          </span>
          <span className="stat-lbl">Free</span>
        </div>
        <div className="stat-card">
          <span className="stat-num" style={{ color: '#6366f1' }}>
            {onlineCount}
          </span>
          <span className="stat-lbl">Online</span>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="progress-label">{pct}% of map claimed</p>
    </div>
  );
}
