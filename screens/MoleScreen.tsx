// screens/MoleScreen.tsx
// screens/games/WhackAMoleGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Mole {
  id: number;
  active: boolean;
  animation: Animated.Value;
}

export default function WhackAMoleGame() {
  const [moles, setMoles] = useState<Mole[]>(
    Array.from({ length: 9 }, (_, i) => ({
      id: i,
      active: false,
      animation: new Animated.Value(0),
    }))
  );
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const moleIntervalRef = useRef<NodeJS.Timeout>();
  const timerRef = useRef<NodeJS.Timeout>();
  // Part-time stopwatch subscription
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState(false);

  // Start game
  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameActive(true);
    setMoles((prev) =>
      prev.map((mole) => ({ ...mole, active: false, animation: new Animated.Value(0) }))
    );
  };

  // Mole spawning logic
  useEffect(() => {
    if (!gameActive) return;

    moleIntervalRef.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * 9);
      
      setMoles((prev) => {
        const newMoles = [...prev];
        
        // Don't spawn on already active mole
        if (newMoles[randomIndex].active) return prev;

        newMoles[randomIndex] = {
          ...newMoles[randomIndex],
          active: true,
        };

        // Animate mole up
        Animated.sequence([
          Animated.timing(newMoles[randomIndex].animation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(800),
          Animated.timing(newMoles[randomIndex].animation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setMoles((current) => {
            const updated = [...current];
            updated[randomIndex] = { ...updated[randomIndex], active: false };
            return updated;
          });
        });

        return newMoles;
      });
    }, 1000);

    return () => {
      if (moleIntervalRef.current) clearInterval(moleIntervalRef.current);
    };
  }, [gameActive]);

  // Timer countdown
  useEffect(() => {
    if (!gameActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameActive(false);
          if (score > highScore) setHighScore(score);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive, score, highScore]);

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

  const handleMoleClick = (index: number) => {
    if (!gameActive) return;

    setMoles((prev) => {
      if (!prev[index].active) return prev;

      const newMoles = [...prev];
      newMoles[index] = { ...newMoles[index], active: false };

      // Animate down immediately
      Animated.timing(newMoles[index].animation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();

      setScore((s) => s + 10);
      return newMoles;
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={[styles.statValue, timeLeft <= 5 && styles.timeWarning]}>
              {timeLeft}s
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>{highScore}</Text>
          </View>
          <View style={[styles.statBox, { alignItems: 'center' }]}>
            <Text style={styles.statLabel}>Session</Text>
            <Text style={[styles.statValue, { fontSize: 12 }]}>{(() => {
              const totalSec = Math.floor(elapsedMs / 1000);
              const minutes = Math.floor(totalSec / 60);
              const seconds = totalSec % 60;
              return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            })()} {swRunning ? '' : '(paused)'}</Text>
          </View>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        <View style={styles.grid}>
          {moles.map((mole, index) => {
            const translateY = mole.animation.interpolate({
              inputRange: [0, 1],
              outputRange: [60, 0],
            });

            return (
              <View key={mole.id} style={styles.holeContainer}>
                <View style={styles.hole}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleMoleClick(index)}
                    style={styles.touchArea}
                  >
                    <Animated.View
                      style={[
                        styles.mole,
                        {
                          transform: [{ translateY }],
                        },
                      ]}
                    >
                      <View style={styles.moleHead}>
                        <View style={styles.moleEyes}>
                          <View style={styles.eye} />
                          <View style={styles.eye} />
                        </View>
                        <View style={styles.moleNose} />
                      </View>
                    </Animated.View>
                  </TouchableOpacity>
                  <View style={styles.holeShadow} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Start/Game Over Screen */}
      {!gameActive && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            {timeLeft === 0 ? (
              <>
                <Text style={styles.gameOverTitle}>Game Over! 🎮</Text>
                <Text style={styles.finalScore}>Final Score: {score}</Text>
                {score === highScore && score > 0 && (
                  <Text style={styles.newHighScore}>🏆 New High Score! 🏆</Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.welcomeTitle}>Whack-a-Mole!</Text>
                <Text style={styles.instructions}>
                  Tap the moles as they pop up!
                </Text>
              </>
            )}
            <TouchableOpacity style={styles.startButton} onPress={startGame}>
              <Text style={styles.startButtonText}>
                {timeLeft === 0 ? 'Play Again' : 'Start Game'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#34495e',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  timeWarning: {
    color: '#e74c3c',
  },
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 600,
    
    justifyContent: 'center',
    gap: 5,
  },
  holeContainer: {
    width: '30%',
    aspectRatio: 1,
    maxWidth: 100,
    maxHeight: 70,
  },
  hole: {
    width: '70%',
    height: '70%',
    backgroundColor: '#654321',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#3d2817',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  holeShadow: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    height: '30%',
    backgroundColor: '#000',
    opacity: 0.3,
    borderRadius: 999,
  },
  touchArea: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mole: {
    width: '70%',
    aspectRatio: 0.8,
    position: 'absolute',
    bottom: 0,
  },
  moleHead: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B4513',
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderWidth: 2,
    borderColor: '#654321',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  moleEyes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 5,
  },
  eye: {
    width: 8,
    height: 8,
    backgroundColor: '#000',
    borderRadius: 4,
  },
  moleNose: {
    width: 10,
    height: 8,
    backgroundColor: '#654321',
    borderRadius: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: 400,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  instructions: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 15,
  },
  finalScore: {
    fontSize: 20,
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 10,
  },
  newHighScore: {
    fontSize: 16,
    color: '#f39c12',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});