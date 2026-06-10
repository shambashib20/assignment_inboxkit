import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Block from './Block';
import { Block as BlockType, GRID_COLS } from '../types';

interface GridProps {
  blocks: BlockType[];
  currentUserId: string | null;
  justCaptured: number | null;
  onCapture: (id: number) => void;
}

export default function Grid({
  blocks,
  currentUserId,
  justCaptured,
  onCapture,
}: GridProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Passive: false so we can call preventDefault and block native scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((prev) => {
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        return Math.min(3, Math.max(0.35, prev + delta));
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle-click or Shift+left-drag to pan
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsDragging(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const stopDrag = useCallback(() => setIsDragging(false), []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  if (blocks.length === 0) {
    return (
      <div className="grid-loading">
        <span className="grid-loading-dot" />
        Connecting to server…
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`grid-viewport${isDragging ? ' dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      <div
        className="grid-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="grid-inner"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, 22px)`,
            gap: '1px',
          }}
        >
          {blocks.map((block) => (
            <Block
              key={block.id}
              block={block}
              isCurrentUser={block.ownerId === currentUserId}
              justCaptured={justCaptured === block.id}
              onCapture={onCapture}
            />
          ))}
        </div>
      </div>

      <div className="zoom-controls">
        <button
          className="zoom-btn"
          onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
          title="Zoom in"
        >
          +
        </button>
        <button
          className="zoom-btn zoom-pct"
          onClick={resetView}
          title="Reset view"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          className="zoom-btn"
          onClick={() => setZoom((z) => Math.max(0.35, z - 0.25))}
          title="Zoom out"
        >
          −
        </button>
      </div>

      <div className="grid-hint">Scroll to zoom · Shift+drag to pan</div>
    </div>
  );
}
