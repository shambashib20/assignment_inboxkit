import { Block, GRID_ROWS, GRID_COLS, TOTAL_BLOCKS } from './types';

export class GridManager {
  private grid: Block[];

  constructor() {
    this.grid = this.initGrid();
  }

  private initGrid(): Block[] {
    const blocks: Block[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        blocks.push({
          id: row * GRID_COLS + col,
          row,
          col,
          ownerId: null,
          ownerName: null,
          ownerColor: null,
          capturedAt: null,
        });
      }
    }
    return blocks;
  }

  getGrid(): Block[] {
    return this.grid;
  }

  getBlock(id: number): Block | null {
    if (id < 0 || id >= TOTAL_BLOCKS) return null;
    return this.grid[id];
  }

  /**
   * Core capture logic — Node.js is single-threaded, so this is
   * inherently race-condition-free: the first event processed wins.
   *
   * Returns:
   *   Block  — success, block now belongs to userId
   *   false  — user already owns this block
   *   null   — blockId out of range
   */
  capture(
    blockId: number,
    userId: string,
    username: string,
    color: string
  ): Block | false | null {
    const block = this.getBlock(blockId);
    if (!block) return null;
    if (block.ownerId === userId) return false;

    block.ownerId = userId;
    block.ownerName = username;
    block.ownerColor = color;
    block.capturedAt = Date.now();
    return block;
  }

  getStats(): { total: number; claimed: number; unclaimed: number } {
    const claimed = this.grid.filter((b) => b.ownerId !== null).length;
    return { total: TOTAL_BLOCKS, claimed, unclaimed: TOTAL_BLOCKS - claimed };
  }
}
