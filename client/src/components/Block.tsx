import React, { useCallback } from 'react';
import { Block as BlockType } from '../types';

interface BlockProps {
  block: BlockType;
  isCurrentUser: boolean;
  justCaptured: boolean;
  onCapture: (id: number) => void;
}

/**
 * Custom memo comparison — only re-render when ownership or animation state
 * actually changes. With 1200 blocks on screen, this keeps updates O(1) DOM
 * operations per capture instead of O(n).
 */
const Block = React.memo(
  ({ block, isCurrentUser, justCaptured, onCapture }: BlockProps) => {
    const handleClick = useCallback(() => {
      if (isCurrentUser) return; // no-op on own blocks
      onCapture(block.id);
    }, [block.id, isCurrentUser, onCapture]);

    const isOwned = block.ownerId !== null;

    return (
      <div
        className={[
          'block',
          isOwned ? 'owned' : 'unclaimed',
          isCurrentUser ? 'mine' : '',
          justCaptured ? 'just-captured' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          isOwned
            ? ({
                backgroundColor: block.ownerColor!,
                '--block-color': block.ownerColor!,
              } as React.CSSProperties)
            : undefined
        }
        onClick={handleClick}
        title={
          isOwned
            ? `${block.ownerName}${isCurrentUser ? ' (you)' : ''}`
            : 'Unclaimed — click to capture!'
        }
      />
    );
  },
  (prev, next) =>
    prev.block.ownerId === next.block.ownerId &&
    prev.block.ownerColor === next.block.ownerColor &&
    prev.isCurrentUser === next.isCurrentUser &&
    prev.justCaptured === next.justCaptured
);

Block.displayName = 'Block';
export default Block;
