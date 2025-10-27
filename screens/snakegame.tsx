// screens/games/SnakeGame.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';

// Game layout constants (rectangular board: fewer rows, more columns)
const DEFAULT_ROWS = 12;
const DEFAULT_COLS = 28;
const GAME_SPEED = 120;
const CONTROL_PANEL_WIDTH = 120;

type Direction = [number, number];

export default function SnakeGame() {
  const { width, height } = useWindowDimensions();

  const ROWS = DEFAULT_ROWS;
  const COLS = DEFAULT_COLS;

  const [snake, setSnake] = useState<[number, number][]>([[Math.floor(COLS / 2), Math.floor(ROWS / 2)]]);
  const [food, setFood] = useState<[number, number]>(() => [Math.floor(COLS * 0.75), Math.floor(ROWS * 0.75)]);
  const [direction, setDirection] = useState<Direction>([1, 0]);
  const [nextDirection, setNextDirection] = useState<Direction>([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Responsive cell size calculation (keeps board fitting horizontally with control panel on right)
  const padding = 16;
  const maxBoardWidth = Math.max(80, width - CONTROL_PANEL_WIDTH - padding * 3);
  const maxBoardHeight = Math.max(80, height - padding * 4 - 80); // allow space for header/title
  const cellSize = Math.max(6, Math.floor(Math.min(maxBoardWidth / COLS, maxBoardHeight / ROWS)));
  const boardWidth = cellSize * COLS;
  const boardHeight = cellSize * ROWS;

  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  // Keyboard event listeners for web/desktop
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameOver || isPaused) return;
      const key = event.key.toLowerCase();
      switch (key) {
        case 'arrowup':
        case 'w':
          if (direction[1] === 0) setNextDirection([0, -1]);
          event.preventDefault();
          break;
        case 'arrowdown':
        case 's':
          if (direction[1] === 0) setNextDirection([0, 1]);
          event.preventDefault();
          break;
        case 'arrowleft':
        case 'a':
          if (direction[0] === 0) setNextDirection([-1, 0]);
          event.preventDefault();
          break;
        case 'arrowright':
        case 'd':
          if (direction[0] === 0) setNextDirection([1, 0]);
          event.preventDefault();
          break;
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [direction, gameOver, isPaused]);

  // Swipe gesture handler for mobile
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart((e) => {
          startX.value = e.x;
          startY.value = e.y;
        })
        .onEnd((e) => {
          if (gameOver || isPaused) return;
          const deltaX = e.x - startX.value;
          const deltaY = e.y - startY.value;
          const threshold = 20;
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > threshold) {
              if (deltaX > 0 && direction[0] === 0) setNextDirection([1, 0]);
              else if (deltaX < 0 && direction[0] === 0) setNextDirection([-1, 0]);
            }
          } else {
            if (Math.abs(deltaY) > threshold) {
              if (deltaY > 0 && direction[1] === 0) setNextDirection([0, 1]);
              else if (deltaY < 0 && direction[1] === 0) setNextDirection([0, -1]);
            }
          }
        }),
    [gameOver, isPaused, direction]
  );

  // Main game loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    gameLoopRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        // Update direction
        setDirection(nextDirection);

        const head = prevSnake[0];
        const newHead: [number, number] = [head[0] + nextDirection[0], head[1] + nextDirection[1]];

        // Check wall collision
        if (newHead[0] < 0 || newHead[0] >= COLS || newHead[1] < 0 || newHead[1] >= ROWS) {
          setGameOver(true);
          return prevSnake;
        }

        // Check self collision
        if (prevSnake.some((seg) => seg[0] === newHead[0] && seg[1] === newHead[1])) {
          setGameOver(true);
          return prevSnake;
        }

        let newSnake = [newHead, ...prevSnake];

        // Check food collision
        if (newHead[0] === food[0] && newHead[1] === food[1]) {
          setScore((s) => s + 10);
          // Generate new food position (avoid snake)
          let newFood: [number, number];
          do {
            newFood = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
          } while (newSnake.some((seg) => seg[0] === newFood[0] && seg[1] === newFood[1]));
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [nextDirection, gameOver, isPaused, food]);

  const handleDirectionChange = (newDir: Direction) => {
    // ignore reverse
    if (direction[0] === -newDir[0] && direction[1] === -newDir[1]) return;
    setNextDirection(newDir);
  };

  const resetGame = () => {
    setSnake([[Math.floor(COLS / 2), Math.floor(ROWS / 2)]]);
    setFood([Math.floor(COLS * 0.75), Math.floor(ROWS * 0.75)]);
    setDirection([1, 0]);
    setNextDirection([1, 0]);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  // Render board cells using absolute positions for consistent sizing
  const cells = [] as React.ReactNode[];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const isSnake = snake.some((seg) => seg[0] === x && seg[1] === y);
      const isFood = food[0] === x && food[1] === y;
      cells.push(
        <View
          key={`cell-${x}-${y}`}
          style={[
            styles.cell,
            {
              width: cellSize,
              height: cellSize,
              left: x * cellSize,
              top: y * cellSize,
            },
            isSnake && styles.snakeCell,
            isFood && styles.foodCell,
          ]}
        />
      );
    }
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.outer}>
          <View style={[styles.boardContainer, { width: boardWidth + 4, height: boardHeight + 4 }]}>
            
            <View style={[styles.board, { width: boardWidth, height: boardHeight }]}>
              {cells}
              {gameOver && (
                <View style={[styles.overlay, { width: boardWidth, height: boardHeight }]}>
                  <Text style={styles.gameOver}>Game Over</Text>
                  <Text style={styles.finalScore}>Score: {score}</Text>
                </View>
              )}
              {isPaused && (
                <View style={[styles.overlay, { width: boardWidth, height: boardHeight }]}>
                  <Text style={styles.paused}>Paused</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.controlsPanel}>
            <Text style={styles.score}>Score</Text>
            <Text style={styles.bigScore}>{score}</Text>

            <View style={styles.controlsRow}>
              <Button title={isPaused ? 'Resume' : 'Pause'} onPress={() => setIsPaused(!isPaused)} />
            </View>

            <View style={styles.controlsRow}>
              <Button title="New Game" onPress={resetGame} />
            </View>

            {!isMobile && (
              <View style={styles.numpad}>
                <View style={styles.numpadRow}>
                  <TouchableOpacity style={styles.nKey} onPress={() => handleDirectionChange([0, -1])}>
                    <Text style={styles.nKeyText}>↑</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.numpadRow}>
                  <TouchableOpacity style={styles.nKey} onPress={() => handleDirectionChange([-1, 0])}>
                    <Text style={styles.nKeyText}>←</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nKey} onPress={() => handleDirectionChange([0, 1])}>
                    <Text style={styles.nKeyText}>↓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.nKey} onPress={() => handleDirectionChange([1, 0])}>
                    <Text style={styles.nKeyText}>→</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  outer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#111827',
    borderRadius: 8,
    padding: 8,
    marginRight: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  board: {
    position: 'relative',
    backgroundColor: '#e6edf3',
    overflow: 'hidden',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
  },
  snakeCell: {
    backgroundColor: '#10b981',
  },
  foodCell: {
    backgroundColor: '#ef4444',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  gameOver: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
  },
  finalScore: {
    fontSize: 16,
    color: '#fff',
  },
  paused: {
    fontSize: 20,
    color: '#ffd166',
    fontWeight: '700',
  },
  controlsPanel: {
    width: CONTROL_PANEL_WIDTH,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6edf3',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  score: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  bigScore: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  controlsRow: {
    width: '100%',
    marginBottom: 10,
  },
  numpad: {
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  numpadRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nKey: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nKeyText: {
    fontSize: 18,
    fontWeight: '700',
  },
});