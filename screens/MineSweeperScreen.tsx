// screens/Job1Screen.tsx
import * as React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';

export default function MineSweeperScreen() {
  // rectangle dimensions (rows x cols)
  const GRID_ROWS = 6;
  const GRID_COLS = 12;
  const MINE_COUNT = 12;

  // responsive sizing: leave room on the right for control panel
  const { width } = useWindowDimensions();
  const HORIZONTAL_PADDING = 40;
  const CONTROL_PANEL_WIDTH = 120;
  const CELL_MARGIN = 2;
  const availableWidth = Math.max(120, width - HORIZONTAL_PADDING - CONTROL_PANEL_WIDTH);
  const computedCell = Math.floor((availableWidth - (GRID_COLS - 1) * CELL_MARGIN) / GRID_COLS);
  // clamp very small if needed
  const cellSize = Math.max(8, Math.min(24, computedCell));

  const generateBoard = React.useCallback((): (number | string)[][] => {
    const newBoard: (number | string)[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const r = Math.floor(Math.random() * GRID_ROWS);
      const c = Math.floor(Math.random() * GRID_COLS);
      if (newBoard[r][c] !== 'M') {
        newBoard[r][c] = 'M';
        minesPlaced++;
      }
    }
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (newBoard[r][c] !== 'M') {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS && newBoard[nr][nc] === 'M') count++;
            }
          }
          newBoard[r][c] = count;
        }
      }
    }
    return newBoard;
  }, []);

  const [board, setBoard] = React.useState<(number | string)[][]>(() => generateBoard());
  const [revealed, setRevealed] = React.useState<boolean[][]>(
    Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false))
  );
  const [gameOver, setGameOver] = React.useState(false);
  const [won, setWon] = React.useState(false);

  // reveal logic with flood-fill for zeros
  const handleCellPress = (row: number, col: number) => {
    if (gameOver || won || revealed[row][col]) return;
    const newRevealed = revealed.map(r => [...r]);

    if (board[row][col] === 'M') {
      setGameOver(true);
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (board[r][c] === 'M') newRevealed[r][c] = true;
        }
      }
      setRevealed(newRevealed);
      return;
    }

    const revealRecursive = (r: number, c: number) => {
      if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return;
      if (newRevealed[r][c]) return;
      newRevealed[r][c] = true;
      if (board[r][c] === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            revealRecursive(r + dr, c + dc);
          }
        }
      }
    };

    revealRecursive(row, col);

    // check win
    let allSafeRevealed = true;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (board[r][c] !== 'M' && !newRevealed[r][c]) {
          allSafeRevealed = false;
          break;
        }
      }
      if (!allSafeRevealed) break;
    }

    setRevealed(newRevealed);
    if (allSafeRevealed) setWon(true);
  };

  const resetGame = () => {
    setBoard(generateBoard());
    setRevealed(Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false)));
    setGameOver(false);
    setWon(false);
  };

  // Part-time stopwatch subscription (show session time in control panel)
  const [elapsedMs, setElapsedMs] = React.useState<number>(0);
  const [swRunning, setSwRunning] = React.useState(false);
  React.useEffect(() => {
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

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2E5D7', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#C97D60' }}>Minesweeper</Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Grid area (left) */}
        <View style={{ width: cellSize * GRID_COLS + CELL_MARGIN * (GRID_COLS - 1), marginRight: 12 }}>
          <ScrollView horizontal={false} contentContainerStyle={{}}>
            {board.map((row, rIdx) => (
              <View key={rIdx} style={{ flexDirection: 'row' }}>
                {row.map((cell, cIdx) => (
                  <TouchableOpacity
                    key={`${rIdx}-${cIdx}`}
                    onPress={() => handleCellPress(rIdx, cIdx)}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      marginRight: cIdx === GRID_COLS - 1 ? 0 : CELL_MARGIN,
                      marginBottom: CELL_MARGIN,
                      backgroundColor: revealed[rIdx][cIdx]
                        ? cell === 'M'
                          ? '#FF6B6B'
                          : '#E8F5E9'
                        : '#87CEEB',
                      borderWidth: 1,
                      borderColor: '#63372C',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: Math.max(6, Math.floor(cellSize * 0.6)), fontWeight: 'bold', color: '#63372C' }}>
                      {revealed[rIdx][cIdx] ? (cell === 'M' ? '💣' : cell === 0 ? '' : String(cell)) : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Control panel (right) */}                                                          
        <View style={{ width: CONTROL_PANEL_WIDTH, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#63372C', marginBottom: 8 }}>
            {gameOver ? '💣 Game Over!' : won ? '🎉 You Won!' : 'Click to reveal'}
          </Text>

          <TouchableOpacity
            onPress={resetGame}
            style={{
              backgroundColor: '#C97D60',
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#63372C',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>New Game</Text>
          </TouchableOpacity>
          <View style={{ height: 8 }} />
          <Text style={{ fontSize: 12, color: '#6b7280' }}>Session: {(() => {
            const totalSec = Math.floor(elapsedMs / 1000);
            const minutes = Math.floor(totalSec / 60);
            const seconds = totalSec % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          })()} {swRunning ? '' : '(paused)'}</Text>
        </View>
      </View>
    </View>
  );
}