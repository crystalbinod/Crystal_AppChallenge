import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Rectangular memory matching game (board left, control panel right)
const DEFAULT_ROWS = 4; // rectangular: 4 rows
const DEFAULT_COLS = 6; // rectangular: 6 cols -> 24 tiles (12 pairs)

type Tile = {
  id: number;
  value: number;
  revealed: boolean;
  matched: boolean;
};

function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildTiles(rows: number, cols: number): Tile[] {
  const pairs = (rows * cols) / 2;
  const values: number[] = [];
  for (let i = 0; i < pairs; i++) values.push(i + 1, i + 1);
  shuffleArray(values);
  return values.map((v, i) => ({ id: i, value: v, revealed: false, matched: false }));
}

export default function MemoryScreen() {
  const { width, height } = useWindowDimensions();
  const ROWS = DEFAULT_ROWS;
  const COLS = DEFAULT_COLS;

  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(ROWS, COLS));
  const [firstIdx, setFirstIdx] = useState<number | null>(null);
  const [secondIdx, setSecondIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  // Part-time stopwatch subscription
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState(false);
  const [bestMoves, setBestMoves] = useState<number | null>(null);

  const padding = 16;
  const CONTROL_PANEL_WIDTH = 120;
  const maxBoardWidth = Math.max(80, width - CONTROL_PANEL_WIDTH - padding * 3);
  const maxBoardHeight = Math.max(80, height - padding * 4 - 80);
  const cellSize = Math.max(28, Math.floor(Math.min(maxBoardWidth / COLS, maxBoardHeight / ROWS)));
  const boardWidth = cellSize * COLS;
  const boardHeight = cellSize * ROWS;

  useEffect(() => {
    // reset on mount
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sw = require('../lib/stopwatch_parttime').default;
      unsub = sw.subscribe((ms: number, running: boolean) => {
        setElapsedMs(ms);
        setSwRunning(running);
      });
    } catch (e) {
      // ignore
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const resetGame = () => {
    setTiles(buildTiles(ROWS, COLS));
    setFirstIdx(null);
    setSecondIdx(null);
    setBusy(false);
    setMoves(0);
    setMatches(0);
  };

  const onTilePress = (idx: number) => {
    if (busy) return;
    const t = tiles[idx];
    if (t.matched || t.revealed) return;

    const newTiles = tiles.slice();
    newTiles[idx] = { ...t, revealed: true };
    setTiles(newTiles);

    if (firstIdx === null) {
      setFirstIdx(idx);
      return;
    }

    if (secondIdx === null) {
      setSecondIdx(idx);
      setBusy(true);
      setMoves((m) => m + 1);

      // compare
      const first = newTiles[firstIdx];
      const second = newTiles[idx];

      if (first.value === second.value) {
        // match
        newTiles[firstIdx] = { ...first, matched: true };
        newTiles[idx] = { ...second, matched: true };
        setTiles(newTiles);
        setMatches((s) => s + 1);
        setFirstIdx(null);
        setSecondIdx(null);
        setBusy(false);
        // check finished
        const pairs = (ROWS * COLS) / 2;
        if (matches + 1 >= pairs) {
          // finished
          if (bestMoves === null || moves + 1 < bestMoves) setBestMoves(moves + 1);
        }
      } else {
        // not a match: hide after timeout
        setTimeout(() => {
          const hidden = newTiles.slice();
          hidden[firstIdx] = { ...hidden[firstIdx], revealed: false };
          hidden[idx] = { ...hidden[idx], revealed: false };
          setTiles(hidden);
          setFirstIdx(null);
          setSecondIdx(null);
          setBusy(false);
        }, 600);
      }
    }
  };

  const tilesRender = useMemo(() => {
    return tiles.map((t, i) => {
      const left = (i % COLS) * cellSize;
      const top = Math.floor(i / COLS) * cellSize;
      return (
        <TouchableOpacity
          key={t.id}
          onPress={() => onTilePress(i)}
          activeOpacity={0.9}
          style={[
            styles.tile,
            {
              width: cellSize - 8,
              height: cellSize - 8,
              left: left + 4,
              top: top + 4,
              backgroundColor: t.matched ? '#e6f7ea' : t.revealed ? '#fff' : '#dbeafe',
            },
          ]}
        >
          {t.revealed || t.matched ? <Text style={styles.tileText}>{t.value}</Text> : null}
        </TouchableOpacity>
      );
    });
  }, [tiles, cellSize]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.outer}>
        <View style={[styles.boardContainer, { width: boardWidth + 8, height: boardHeight + 8 }]}>
          
          <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>{tilesRender}</View>
        </View>

        <View style={styles.controlsPanel}>
          <Text style={styles.scoreLabel}>Moves</Text>
          <Text style={styles.bigScore}>{moves}</Text>

          <Text style={[styles.scoreLabel, { marginTop: 8 }]}>Matches</Text>
          <Text style={styles.bigScore}>{matches}</Text>

          <View style={{ height: 12 }} />
          <TouchableOpacity style={styles.button} onPress={resetGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>Session: {(() => {
            const totalSec = Math.floor(elapsedMs / 1000);
            const minutes = Math.floor(totalSec / 60);
            const seconds = totalSec % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          })()} {swRunning ? '' : '(paused)'}</Text>

          <View style={{ height: 12 }} />
          <Text style={styles.hint}>Tap tiles to reveal and match pairs.</Text>
          {bestMoves !== null && (
            <>
              <View style={{ height: 10 }} />
              <Text style={styles.best}>Best: {bestMoves} moves</Text>
            </>
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc' },
  outer: { flex: 1, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  boardContainer: { backgroundColor: '#fff', borderRadius: 8, padding: 4, marginRight: 16, borderWidth: 2, borderColor: '#e6edf3', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111827' },
  board: { position: 'relative', backgroundColor: '#eef2ff', borderRadius: 6, overflow: 'hidden' },
  tile: { position: 'absolute', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontWeight: '800', color: '#111827' },
  controlsPanel: { width: 120, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e6edf3', alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: '#6b7280' },
  bigScore: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 },
  button: { backgroundColor: '#8f5a3b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  best: { fontSize: 12, color: '#374151', marginTop: 6 },
});
