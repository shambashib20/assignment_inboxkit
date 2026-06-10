import { useEffect, useState } from 'react';
import { COOLDOWN_MS } from '../types';

interface CooldownBarProps {
  cooldownUntil: number;
}

export default function CooldownBar({ cooldownUntil }: CooldownBarProps) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const r = Math.max(0, cooldownUntil - Date.now());
      setRemaining(r);
      if (r > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cooldownUntil]);

  const isReady = remaining === 0;
  const progress = isReady
    ? 100
    : Math.round((1 - remaining / COOLDOWN_MS) * 100);

  return (
    <div className="cooldown">
      <div className="cooldown-row">
        <span className="cooldown-label">Next capture</span>
        <span className={`cooldown-value ${isReady ? 'ready' : 'cooling'}`}>
          {isReady ? 'Ready!' : `${(remaining / 1000).toFixed(1)}s`}
        </span>
      </div>
      <div className="cooldown-track">
        <div
          className={`cooldown-fill ${isReady ? 'ready' : 'cooling'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
