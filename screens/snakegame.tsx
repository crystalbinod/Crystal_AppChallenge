// screens/games/SnakeGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Button, StyleSheet, Platform, Dimensions } from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const BOARD_SIZE = 20;
const CELL_SIZE = 15;
const GAME_SPEED = 150;

type Direction = [number, number];

export default function SnakeGame() {
  const [snake, setSnake] = useState<[number, number][]>([[10, 10]]);
  const [food, setFood] = useState<[number, number]>([15, 15]);
  const [direction, setDirection] = useState<Direction>([1, 0]);
  const [nextDirection, setNextDirection] = useState<Direction>([1, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

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

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver, isPaused]);

  // Swipe gesture handler for mobile
  const gesture = React.useMemo(
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
          const threshold = 30;

          // Determine swipe direction
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > threshold) {
              if (deltaX > 0 && direction[0] === 0) {
                setNextDirection([1, 0]); // Swipe right
              } else if (deltaX < 0 && direction[0] === 0) {
                setNextDirection([-1, 0]); // Swipe left
              }
            }
          } else {
            if (Math.abs(deltaY) > threshold) {
              if (deltaY > 0 && direction[1] === 0) {
                setNextDirection([0, 1]); // Swipe down
              } else if (deltaY < 0 && direction[1] === 0) {
                setNextDirection([0, -1]); // Swipe up
              }
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
        const newHead: [number, number] = [
          head[0] + nextDirection[0],
          head[1] + nextDirection[1],
        ];

        // Check wall collision
        if (
          newHead[0] < 0 ||
          newHead[0] >= BOARD_SIZE ||
          newHead[1] < 0 ||
          newHead[1] >= BOARD_SIZE
        ) {
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
            newFood = [
              Math.floor(Math.random() * BOARD_SIZE),
              Math.floor(Math.random() * BOARD_SIZE),
            ];
          } while (newSnake.some((seg) => seg[0] === newFood[0] && seg[1] === newFood[1]));
          setFood(newFood);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => clearInterval(gameLoopRef.current);
  }, [nextDirection, gameOver, isPaused, food]);

  const handleDirectionChange = (newDir: Direction) => {
    if (direction[0] !== -newDir[0] || direction[1] !== -newDir[1]) {
      setNextDirection(newDir);
    }
  };

  const resetGame = () => {
    setSnake([[10, 10]]);
    setFood([15, 15]);
    setDirection([1, 0]);
    setNextDirection([1, 0]);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
  };

  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.content}>
          <Text style={styles.title}>Snake Game</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.score}>Score: {score}</Text>
            <Text style={styles.hintText}>
              {isMobile ? 'Swipe to move' : 'Use arrow keys or WASD'}
            </Text>
          </View>

          <View
            style={[
              styles.board,
              {
                width: BOARD_SIZE * CELL_SIZE,
                height: BOARD_SIZE * CELL_SIZE,
              },
            ]}
          >
            {Array.from({ length: BOARD_SIZE }).map((_, y) =>
              Array.from({ length: BOARD_SIZE }).map((_, x) => (
                <View
                  key={`${x}-${y}`}
                  style={[
                    styles.cell,
                    snake.some((seg) => seg[0] === x && seg[1] === y) &&
                      styles.snakeCell,
                    food[0] === x && food[1] === y && styles.foodCell,
                  ]}
                />
              ))
            )}
          </View>

          {gameOver && (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOver}>Game Over!</Text>
              <Text style={styles.finalScore}>Final Score: {score}</Text>
            </View>
          )}

          {isPaused && (
            <View style={styles.pausedContainer}>
              <Text style={styles.paused}>Paused</Text>
            </View>
          )}

          <View style={styles.controlsContainer}>
            {!isMobile && (
              <>
                <View style={styles.arrowContainer}>
                  <Button
                    title="↑"
                    onPress={() => handleDirectionChange([0, -1])}
                  />
                </View>
                <View style={styles.arrowRow}>
                  <Button
                    title="←"
                    onPress={() => handleDirectionChange([-1, 0])}
                  />
                  <Button
                    title="↓"
                    onPress={() => handleDirectionChange([0, 1])}
                  />
                  <Button
                    title="→"
                    onPress={() => handleDirectionChange([1, 0])}
                  />
                </View>
              </>
            )}

            <View style={styles.actionButtons}>
              <Button
                title={isPaused ? 'Resume' : 'Pause'}
                onPress={() => setIsPaused(!isPaused)}
              />
              <Button title="Reset" onPress={resetGame} />
            </View>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  statsContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 3,
    borderColor: '#333',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  snakeCell: {
    backgroundColor: '#4CAF50',
  },
  foodCell: {
    backgroundColor: '#FF5252',
  },
  gameOverContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    zIndex: 100,
  },
  gameOver: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 16,
    color: '#fff',
  },
  pausedContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 10,
    zIndex: 100,
  },
  paused: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  controlsContainer: {
    gap: 15,
    alignItems: 'center',
  },
  arrowContainer: {
    marginBottom: 10,
  },
  arrowRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
});