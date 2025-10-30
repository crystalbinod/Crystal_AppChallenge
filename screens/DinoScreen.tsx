// screens/DinoScreen.tsx
// screens/games/DinoGame.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import Stopwatch from '../lib/stopwatch';

const GAME_WIDTH = 650;
const GAME_HEIGHT = 280;
const GROUND_HEIGHT = 210;
const DINO_WIDTH = 44;
const DINO_HEIGHT = 80;
const JUMP_VELOCITY = -45;
const DUCK_HEIGHT = 30;
const GRAVITY = 0.6;
const INITIAL_SPEED = 6;

interface Obstacle {
  id: number;
  x: number;
  type: 'cactusSmall' | 'cactusLarge' | 'cactusDouble' | 'pterodactyl';
  height?: number;
}

export default function DinoGame() {
  const [dinoY, setDinoY] = useState(GROUND_HEIGHT);
  const [velocity, setVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [isDucking, setIsDucking] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED);
  const [nightMode, setNightMode] = useState(false);
  const obstacleIdCounter = useRef(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nightModeScoreRef = useRef(0);
  const pterodactylWing = useRef(new Animated.Value(0)).current;

  // stopwatch subscription to show session time
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState(false);
  useEffect(() => {
    const unsub = Stopwatch.subscribe((ms, isRunning) => {
      setElapsedMs(ms);
      setSwRunning(isRunning);
    });
    return unsub;
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Dino running animation removed (legs hidden for mobile)

  // Pterodactyl wing animation
  useEffect(() => {
    if (gameActive) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pterodactylWing, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pterodactylWing, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [gameActive]);

  // Handle jump
  const handleJump = () => {
    if (!gameActive) return;
    
    if (!isJumping && dinoY >= GROUND_HEIGHT - 2 && !isDucking) {
      setIsJumping(true);
      setVelocity(JUMP_VELOCITY);
    }
  };

  // Handle duck
  const handleDuckStart = () => {
    if (!gameActive || isJumping) return;
    setIsDucking(true);
  };

  const handleDuckEnd = () => {
    setIsDucking(false);
  };

  // Start game
  const startGame = () => {
    setDinoY(GROUND_HEIGHT);
    setVelocity(0);
    setIsJumping(false);
    setIsDucking(false);
    setObstacles([
      { id: obstacleIdCounter.current++, x: GAME_WIDTH + 100, type: 'cactusSmall' },
    ]);
    setScore(0);
    setGameSpeed(INITIAL_SPEED);
    setGameActive(true);
    setGameOver(false);
    setNightMode(false);
    nightModeScoreRef.current = 0;
  };

  // Reset game
  const resetGame = () => {
    setGameOver(false);
    setGameActive(false);
    setDinoY(GROUND_HEIGHT);
    setVelocity(0);
    setIsJumping(false);
    setIsDucking(false);
    setObstacles([]);
    setScore(0);
    setGameSpeed(INITIAL_SPEED);
    setNightMode(false);
  };

  // Score counter
  useEffect(() => {
    if (!gameActive || gameOver) {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      return;
    }

    scoreIntervalRef.current = setInterval(() => {
      setScore((prevScore) => {
        const newScore = prevScore + 1;
        
        // Increase speed every 100 points
        if (newScore % 100 === 0 && newScore > 0) {
          setGameSpeed((prevSpeed) => Math.min(prevSpeed + 0.5, 13));
        }

        // Toggle night mode every 700 points
        if (newScore > 0 && newScore % 700 === 0 && newScore !== nightModeScoreRef.current) {
          setNightMode((prev) => !prev);
          nightModeScoreRef.current = newScore;
        }
        
        return newScore;
      });
    }, 100);

    return () => {
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    };
  }, [gameActive, gameOver]);

  // Keyboard controls (web only). On mobile (Expo Go) use touch handlers only.
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: any) => {
      if (!gameActive) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault?.();
        handleJump();
      } else if (e.code === 'ArrowDown') {
        e.preventDefault?.();
        handleDuckStart();
      }
    };

    const handleKeyUp = (e: any) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault?.();
        handleDuckEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameActive, isJumping, isDucking, dinoY]);

  // Main game loop
  useEffect(() => {
    if (!gameActive || gameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = setInterval(() => {
      // Update dino position
      setDinoY((prevY) => {
        let newY = prevY + velocity;
        
        if (newY >= GROUND_HEIGHT) {
          newY = GROUND_HEIGHT;
          setIsJumping(false);
          setVelocity(0);
        }
        
        return newY;
      });

      // Update velocity (gravity)
      setVelocity((prevVel) => {
        if (dinoY < GROUND_HEIGHT || isJumping) {
          return prevVel + GRAVITY;
        }
        return 0;
      });

      // Update obstacles
      setObstacles((prevObstacles) => {
        let newObstacles = prevObstacles.map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - gameSpeed,
        }));

        // Remove off-screen obstacles
        newObstacles = newObstacles.filter((obstacle) => obstacle.x > -100);

        // Add new obstacle
        const lastObstacle = newObstacles[newObstacles.length - 1];
        if (!lastObstacle || lastObstacle.x < GAME_WIDTH - 300) {
          const random = Math.random();
          let obstacleType: 'cactusSmall' | 'cactusLarge' | 'cactusDouble' | 'pterodactyl';
          
          // Add pterodactyls after score 100
          if (score > 100 && random > 0.7) {
            obstacleType = 'pterodactyl';
          } else if (random > 0.6) {
            obstacleType = 'cactusDouble';
          } else if (random > 0.3) {
            obstacleType = 'cactusLarge';
          } else {
            obstacleType = 'cactusSmall';
          }

          const pterodactylHeight = obstacleType === 'pterodactyl' 
            ? (Math.random() > 0.5 ? 160 : 180) 
            : undefined;
          
          newObstacles.push({
            id: obstacleIdCounter.current++,
            x: GAME_WIDTH,
            type: obstacleType,
            height: pterodactylHeight,
          });
        }

        // Check collisions
        newObstacles.forEach((obstacle) => {
          const dinoLeft = 50 + 5;
          const dinoRight = 50 + DINO_WIDTH - 10;
          const dinoTop = isDucking ? dinoY + 15 : dinoY + 5;
          const dinoBottom = isDucking ? dinoY + DUCK_HEIGHT - 5 : dinoY + DINO_HEIGHT - 5;

          let obstacleLeft = obstacle.x + 5;
          let obstacleRight = obstacle.x;
          let obstacleTop = GROUND_HEIGHT;
          let obstacleBottom = GROUND_HEIGHT;

          if (obstacle.type === 'cactusSmall') {
            obstacleRight = obstacle.x + 17;
            obstacleBottom = GROUND_HEIGHT + 35;
          } else if (obstacle.type === 'cactusLarge') {
            obstacleRight = obstacle.x + 25;
            obstacleBottom = GROUND_HEIGHT + 50;
          } else if (obstacle.type === 'cactusDouble') {
            obstacleRight = obstacle.x + 30;
            obstacleBottom = GROUND_HEIGHT + 35;
          } else if (obstacle.type === 'pterodactyl') {
            obstacleRight = obstacle.x + 46;
            obstacleTop = obstacle.height || 160;
            obstacleBottom = obstacleTop + 40;
          }

          if (dinoRight > obstacleLeft && dinoLeft < obstacleRight) {
            if (obstacle.type === 'pterodactyl') {
              if (dinoBottom > obstacleTop && dinoTop < obstacleBottom) {
                setGameOver(true);
                setGameActive(false);
                if (score > highScore) setHighScore(score);
              }
            } else {
              if (dinoBottom > obstacleTop) {
                setGameOver(true);
                setGameActive(false);
                if (score > highScore) setHighScore(score);
              }
            }
          }
        });

        return newObstacles;
      });
    }, 1000 / 60); // 60 FPS

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameActive, gameOver, velocity, isJumping, isDucking, dinoY, gameSpeed, highScore, score]);

  const displayScore = Math.floor(score);
  const bgColor = nightMode ? '#000' : '#f7f7f7';
  const fgColor = nightMode ? '#fff' : '#535353';

  return (
    <View style={styles.container}>
      <View style={[styles.gameArea, { width: GAME_WIDTH, height: GAME_HEIGHT, backgroundColor: bgColor }]}>
        {/* Game canvas */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleJump}
          onPressIn={handleDuckStart}
          onPressOut={handleDuckEnd}
          style={styles.canvas}
          disabled={!gameActive}
        >
          {/* Score */}
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: fgColor }]}>HI</Text>
            <Text style={[styles.scoreValue, { color: fgColor }]}>{String(highScore).padStart(5, '0')}</Text>
            <Text style={[styles.scoreValue, { color: fgColor }]}>{String(displayScore).padStart(5, '0')}</Text>
            <View style={{ position: 'absolute', right: 8, top: 6, alignItems: 'center' }}>
              <Text style={[styles.scoreLabel, { color: fgColor, fontSize: 10 }]}>Session</Text>
              <Text style={[styles.scoreValue, { color: fgColor, fontSize: 14 }]}>{formatTime(elapsedMs)} {swRunning ? '' : '(paused)'}</Text>
            </View>
          </View>

          {/* Dino */}
          <View
            style={[
              styles.dino,
              {
                bottom: GAME_HEIGHT - dinoY - (isDucking ? DUCK_HEIGHT : DINO_HEIGHT),
              },
            ]}
          >
            {!isDucking ? (
              <>
                {/* Standing Dino */}
                <View style={[styles.dinoBody, { backgroundColor: fgColor }]}>
                  <View style={[styles.dinoEye, { backgroundColor: nightMode ? '#000' : '#fff' }]} />
                  <View style={[styles.dinoMouth, { backgroundColor: nightMode ? '#000' : '#fff' }]} />
                </View>
                <View style={[styles.dinoTail, { backgroundColor: fgColor }]} />
                <View style={[styles.dinoArm, { backgroundColor: fgColor }]} />
              </>
            ) : (
              <>
                {/* Ducking Dino */}
                <View style={[styles.dinoDuckBody, { backgroundColor: fgColor }]}>
                  <View style={[styles.dinoEye, { backgroundColor: nightMode ? '#000' : '#fff' }]} />
                </View>
                <View style={[styles.dinoDuckTail, { backgroundColor: fgColor }]} />
              </>
            )}
          </View>

          {/* Obstacles */}
          {obstacles.map((obstacle) => (
            <View key={obstacle.id}>
              {obstacle.type === 'cactusSmall' && (
                <View
                  style={[
                    styles.cactusSmall,
                    { backgroundColor: fgColor },
                    {
                      left: obstacle.x,
                      bottom: GAME_HEIGHT - GROUND_HEIGHT-300,
                    },
                  ]}
                >
                  <View style={[styles.cactusArm, { backgroundColor: fgColor }]} />
                </View>
              )}
              {obstacle.type === 'cactusLarge' && (
                <View
                  style={[
                    styles.cactusLarge,
                    { backgroundColor: fgColor },
                    {
                      left: obstacle.x,
                      bottom: GAME_HEIGHT - GROUND_HEIGHT-300,
                    },
                  ]}
                >
                  <View style={[styles.cactusArmLarge, { backgroundColor: fgColor }]} />
                  <View style={[styles.cactusArmLarge, styles.cactusArmRight, { backgroundColor: fgColor }]} />
                </View>
              )}
                  {obstacle.type === 'cactusDouble' && (
                    <View
                      style={{
                        position: 'absolute',
                        left: obstacle.x,
                        bottom: GAME_HEIGHT - GROUND_HEIGHT-300,
                        flexDirection: 'row',
                      }}
                    >
                      <View style={[styles.cactusSmall, { backgroundColor: fgColor, position: 'relative', left: 0, bottom: 0, marginRight: 5 }]}>
                        <View style={[styles.cactusArm, { backgroundColor: fgColor }]} />
                      </View>
                      <View style={[styles.cactusSmall, { backgroundColor: fgColor, position: 'relative', left: 0, bottom: 0 }]}>
                        <View style={[styles.cactusArm, { backgroundColor: fgColor }]} />
                      </View>
                    </View>
                  )}
              {obstacle.type === 'pterodactyl' && (
                <View
                  style={[
                    styles.pterodactyl,
                    {
                      left: obstacle.x,
                      bottom: GAME_HEIGHT - (obstacle.height || 160) - 300,
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.pterodactylWingLeft,
                      { backgroundColor: fgColor },
                      {
                        transform: [
                          {
                            rotate: pterodactylWing.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '-30deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View style={[styles.pterodactylBody, { backgroundColor: fgColor }]} />
                  <Animated.View
                    style={[
                      styles.pterodactylWingRight,
                      { backgroundColor: fgColor },
                      {
                        transform: [
                          {
                            rotate: pterodactylWing.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '30deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                  <View style={[styles.pterodactylHead, { backgroundColor: fgColor }]} />
                </View>
              )}
            </View>
          ))}

          {/* Ground */}
          <View style={[styles.ground, { backgroundColor: fgColor }]}>
            <View style={[styles.groundLine, { backgroundColor: fgColor }]} />
            {Array.from({ length: 30 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.groundDash,
                  { backgroundColor: fgColor },
                  { left: (i * 25 - ((score * 2) % 25)) % GAME_WIDTH },
                ]}
              />
            ))}
          </View>

          {/* Clouds */}
          <View style={[styles.cloud, { backgroundColor: fgColor, left: (150 - (score * 0.3) % (GAME_WIDTH + 100)), top: 30 }]} />
          <View style={[styles.cloud, { backgroundColor: fgColor, left: (350 - (score * 0.3) % (GAME_WIDTH + 100)), top: 50 }]} />
          <View style={[styles.cloud, { backgroundColor: fgColor, left: (550 - (score * 0.3) % (GAME_WIDTH + 100)), top: 25 }]} />

          {/* Stars (night mode only) */}
          {nightMode && (
            <>
              {Array.from({ length: 15 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.star,
                    {
                      left: ((i * 70 + 50) % GAME_WIDTH),
                      top: 20 + (i % 3) * 25,
                      opacity: 0.3 + (i % 3) * 0.2,
                    },
                  ]}
                />
              ))}
            </>
          )}
        </TouchableOpacity>

        {/* Start/Game Over overlay */}
        {!gameActive && (
          <View style={[styles.overlay, { backgroundColor: nightMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(247, 247, 247, 0.95)' }]}>
            {gameOver ? (
              <View style={styles.overlayContent}>
                <Text style={[styles.gameOverText, { color: fgColor }]}>G A M E  O V E R</Text>
                <Text style={[styles.finalScoreText, { color: fgColor }]}>Score: {displayScore}</Text>
                {highScore > 0 && (
                  <Text style={[styles.highScoreText, { color: nightMode ? '#aaa' : '#888' }]}>High Score: {highScore}</Text>
                )}
                <TouchableOpacity style={[styles.button, { backgroundColor: fgColor }]} onPress={resetGame}>
                  <Text style={[styles.buttonText, { color: nightMode ? '#000' : '#fff' }]}>RESTART</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.overlayContent}>
                <Text style={[styles.title, { color: fgColor }]}>Chrome Dino Game</Text>
                <Text style={[styles.subtitle, { color: nightMode ? '#aaa' : '#888' }]}>Press Space/↑ to jump • ↓ to duck</Text>
                {highScore > 0 && (
                  <Text style={[styles.highScoreHint, { color: nightMode ? '#aaa' : '#888' }]}>Best: {highScore}</Text>
                )}
                <TouchableOpacity style={[styles.button, { backgroundColor: fgColor }]} onPress={startGame}>
                  <Text style={[styles.buttonText, { color: nightMode ? '#000' : '#fff' }]}>START GAME</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
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
    borderWidth: 2,
    borderColor: '#535353',
  },
  canvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  scoreContainer: {
    position: 'absolute',
    top: 10,
    right: 15,
    flexDirection: 'row',
    zIndex: 10,
  },
  scoreLabel: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dino: {
    position: 'absolute',
    left: 50,
    width: DINO_WIDTH,
    height: DINO_HEIGHT,
  },
  dinoBody: {
    width: 25,
    height: 25,
    position: 'absolute',
    top: 0,
    left: 8,
  },
  dinoEye: {
    width: 4,
    height: 4,
    position: 'absolute',
    top: 5,
    right: 5,
  },
  dinoMouth: {
    width: 10,
    height: 2,
    position: 'absolute',
    bottom: 8,
    right: 0,
  },
  dinoTail: {
    width: 12,
    height: 8,
    position: 'absolute',
    top: 8,
    left: 0,
  },
  /* legs removed */
  dinoArm: {
    width: 6,
    height: 12,
    position: 'absolute',
    top: 10,
    left: 15,
  },
  dinoDuckBody: {
    width: 40,
    height: 18,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  dinoDuckTail: {
    width: 15,
    height: 8,
    position: 'absolute',
    top: 5,
    left: -10,
  },
  /* duck legs removed */
  cactusSmall: {
    position: 'absolute',
    width: 17,
    height: 35,
  },
  cactusLarge: {
    position: 'absolute',
    width: 25,
    height: 50,
  },
  cactusArm: {
    width: 6,
    height: 12,
    position: 'absolute',
    left: -6,
    top: 10,
  },
  cactusArmLarge: {
    width: 8,
    height: 15,
    position: 'absolute',
    left: -8,
    top: 12,
  },
  cactusArmRight: {
    left: 25,
    top: 18,
  },
  pterodactyl: {
    position: 'absolute',
    width: 46,
    height: 40,
  },
  pterodactylBody: {
    width: 15,
    height: 12,
    position: 'absolute',
    left: 15,
    top: 14,
  },
  pterodactylHead: {
    width: 10,
    height: 8,
    position: 'absolute',
    left: 28,
    top: 10,
  },
  pterodactylWingLeft: {
    width: 20,
    height: 4,
    position: 'absolute',
    left: 0,
    top: 18,
  },
  pterodactylWingRight: {
    width: 20,
    height: 4,
    position: 'absolute',
    right: 0,
    top: 18,
  },
  ground: {
    position: 'absolute',
    bottom: GAME_HEIGHT - GROUND_HEIGHT - 5,
    width: '100%',
    height: 2,
  },
  groundLine: {
    width: '100%',
    height: 2,
  },
  groundDash: {
    position: 'absolute',
    width: 8,
    height: 2,
    bottom: -8,
  },
  cloud: {
    position: 'absolute',
    width: 30,
    height: 8,
    opacity: 0.3,
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  overlayContent: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'center',
  },
  highScoreHint: {
    fontSize: 11,
    marginBottom: 12,
  },
  gameOverText: {
    fontSize: 22,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  finalScoreText: {
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '600',
  },
  highScoreText: {
    fontSize: 13,
    marginBottom: 15,
  },
  button: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});