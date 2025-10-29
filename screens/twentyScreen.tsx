import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

type Grid = number[][];

const SIZE = 4;
const START_TILES = 2;

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

function cloneGrid(g: Grid) {
  return g.map((r) => r.slice());
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function spawnRandomTile(grid: Grid) {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empties.push([r, c]);
    }
  }
  if (empties.length === 0) return grid;
  const [r, c] = empties[randomInt(empties.length)];
  // 90% chance 2, 10% chance 4
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return grid;
}

function compressRow(row: number[]) {
  const newRow = row.filter((v) => v !== 0);
  while (newRow.length < SIZE) newRow.push(0);
  return newRow;
}

// move left logic for one row, returns [newRow, gainedScore]
function mergeRowLeft(row: number[]): [number[], number] {
  let score = 0;
  const arr = compressRow(row);
  for (let i = 0; i < SIZE - 1; i++) {
    if (arr[i] !== 0 && arr[i] === arr[i + 1]) {
      arr[i] = arr[i] * 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  const final = compressRow(arr);
  return [final, score];
}

function transpose(grid: Grid) {
  const g = emptyGrid();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) g[r][c] = grid[c][r];
  return g;
}

function reverseRows(grid: Grid) {
  return grid.map((r) => r.slice().reverse());
}

function moveLeft(grid: Grid): { grid: Grid; moved: boolean; gained: number } {
  let moved = false;
  let gained = 0;
  const newGrid = cloneGrid(grid);
  for (let r = 0; r < SIZE; r++) {
    const [row, score] = mergeRowLeft(newGrid[r]);
    gained += score;
    if (row.some((v, i) => v !== newGrid[r][i])) moved = true;
    newGrid[r] = row;
  }
  return { grid: newGrid, moved, gained };
}

function moveRight(grid: Grid) {
  const reversed = reverseRows(grid);
  const res = moveLeft(reversed);
  return { grid: reverseRows(res.grid), moved: res.moved, gained: res.gained };
}

function moveUp(grid: Grid) {
  const t = transpose(grid);
  const res = moveLeft(t);
  return { grid: transpose(res.grid), moved: res.moved, gained: res.gained };
}

function moveDown(grid: Grid) {
  const t = transpose(grid);
  const res = moveRight(t);
  return { grid: transpose(res.grid), moved: res.moved, gained: res.gained };
}

function canMove(grid: Grid) {
  // if any empty
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) return true;
  // check merges horizontally
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE - 1; c++) if (grid[r][c] === grid[r][c + 1]) return true;
  // check merges vertically
  for (let c = 0; c < SIZE; c++) for (let r = 0; r < SIZE - 1; r++) if (grid[r][c] === grid[r + 1][c]) return true;
  return false;
}

const COLORS: Record<number, string> = {
  2: '#eee4da',
  4: '#ede0c8',
  8: '#f2b179',
  16: '#f59563',
  32: '#f67c5f',
  64: '#f65e3b',
  128: '#edcf72',
  256: '#edcc61',
  512: '#edc850',
  1024: '#edc53f',
  2048: '#edc22e',
};

export default function Game2048Screen() {
  const { width, height } = useWindowDimensions();
  const [grid, setGrid] = useState<Grid>(() => emptyGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const padding = 16;
  const controlWidth = 120;
  const maxBoardWidth = Math.max(140, width - controlWidth - padding * 3);
  const maxBoardHeight = Math.max(140, height - padding * 4 - 80);
  const cellSize = Math.floor(Math.min(maxBoardWidth / SIZE, maxBoardHeight / SIZE));
  const boardSize = cellSize * SIZE;

  // initialize
  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newGame() {
    let g = emptyGrid();
    for (let i = 0; i < START_TILES; i++) g = spawnRandomTile(g);
    setGrid(g);
    setScore(0);
    setGameOver(false);
  }

  function makeMove(dir: 'left' | 'right' | 'up' | 'down') {
    if (gameOver) return;
    let res;
    if (dir === 'left') res = moveLeft(grid);
    else if (dir === 'right') res = moveRight(grid);
    else if (dir === 'up') res = moveUp(grid);
    else res = moveDown(grid);

    if (res.moved) {
      const newGrid = spawnRandomTile(res.grid);
      const newScore = score + res.gained;
      setGrid(newGrid);
      setScore(newScore);
      setBest((b) => Math.max(b, newScore));
      if (!canMove(newGrid)) setGameOver(true);
    }
  }

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') makeMove('left');
      if (k === 'arrowright' || k === 'd') makeMove('right');
      if (k === 'arrowup' || k === 'w') makeMove('up');
      if (k === 'arrowdown' || k === 's') makeMove('down');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [grid, score, gameOver]);

  // swipe gestures
  const gesture = Gesture.Pan().onEnd((e) => {
    const vx = e.velocityX ?? 0;
    const vy = e.velocityY ?? 0;
    const deltaX = e.translationX ?? 0;
    const deltaY = e.translationY ?? 0;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const threshold = 20;
    if (absX < threshold && absY < threshold) return;
    if (absX > absY) {
      if (deltaX > 0) makeMove('right');
      else makeMove('left');
    } else {
      if (deltaY > 0) makeMove('down');
      else makeMove('up');
    }
  });

  // render tiles
  const tiles = useMemo(() => {
    const out: React.ReactNode[] = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = grid[r][c];
        const left = c * cellSize;
        const top = r * cellSize;
        const bg = val === 0 ? '#ede8df' : COLORS[val] ?? '#3c3a32';
        out.push(
          <View
            key={`tile-${r}-${c}`}
            style={[
              styles.tile,
              {
                width: cellSize - 8,
                height: cellSize - 8,
                left: left + 4,
                top: top + 4,
                backgroundColor: bg,
              },
            ]}
          >
            {val !== 0 && (
              <Text style={[styles.tileText, { fontSize: Math.max(14, cellSize / 3) }]}>{val}</Text>
            )}
          </View>
        );
      }
    }
    return out;
  }, [grid, cellSize]);







  
  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View style={styles.outer}>
          <View style={[styles.boardWrap, { width: boardSize + 8, height: boardSize + 8 }]}>
            
            <View style={[styles.board, { width: boardSize, height: boardSize }]}>
              {tiles}
              {gameOver && (
                <View style={[styles.overlay, { width: boardSize, height: boardSize }]}>
                  <Text style={styles.overlayTitle}>Game Over</Text>
                  <TouchableOpacity onPress={newGame} style={styles.overlayButton}>
                    <Text style={styles.overlayButtonText}>New Game</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>{score}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Best</Text>
              <Text style={styles.scoreValue}>{best}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={newGame}>
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />
            <Text style={styles.hint}>Swipe to move (or use arrow keys)</Text>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7fafc' },
  outer: { flex: 1, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  boardWrap: { backgroundColor: '#fff', borderRadius: 8, padding: 4, marginRight: 16, borderWidth: 2, borderColor: '#ccc', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111' },
  board: { position: 'relative', backgroundColor: '#bbada0', borderRadius: 6, overflow: 'hidden' },
  tile: { position: 'absolute', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontWeight: '800', color: '#111' },
  overlay: { position: 'absolute', left: 0, top: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  overlayTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  overlayButton: { backgroundColor: '#f2b179', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  overlayButtonText: { color: '#111', fontWeight: '700' },
  controls: { width: 120, alignItems: 'center' },
  scoreBox: { backgroundColor: '#fff', padding: 8, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  scoreLabel: { fontSize: 12, color: '#666' },
  scoreValue: { fontSize: 20, fontWeight: '800' },
  button: { backgroundColor: '#8f5a3b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 12, color: '#666', textAlign: 'center' },
});
