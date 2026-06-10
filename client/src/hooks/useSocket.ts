import { useEffect, useRef, useReducer, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Block, GameState, LeaderboardEntry, User, COOLDOWN_MS } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// ── State shape & actions ────────────────────────────────────────────────────

type Action =
  | { type: 'CONNECTED'; value: boolean }
  | {
      type: 'INIT';
      user: User;
      blocks: Block[];
      onlineCount: number;
      leaderboard: LeaderboardEntry[];
    }
  | {
      type: 'BLOCK_CAPTURED';
      block: Block;
      leaderboard: LeaderboardEntry[];
      onlineCount: number;
    }
  | { type: 'ONLINE_COUNT'; value: number }
  | { type: 'SET_COOLDOWN'; until: number }
  | { type: 'CLEAR_ANIMATION' };

const initialState: GameState = {
  user: null,
  blocks: [],
  onlineCount: 0,
  leaderboard: [],
  connected: false,
  cooldownUntil: 0,
  justCaptured: null,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, connected: action.value };

    case 'INIT':
      return {
        ...state,
        user: action.user,
        blocks: action.blocks,
        onlineCount: action.onlineCount,
        leaderboard: action.leaderboard,
        connected: true,
      };

    case 'BLOCK_CAPTURED': {
      // O(1) block update — only the changed element is replaced
      const blocks = [...state.blocks];
      blocks[action.block.id] = action.block;

      const isMyCapture =
        state.user !== null && action.block.ownerId === state.user.id;

      // Sync local captureCount from the authoritative leaderboard
      let updatedUser = state.user;
      if (isMyCapture && state.user) {
        const entry = action.leaderboard.find(
          (e) => e.userId === state.user!.id
        );
        updatedUser = {
          ...state.user,
          captureCount: entry?.count ?? state.user.captureCount + 1,
        };
      }

      return {
        ...state,
        blocks,
        leaderboard: action.leaderboard,
        onlineCount: action.onlineCount,
        justCaptured: action.block.id,
        // Cooldown starts the moment the server confirms our capture
        cooldownUntil: isMyCapture
          ? Date.now() + COOLDOWN_MS
          : state.cooldownUntil,
        user: updatedUser,
      };
    }

    case 'ONLINE_COUNT':
      return { ...state, onlineCount: action.value };

    case 'SET_COOLDOWN':
      return { ...state, cooldownUntil: action.until };

    case 'CLEAR_ANIMATION':
      return { ...state, justCaptured: null };

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => dispatch({ type: 'CONNECTED', value: true }));
    socket.on('disconnect', () =>
      dispatch({ type: 'CONNECTED', value: false })
    );

    socket.on('init', ({ user, grid, onlineCount, leaderboard }) => {
      dispatch({ type: 'INIT', user, blocks: grid, onlineCount, leaderboard });
    });

    socket.on('block_captured', ({ block, leaderboard, onlineCount }) => {
      dispatch({ type: 'BLOCK_CAPTURED', block, leaderboard, onlineCount });
      setTimeout(() => dispatch({ type: 'CLEAR_ANIMATION' }), 600);
    });

    socket.on('user_joined', ({ onlineCount }) => {
      dispatch({ type: 'ONLINE_COUNT', value: onlineCount });
    });

    socket.on('user_left', ({ onlineCount }) => {
      dispatch({ type: 'ONLINE_COUNT', value: onlineCount });
    });

    // Server corrects our local cooldown state if we somehow desync
    socket.on('capture_failed', ({ reason, cooldownRemaining }) => {
      if (reason === 'cooldown' && typeof cooldownRemaining === 'number') {
        dispatch({
          type: 'SET_COOLDOWN',
          until: Date.now() + cooldownRemaining,
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const captureBlock = useCallback((blockId: number) => {
    socketRef.current?.emit('capture_block', blockId);
  }, []);

  return { state, captureBlock };
}
