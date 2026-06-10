import { useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import Header from './components/Header';
import Grid from './components/Grid';
import Sidebar from './components/Sidebar';

export default function App() {
  const { state, captureBlock } = useSocket();

  const handleCapture = useCallback(
    (blockId: number) => {
      // Client-side cooldown guard — prevents redundant server round-trips
      if (Date.now() < state.cooldownUntil) return;
      captureBlock(blockId);
    },
    [captureBlock, state.cooldownUntil]
  );

  return (
    <div className="app">
      <Header
        user={state.user}
        onlineCount={state.onlineCount}
        connected={state.connected}
      />
      <div className="app-body">
        <main className="grid-area">
          <Grid
            blocks={state.blocks}
            currentUserId={state.user?.id ?? null}
            justCaptured={state.justCaptured}
            onCapture={handleCapture}
          />
        </main>
        <Sidebar
          user={state.user}
          blocks={state.blocks}
          leaderboard={state.leaderboard}
          onlineCount={state.onlineCount}
          cooldownUntil={state.cooldownUntil}
        />
      </div>
    </div>
  );
}
