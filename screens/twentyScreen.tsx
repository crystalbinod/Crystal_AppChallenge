// screens/Game2048Screen.tsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, TouchableOpacity, SafeAreaView, PanResponder } from 'react-native';
import Stopwatch from '../lib/stopwatch';

type Grid = number[][];
const SIZE = 4;
const START_TILES = 2;

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0));
}

function cloneGrid(g: Grid) { return g.map(r => r.slice()); }
function randomInt(max: number) { return Math.floor(Math.random() * max); }
function spawnRandomTile(grid: Grid) {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c] === 0) empties.push([r, c]);
  if (!empties.length) return grid;
  const [r, c] = empties[randomInt(empties.length)];
  grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return grid;
}

function compressRow(row: number[]) {
  const newRow = row.filter(v => v !== 0);
  while (newRow.length < SIZE) newRow.push(0);
  return newRow;
}

function mergeRowLeft(row: number[]): [number[], number] {
  let score = 0;
  const arr = compressRow(row);
  for (let i = 0; i < SIZE - 1; i++) {
    if (arr[i] && arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      arr[i + 1] = 0;
    }
  }
  return [compressRow(arr), score];
}

function transpose(grid: Grid) {
  const g = emptyGrid();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) g[r][c] = grid[c][r];
  return g;
}

function reverseRows(grid: Grid) { return grid.map(r => r.slice().reverse()); }

function moveLeft(grid: Grid) { 
  let moved = false, gained = 0;
  const newGrid = cloneGrid(grid);
  for (let r = 0; r < SIZE; r++) {
    const [row, score] = mergeRowLeft(newGrid[r]);
    if (row.some((v, i) => v !== newGrid[r][i])) moved = true;
    gained += score;
    newGrid[r] = row;
  }
  return { grid: newGrid, moved, gained };
}

function moveRight(grid: Grid) { const res = moveLeft(reverseRows(grid)); return { grid: reverseRows(res.grid), moved: res.moved, gained: res.gained }; }
function moveUp(grid: Grid) { const res = moveLeft(transpose(grid)); return { grid: transpose(res.grid), moved: res.moved, gained: res.gained }; }
function moveDown(grid: Grid) { const res = moveRight(transpose(grid)); return { grid: transpose(res.grid), moved: res.moved, gained: res.gained }; }

function canMove(grid: Grid) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) return true;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE - 1; c++) if (grid[r][c] === grid[r][c + 1]) return true;
  for (let c = 0; c < SIZE; c++) for (let r = 0; r < SIZE - 1; r++) if (grid[r][c] === grid[r + 1][c]) return true;
  return false;
}

const COLORS: Record<number, string> = {
  2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',
  64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'
};

export default function Game2048Screen() {
  const { width, height } = useWindowDimensions();
  const [grid, setGrid] = useState<Grid>(() => emptyGrid());
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const padding = 16;
  const controlWidth = 140;
  const maxBoardWidth = Math.max(140, width - controlWidth - padding * 3);
  const maxBoardHeight = Math.max(140, height - padding * 4 - 80);
  const cellSize = Math.max(40, Math.floor(Math.min(maxBoardWidth / SIZE, maxBoardHeight / SIZE)));
  const boardSize = cellSize * SIZE;

  useEffect(() => { newGame(); }, []);

  // PanResponder for mobile swipe controls (pure JS — safe for Expo Go on iOS)
  const pan = useRef({ startX: 0, startY: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        pan.current.startX = gestureState.x0;
        pan.current.startY = gestureState.y0;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dx = gestureState.moveX - pan.current.startX;
        const dy = gestureState.moveY - pan.current.startY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        const THRESH = 20; // minimum distance to treat as swipe

        if (absX < THRESH && absY < THRESH) return;

        if (absX > absY) {
          if (dx > 0) makeMove('right');
          else makeMove('left');
        } else {
          if (dy > 0) makeMove('down');
          else makeMove('up');
        }
      },
    })
  ).current;

  function newGame() {
    let g = emptyGrid();
    for (let i = 0; i < START_TILES; i++) g = spawnRandomTile(g);
    setGrid(g); setScore(0); setGameOver(false);
  }

  function makeMove(dir: 'left'|'right'|'up'|'down') {
    if (gameOver) return;
    let res;
    if (dir==='left') res=moveLeft(grid);
    else if(dir==='right') res=moveRight(grid);
    else if(dir==='up') res=moveUp(grid);
    else res=moveDown(grid);

    if(res.moved){
      const newGrid = spawnRandomTile(res.grid);
      const newScore = score + res.gained;
      setGrid(newGrid); setScore(newScore); setBest(b=>Math.max(b,newScore));
      if(!canMove(newGrid)) setGameOver(true);
    }
  }

  const tiles = useMemo(()=>{
    const out: React.ReactNode[] = [];
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const val = grid[r][c];
        const left = c*cellSize;
        const top = r*cellSize;
        const bg = val===0?'#ede8df':COLORS[val]??'#3c3a32';
        out.push(
          <View key={`tile-${r}-${c}`} style={[styles.tile,{width:cellSize-8,height:cellSize-8,left:left+4,top:top+4,backgroundColor:bg}]}>
            {val!==0 && <Text style={[styles.tileText,{fontSize:Math.max(14,cellSize/3)}]}>{val}</Text>}
          </View>
        )
      }
    }
    return out;
  },[grid,cellSize]);

  // Subscribe to shared stopwatch to display elapsed time
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    const unsub = Stopwatch.subscribe((ms, isRunning) => {
      setElapsedMs(ms);
      setRunning(isRunning);
    });
    return unsub;
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7fafc' }}>
      <View style={styles.outer}>
        <View style={[styles.boardWrap,{width:boardSize+8,height:boardSize+8}]}>
          <View style={[styles.board,{width:boardSize,height:boardSize}]} {...panResponder.panHandlers}>
            {tiles}
            {gameOver && (
              <View style={[styles.overlay,{width:boardSize,height:boardSize}]}>
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

          <View style={{ marginVertical: 8, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666' }}>Session</Text>
            <Text style={{ fontWeight: '700' }}>{formatTime(elapsedMs)} {running ? '(running)' : '(paused)'}</Text>
          </View>

          {/* Arrow buttons */}
          <View style={styles.arrowRow}>
            <TouchableOpacity onPress={()=>makeMove('up')} style={styles.arrowBtn}><Text style={styles.arrowText}>↑</Text></TouchableOpacity>
          </View>
          <View style={styles.arrowRow}>
            <TouchableOpacity onPress={()=>makeMove('left')} style={styles.arrowBtn}><Text style={styles.arrowText}>←</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>makeMove('down')} style={styles.arrowBtn}><Text style={styles.arrowText}>↓</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>makeMove('right')} style={styles.arrowBtn}><Text style={styles.arrowText}>→</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={newGame}>
            <Text style={styles.buttonText}>New Game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outer:{flex:1,padding:16,flexDirection:'row',justifyContent:'center',alignItems:'center'},
  boardWrap:{backgroundColor:'#fff',borderRadius:8,padding:4,marginRight:16,borderWidth:2,borderColor:'#ccc',alignItems:'center'},
  board:{position:'relative',backgroundColor:'#bbada0',borderRadius:6,overflow:'hidden'},
  tile:{position:'absolute',borderRadius:6,alignItems:'center',justifyContent:'center'},
  tileText:{fontWeight:'800',color:'#111'},
  overlay:{position:'absolute',left:0,top:0,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.5)'},
  overlayTitle:{color:'#fff',fontSize:20,fontWeight:'800',marginBottom:12},
  overlayButton:{backgroundColor:'#f2b179',paddingHorizontal:16,paddingVertical:8,borderRadius:8},
  overlayButtonText:{color:'#111',fontWeight:'700'},
  controls:{width:140,alignItems:'center'},
  scoreBox:{backgroundColor:'#fff',padding:8,borderRadius:8,width:'100%',alignItems:'center',marginBottom:8,borderWidth:1,borderColor:'#eee'},
  scoreLabel:{fontSize:12,color:'#666'},
  scoreValue:{fontSize:20,fontWeight:'800'},
  button:{backgroundColor:'#8f5a3b',paddingHorizontal:12,paddingVertical:8,borderRadius:8,marginTop:8},
  buttonText:{color:'#fff',fontWeight:'700'},
  arrowRow:{flexDirection:'row',marginVertical:4},
  arrowBtn:{backgroundColor:'#bbb',padding:12,margin:4,borderRadius:8,minWidth:50,alignItems:'center'},
  arrowText:{fontSize:18,fontWeight:'800',color:'#111'},
});
