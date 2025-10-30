// screens/CupPongScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

// iPhone 12 horizontal dimensions
const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Cup {
  id: number;
  x: number;
  y: number;
  hit: boolean;
}

export default function CupPongGame() {
  const [cups, setCups] = useState<Cup[]>(generateCups());
  const [score, setScore] = useState(0);
  const [balls, setBalls] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 200 });
  const [isThrowing, setIsThrowing] = useState(false);
  const [throwingBall, setThrowingBall] = useState<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const ballAnim = useRef(new Animated.ValueXY({ x: 50, y: 200 })).current;

  function generateCups(): Cup[] {
    const cupWidth = 50;
    const cupHeight = 60;
    const startX = SCREEN_WIDTH - 250;
    const startY = 5;
    
    // Triangle formation: 4-3-2-1
    const cups: Cup[] = [];
    let id = 0;
    
    // Row 1: 4 cups
    for (let i = 0; i < 4; i++) {
      cups.push({ id: id++, x: startX + i * 60, y: startY, hit: false });
    }
    
    // Row 2: 3 cups
    for (let i = 0; i < 3; i++) {
      cups.push({ id: id++, x: startX + 30 + i * 60, y: startY + 50, hit: false });
    }
    
    // Row 3: 2 cups
    for (let i = 0; i < 2; i++) {
      cups.push({ id: id++, x: startX + 60 + i * 60, y: startY + 100, hit: false });
    }
    
    // Row 4: 1 cup
    cups.push({ id: id++, x: startX + 90, y: startY + 150, hit: false });
    
    return cups;
  }

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (!isThrowing && balls > 0) {
      setBallPosition({
        x: Math.max(30, Math.min(event.nativeEvent.absoluteX, 150)),
        y: Math.max(30, Math.min(event.nativeEvent.absoluteY, SCREEN_HEIGHT - 30)),
      });
    }
  };

  const onGestureEnd = (event: PanGestureHandlerGestureEvent) => {
    if (isThrowing || balls <= 0) return;

    const velocityX = event.nativeEvent.velocityX;
    const velocityY = event.nativeEvent.velocityY;

    // Only throw if there's enough velocity to the right
    if (velocityX > 500) {
      setIsThrowing(true);
      setBalls(balls - 1);
      
      setThrowingBall({
        x: ballPosition.x,
        y: ballPosition.y,
        vx: velocityX / 200,
        vy: velocityY / 200,
      });
    }
  };

  // Physics simulation for ball
  useEffect(() => {
    if (!throwingBall) return;

    const interval = setInterval(() => {
      setThrowingBall((prev) => {
        if (!prev) return null;

        let newX = prev.x + prev.vx;
        let newY = prev.y + prev.vy;
        let newVy = prev.vy + 0.3; // Gravity

        // Check cup collisions
        cups.forEach((cup) => {
          if (!cup.hit) {
            const distance = Math.sqrt(
              Math.pow(newX - (cup.x + 25), 2) + Math.pow(newY - (cup.y + 30), 2)
            );
            
            if (distance < 40) {
              setCups((prevCups) =>
                prevCups.map((c) => (c.id === cup.id ? { ...c, hit: true } : c))
              );
              setScore((s) => s + 100);
            }
          }
        });

        // Ball out of bounds
        if (newX > SCREEN_WIDTH || newY > SCREEN_HEIGHT || newY < 0) {
          setIsThrowing(false);
          setBallPosition({ x: 50, y: SCREEN_HEIGHT / 2 });
          return null;
        }

        return { x: newX, y: newY, vx: prev.vx, vy: newVy };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [throwingBall, cups]);

  // Check game over
  useEffect(() => {
    if (balls === 0 && !isThrowing) {
      setGameOver(true);
    }
    
    const allHit = cups.every((cup) => cup.hit);
    if (allHit) {
      setGameOver(true);
    }
  }, [balls, isThrowing, cups]);

  const resetGame = () => {
    setCups(generateCups());
    setScore(0);
    setBalls(3);
    setGameOver(false);
    setBallPosition({ x: 50, y: SCREEN_HEIGHT / 2 });
    setIsThrowing(false);
    setThrowingBall(null);
  };

  // Freelance stopwatch subscription
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState(false);
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sw = require('../lib/stopwatch_freelance').default;
      unsub = sw.subscribe((ms: number, running: boolean) => {
        setElapsedMs(ms);
        setSwRunning(running);
      });
    } catch (e) {
      // ignore
    }
    return () => { if (unsub) unsub(); };
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const activeCups = cups.filter((cup) => !cup.hit);
  const allCupsHit = cups.every((cup) => cup.hit);

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onEnded={onGestureEnd}
      >
        <View style={styles.gameArea}>
          {/* Header */}
          <View style={styles.header}>
            
            <View style={styles.stats}>
              <Text style={styles.statText}>Score: {score}</Text>
              <Text style={styles.statText}>Balls: {balls}</Text>
              <Text style={[styles.statText, { fontSize: 12, marginTop: 4 }]}>Session: {formatTime(elapsedMs)} {swRunning ? '' : '(paused)'}</Text>
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            {/* Cups */}
            {cups.map((cup) => (
              <View
                key={cup.id}
                style={[
                  styles.cup,
                  { left: cup.x, top: cup.y },
                  cup.hit && styles.cupHit,
                ]}
              >
                <View style={styles.cupTop} />
                <View style={styles.cupBody} />
              </View>
            ))}

            {/* Ball being thrown */}
            {throwingBall && (
              <View
                style={[
                  styles.ball,
                  {
                    left: throwingBall.x - 15,
                    top: throwingBall.y - 15,
                  },
                ]}
              />
            )}

            {/* Ball in hand */}
            {!isThrowing && balls > 0 && (
              <View
                style={[
                  styles.ball,
                  {
                    left: ballPosition.x - 15,
                    top: ballPosition.y - 15,
                  },
                ]}
              />
            )}

            {/* Instructions */}
            {!isThrowing && balls > 0 && !gameOver && (
              <View style={styles.instructions}>
                <Text style={styles.instructionText}>
                  Drag and swipe to throw! →
                </Text>
              </View>
            )}
          </View>

          {/* Game Over Screen */}
          {gameOver && (
            <View style={styles.gameOverContainer}>
              <View style={styles.gameOverBox}>
                <Text style={styles.gameOverTitle}>
                  {allCupsHit ? '🎉 Perfect!' : 'Game Over'}
                </Text>
                <Text style={styles.gameOverScore}>Final Score: {score}</Text>
                <Text style={styles.gameOverStats}>
                  Cups Hit: {cups.filter((c) => c.hit).length}/10
                </Text>
                <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                  <Text style={styles.resetButtonText}>Play Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a472a',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  stats: {
    alignItems: 'flex-end',
  },
  statText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  table: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#2d5a3d',
    marginHorizontal: 10,
    marginVertical: 0,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#1a472a',
  },
  cup: {
    position: 'absolute',
    width: 50,
    height: 60,
    alignItems: 'center',
  },
  cupTop: {
    width: 50,
    height: 15,
    backgroundColor: '#e74c3c',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 2,
    borderColor: '#c0392b',
  },
  cupBody: {
    width: 40,
    height: 30,
    backgroundColor: '#e74c3c',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    borderWidth: 2,
    borderColor: '#c0392b',
    borderTopWidth: 0,
  },
  cupHit: {
    opacity: 0.2,
  },
  ball: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f39c12',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  instructions: {
    position: 'absolute',
    left: 20,
    top: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 250,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  gameOverScore: {
    fontSize: 20,
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 8,
  },
  gameOverStats: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});