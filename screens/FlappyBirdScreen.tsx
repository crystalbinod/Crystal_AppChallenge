// screens/FlappyBirdScreen.tsx
// screens/games/FlappyBirdGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

const GAME_WIDTH = 900;
const GAME_HEIGHT = 280;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.8;
const FLAP_STRENGTH = -8;
const GAME_SPEED = 3;

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
}

export default function FlappyBirdGame() {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout>();
  const pipeIdCounter = useRef(0);
  const birdRotation = useRef(new Animated.Value(0)).current;

  // Freelance stopwatch subscription (show session time in this game)
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

  // Bird rotation animation based on velocity
  useEffect(() => {
    Animated.timing(birdRotation, {
      toValue: Math.max(-30, Math.min(30, birdVelocity * 3)),
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [birdVelocity]);

  // Handle flap
  const handleFlap = () => {
    if (!gameActive && !gameOver) {
      startGame();
      return;
    }
    if (gameActive && !gameOver) {
      setBirdVelocity(FLAP_STRENGTH);
    }
  };

  // Start game
  const startGame = () => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([
      { id: pipeIdCounter.current++, x: GAME_WIDTH, topHeight: Math.random() * 150 + 50, passed: false },
    ]);
    setScore(0);
    setGameActive(true);
    setGameOver(false);
  };

  // Reset game
  const resetGame = () => {
    setGameOver(false);
    setGameActive(false);
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
  };

  // Main game loop
  useEffect(() => {
    if (!gameActive || gameOver) return;

    gameLoopRef.current = setInterval(() => {
      // Update bird position
      setBirdY((prevY) => {
        const newY = prevY + birdVelocity;
        
        // Check ceiling and floor collision
        if (newY <= 0 || newY >= GAME_HEIGHT - BIRD_SIZE) {
          setGameOver(true);
          setGameActive(false);
          if (score > highScore) setHighScore(score);
          return prevY;
        }
        
        return newY;
      });

      // Update bird velocity (gravity)
      setBirdVelocity((prevVel) => prevVel + GRAVITY);

      // Update pipes
      setPipes((prevPipes) => {
        let newPipes = prevPipes.map((pipe) => {
          const newPipe = { ...pipe, x: pipe.x - GAME_SPEED };
          
          // Check if bird passed pipe
          if (!pipe.passed && newPipe.x + PIPE_WIDTH < GAME_WIDTH / 4) {
            setScore((s) => s + 1);
            newPipe.passed = true;
          }

          return newPipe;
        });

        // Remove off-screen pipes
        newPipes = newPipes.filter((pipe) => pipe.x > -PIPE_WIDTH);

        // Add new pipe
        const lastPipe = newPipes[newPipes.length - 1];
        if (!lastPipe || lastPipe.x < GAME_WIDTH - 300) {
          newPipes.push({
            id: pipeIdCounter.current++,
            x: GAME_WIDTH,
            topHeight: Math.random() * 150 + 50,
            passed: false,
          });
        }

        return newPipes;
      });

      // Check pipe collision
      pipes.forEach((pipe) => {
        const birdLeft = GAME_WIDTH / 4 - BIRD_SIZE / 2;
        const birdRight = GAME_WIDTH / 4 + BIRD_SIZE / 2;
        const birdTop = birdY;
        const birdBottom = birdY + BIRD_SIZE;

        if (
          birdRight > pipe.x &&
          birdLeft < pipe.x + PIPE_WIDTH
        ) {
          if (
            birdTop < pipe.topHeight ||
            birdBottom > pipe.topHeight + PIPE_GAP
          ) {
            setGameOver(true);
            setGameActive(false);
            if (score > highScore) setHighScore(score);
          }
        }
      });
    }, 1000 / 60); // 60 FPS

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameActive, gameOver, birdVelocity, birdY, pipes, score, highScore]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleFlap}
        style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT }]}
      >
        {/* Sky background */}
        <View style={styles.sky}>
          {/* Clouds */}
          <View style={[styles.cloud, { left: 100, top: 50 }]} />
          <View style={[styles.cloud, { left: 400, top: 100 }]} />
          <View style={[styles.cloud, { left: 700, top: 70 }]} />

          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={styles.score}>{score}</Text>
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>Session: {formatTime(elapsedMs)} {swRunning ? '' : '(paused)'}</Text>
          </View>

          {/* Bird */}
          <Animated.View
            style={[
              styles.bird,
              {
                left: GAME_WIDTH / 4 - BIRD_SIZE / 2,
                top: birdY,
                transform: [
                  {
                    rotate: birdRotation.interpolate({
                      inputRange: [-30, 30],
                      outputRange: ['-30deg', '30deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.birdBody}>
              <View style={styles.birdEye} />
              <View style={styles.birdBeak} />
            </View>
            <View style={styles.birdWing} />
          </Animated.View>

          {/* Pipes */}
          {pipes.map((pipe) => (
            <View key={pipe.id}>
              {/* Top pipe */}
              <View
                style={[
                  styles.pipe,
                  styles.pipeTop,
                  {
                    left: pipe.x,
                    height: pipe.topHeight,
                  },
                ]}
              >
                <View style={styles.pipeCapTop} />
              </View>

              {/* Bottom pipe */}
              <View
                style={[
                  styles.pipe,
                  styles.pipeBottom,
                  {
                    left: pipe.x,
                    top: pipe.topHeight + PIPE_GAP,
                    height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP,
                  },
                ]}
              >
                <View style={styles.pipeCapBottom} />
              </View>
            </View>
          ))}

          {/* Ground */}
          <View style={styles.ground}>
            <View style={styles.groundStripe} />
            <View style={[styles.groundStripe, { left: 100 }]} />
            <View style={[styles.groundStripe, { left: 200 }]} />
            <View style={[styles.groundStripe, { left: 300 }]} />
            <View style={[styles.groundStripe, { left: 400 }]} />
            <View style={[styles.groundStripe, { left: 500 }]} />
            <View style={[styles.groundStripe, { left: 600 }]} />
            <View style={[styles.groundStripe, { left: 700 }]} />
            <View style={[styles.groundStripe, { left: 800 }]} />
          </View>
        </View>

        {/* Start/Game Over overlay */}
        {(!gameActive || gameOver) && (
          <View style={styles.overlay}>
            <View style={styles.overlayBox}>
              {gameOver ? (
                <>
                  <Text style={styles.gameOverTitle}>Game Over!</Text>
                  <Text style={styles.finalScore}>Score: {score}</Text>
                  <Text style={styles.highScoreText}>Best: {highScore}</Text>
                  <TouchableOpacity style={styles.button} onPress={resetGame}>
                    <Text style={styles.buttonText}>Play Again</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.welcomeTitle}>Flappy Bird</Text>
                  <Text style={styles.instructions}>Tap to flap!</Text>
                  <TouchableOpacity style={styles.button} onPress={startGame}>
                    <Text style={styles.buttonText}>Start Game</Text>
                  </TouchableOpacity>
                  {highScore > 0 && (
                    <Text style={styles.highScoreHint}>Best Score: {highScore}</Text>
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  gameArea: {
    position: 'relative',
    overflow: 'hidden',
  },
  sky: {
    width: '100%',
    height: '100%',
    backgroundColor: '#87CEEB',
    position: 'relative',
  },
  cloud: {
    position: 'absolute',
    width: 80,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 50,
    opacity: 0.7,
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  bird: {
    position: 'absolute',
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    zIndex: 5,
  },
  birdBody: {
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    backgroundColor: '#FFD700',
    borderRadius: BIRD_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  birdEye: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
    top: 8,
    right: 8,
  },
  birdBeak: {
    position: 'absolute',
    width: 10,
    height: 6,
    backgroundColor: '#FF6347',
    right: -5,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  birdWing: {
    position: 'absolute',
    width: 12,
    height: 8,
    backgroundColor: '#FFA500',
    borderRadius: 4,
    left: 5,
    top: 18,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#5CB85C',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  pipeTop: {
    top: 0,
  },
  pipeBottom: {
    bottom: 0,
  },
  pipeCapTop: {
    position: 'absolute',
    bottom: -5,
    left: -5,
    right: -5,
    height: 20,
    backgroundColor: '#5CB85C',
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 5,
  },
  pipeCapBottom: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    height: 20,
    backgroundColor: '#5CB85C',
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 5,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 50,
    backgroundColor: '#DEB887',
    borderTopWidth: 3,
    borderTopColor: '#8B4513',
    flexDirection: 'row',
  },
  groundStripe: {
    position: 'absolute',
    width: 100,
    height: 5,
    backgroundColor: '#8B4513',
    top: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayBox: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 250,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  instructions: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 15,
  },
  finalScore: {
    fontSize: 24,
    color: '#27ae60',
    fontWeight: '600',
    marginBottom: 5,
  },
  highScoreText: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 20,
  },
  highScoreHint: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 15,
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});