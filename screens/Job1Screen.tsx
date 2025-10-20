// screens/Job1Screen.tsx
import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function JobScreen() {
  const GRID_SIZE = 5; // 5x5 grid
  const MINE_COUNT = 5;

  // Initialize game state
  const [board, setBoard] = React.useState<(number | string)[][]>(() => {
    const newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    
    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < MINE_COUNT) {
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      
      if (newBoard[row][col] !== 'M') {
        newBoard[row][col] = 'M';
        minesPlaced++;
      }
    }
    
    // Calculate numbers
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newBoard[r][c] !== 'M') {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && newBoard[nr][nc] === 'M') {
                count++;
              }
            }
          }
          newBoard[r][c] = count;
        }
      }
    }
    
    return newBoard;
  });

  const [revealed, setRevealed] = React.useState<boolean[][]>(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false))
  );
  const [gameOver, setGameOver] = React.useState(false);
  const [won, setWon] = React.useState(false);

  // Handle cell click
  const handleCellPress = (row: number, col: number) => {
    if (gameOver || won || revealed[row][col]) return;

    const newRevealed = revealed.map(r => [...r]);
    
    if (board[row][col] === 'M') {
      // Hit a mine - game over
      setGameOver(true);
      // Reveal all mines
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (board[r][c] === 'M') {
            newRevealed[r][c] = true;
          }
        }
      }
    } else {
      // Safe cell - reveal it
      newRevealed[row][col] = true;
      
      // Check if won
      let allSafeRevealed = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (board[r][c] !== 'M' && !newRevealed[r][c]) {
            allSafeRevealed = false;
          }
        }
      }
      
      if (allSafeRevealed) {
        setWon(true);
      }
    }
    
    setRevealed(newRevealed);
  };

  // Reset game
  const resetGame = () => {
    setBoard(
      Array(GRID_SIZE).fill(null).map(() => {
        const newRow = Array(GRID_SIZE).fill(0);
        let minesPlaced = 0;
        while (minesPlaced < MINE_COUNT) {
          const col = Math.floor(Math.random() * GRID_SIZE);
          if (newRow[col] !== 'M') {
            newRow[col] = 'M';
            minesPlaced++;
          }
        }
        return newRow;
      })
    );
    setRevealed(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false)));
    setGameOver(false);
    setWon(false);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2E5D7', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#C97D60' }}>
        Minesweeper
      </Text>

      {/* Game Status */}
      <Text style={{ fontSize: 18, marginBottom: 15, color: '#63372C', fontWeight: 'bold' }}>
        {gameOver ? '💣 Game Over!' : won ? '🎉 You Won!' : 'Click to reveal'}
      </Text>

      {/* Game Grid */}
      <View style={{ marginBottom: 20 }}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: 'row' }}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                onPress={() => handleCellPress(rowIndex, colIndex)}
                style={{
                  width: 50,
                  height: 50,
                  margin: 2,
                  backgroundColor: revealed[rowIndex][colIndex]
                    ? cell === 'M'
                      ? '#FF6B6B'
                      : '#E8F5E9'
                    : '#87CEEB',
                  borderWidth: 2,
                  borderColor: '#63372C',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#63372C' }}>
                  {revealed[rowIndex][colIndex]
                    ? cell === 'M'
                      ? '💣'
                      : cell === 0
                      ? ''
                      : cell
                    : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        onPress={resetGame}
        style={{
          backgroundColor: '#C97D60',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: '#63372C',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>
          New Game
        </Text>
      </TouchableOpacity>
    </View>
  );
}