import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';

const CONTROL_PANEL_WIDTH = 120;

export default function PongScreen() {
  const { width, height } = useWindowDimensions();
  const padding = 16;

  // wide rectangle (landscape) but ball moves vertically; paddles at top/bottom
  const maxPlayWidth = Math.max(320, width - CONTROL_PANEL_WIDTH - padding * 3);
  const maxPlayHeight = Math.max(160, height - padding * 4 - 80);
  const playWidth = maxPlayWidth;
  const playHeight = Math.min(maxPlayHeight, Math.max(140, Math.floor(playWidth * 0.45)));

  // paddle length horizontally, thickness vertically
  const paddleLength = Math.max(80, Math.floor(playWidth * 0.22));
  const paddleThickness = Math.max(10, Math.floor(playHeight * 0.08));
  const ballSize = Math.max(10, Math.floor(Math.min(playWidth, playHeight) * 0.035));

  // positions: bottom paddle moves along X; top paddle will span full width
  const [bottomX, setBottomX] = useState(playWidth / 2 - paddleLength / 2);
  const [ballX, setBallX] = useState(playWidth / 2 - ballSize / 2);
  const [ballY, setBallY] = useState(playHeight / 2 - ballSize / 2);
  // ball moves mainly vertically
  const [ballVX, setBallVX] = useState(Math.max(1, playWidth * 0.002));
  const [ballVY, setBallVY] = useState((Math.random() > 0.5 ? 1 : -1) * Math.max(2, playHeight * 0.01));

  const [scoreTop, setScoreTop] = useState(0);
  const [scoreBottom, setScoreBottom] = useState(0);
  const [paused, setPaused] = useState(false);
  // Part-time stopwatch subscription
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState(false);
  // no AI or practice modes — top is full red bar, bottom is player-controlled green bar

  const loopRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    resetPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playWidth, playHeight]);

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

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  function resetPositions() {
    setBottomX(playWidth / 2 - paddleLength / 2);
    setBallX(playWidth / 2 - ballSize / 2);
    setBallY(playHeight / 2 - ballSize / 2);
    setBallVY((Math.random() > 0.5 ? 1 : -1) * Math.max(2, playHeight * 0.01));
    setBallVX(Math.max(1, playWidth * 0.002));
  }

  function resetGame() {
    setScoreTop(0);
    setScoreBottom(0);
    resetPositions();
    setPaused(false);
  }

  // game loop: update positions and collisions
  useEffect(() => {
    if (paused) {
      if (loopRef.current) clearInterval(loopRef.current);
      loopRef.current = null;
      return;
    }

    loopRef.current = setInterval(() => {
      setBallX((bx) => {
        setBallY((by) => {
          const nextX = bx + ballVX;
          const nextY = by + ballVY;
          let vx = ballVX;
          let vy = ballVY;

          // left/right walls reflect
          if (nextX <= 0) {
            vx = Math.abs(vx);
            setBallVX(vx);
          } else if (nextX + ballSize >= playWidth) {
            vx = -Math.abs(vx);
            setBallVX(vx);
          }

          // top paddle collision (top bar spans full width)
          const topY = 8;
          if (nextY <= topY + paddleThickness) {
            // full-width top bar always hits — bounce down
            vy = Math.abs(vy) * 1.05; // bounce down
            setBallVY(vy);
            // small horizontal tweak based on where it hit relative to center
            const ballCenterX = nextX + ballSize / 2;
            const rel = (ballCenterX - playWidth / 2) / (playWidth / 2);
            setBallVX(vx + rel * 1.2);
          }

          // bottom paddle collision
          const bottomY = playHeight - paddleThickness - 8;
          if (nextY + ballSize >= bottomY) {
            const pLeft = bottomX;
            const pRight = bottomX + paddleLength;
            const ballCenterX = nextX + ballSize / 2;
            if (ballCenterX >= pLeft && ballCenterX <= pRight) {
              vy = -Math.abs(vy) * 1.05; // bounce up
              setBallVY(vy);
              const rel = (ballCenterX - (pLeft + paddleLength / 2)) / (paddleLength / 2);
              setBallVX(vx + rel * 1.2);
            } else {
              // bottom missed — top scores
              setScoreTop((s) => s + 1);
              resetPositions();
              return bx;
            }
          }

          // no AI — bottom is player controlled

          setBallX(() => Math.max(0, Math.min(playWidth - ballSize, nextX)));
          return Math.max(0, Math.min(playHeight - ballSize, nextY));
        });
        return bx;
      });
    }, 1000 / 60);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      loopRef.current = null;
    };
  }, [paused, playWidth, playHeight, bottomX]);

  // gestures: drag horizontally; top-half controls top paddle, bottom-half controls bottom paddle
  const gesture = Gesture.Pan()
    .onStart((e) => {
      const x = e.x;
      const relative = x - paddleLength / 2;
      const clamped = Math.max(0, Math.min(playWidth - paddleLength, relative));
      setBottomX(clamped);
    })
    .onUpdate((e) => {
      const x = e.x;
      const relative = x - paddleLength / 2;
      const clamped = Math.max(0, Math.min(playWidth - paddleLength, relative));
      setBottomX(clamped);
    });

  // keyboard: A/D for top, ArrowLeft/ArrowRight for bottom (Local)
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (paused) return;
      const key = ev.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') setBottomX((x) => Math.max(0, x - 24));
      if (key === 'arrowright' || key === 'd') setBottomX((x) => Math.min(playWidth - paddleLength, x + 24));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [paused, playWidth, paddleLength]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <GestureDetector gesture={gesture}>
        <View style={styles.outer}>
          <View style={[styles.playAreaWrap, { width: playWidth + 8, height: playHeight + 8 }]}>
            <Text style={styles.title}>Pong (Wide) — Ball vertical</Text>
            <View style={[styles.playArea, { width: playWidth, height: playHeight }]}> 
              {/* top paddle (full-width red bar) */}
              <View
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  width: playWidth,
                  height: paddleThickness,
                  backgroundColor: '#ef4444',
                  borderRadius: 4,
                }}
              />

              {/* bottom paddle (player-controlled green) */}
              <View
                style={{
                  position: 'absolute',
                  left: bottomX,
                  top: playHeight - paddleThickness - 8,
                  width: paddleLength,
                  height: paddleThickness,
                  backgroundColor: '#10b981',
                  borderRadius: 4,
                }}
              />

              {/* ball */}
              <View
                style={{
                  position: 'absolute',
                  left: ballX,
                  top: ballY,
                  width: ballSize,
                  height: ballSize,
                  borderRadius: ballSize / 2,
                  backgroundColor: '#111827',
                }}
              />
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Top</Text>
              <Text style={styles.scoreValue}>{scoreTop}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Bottom</Text>
              <Text style={styles.scoreValue}>{scoreBottom}</Text>
            </View>

            <View style={{ width: '100%', alignItems: 'center', marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>Session: {formatTime(elapsedMs)} {swRunning ? '' : '(paused)'}</Text>
            </View>

            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.button} onPress={() => setPaused((p) => !p)}>
              <Text style={styles.buttonText}>{paused ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>

            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.button} onPress={resetGame}>
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />
            <Text style={styles.hint}>Drag or ←/→ to move bottom paddle</Text>
          </View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7fafc' },
  outer: { flex: 1, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  playAreaWrap: { backgroundColor: '#fff', borderRadius: 8, padding: 4, marginRight: 16, borderWidth: 2, borderColor: '#e6edf3', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#111827' },
  playArea: { position: 'relative', backgroundColor: '#e6edf3', borderRadius: 6, overflow: 'hidden' },
  controls: { width: CONTROL_PANEL_WIDTH, alignItems: 'center' },
  scoreBox: { backgroundColor: '#fff', padding: 8, borderRadius: 8, width: '100%', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  scoreLabel: { fontSize: 12, color: '#6b7280' },
  scoreValue: { fontSize: 24, fontWeight: '800' },
  button: { backgroundColor: '#8f5a3b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 8 },
});
