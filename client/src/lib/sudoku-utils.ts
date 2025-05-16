// Utility functions for Sudoku game validation

// Check if a board is valid (no rule violations)
export const isValidBoard = (board: (number | null)[][]): boolean => {
  // Check rows
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      if (value !== null) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < 9; row++) {
      const value = board[row][col];
      if (value !== null) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }
  
  // Check 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Set<number>();
      for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
        for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
          const value = board[row][col];
          if (value !== null) {
            if (seen.has(value)) return false;
            seen.add(value);
          }
        }
      }
    }
  }
  
  return true;
};

// Check if a board is complete (all cells filled and valid)
export const isBoardComplete = (board: (number | null)[][]): boolean => {
  // Check if all cells are filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  
  // Check if the board is valid
  return isValidBoard(board);
};

// Format time in seconds to MM:SS format
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Convert difficulty level to text description
export const difficultyText = (level: number): string => {
  if (level <= 3) return 'かんたん';
  if (level <= 7) return 'ふつう';
  return 'むずかしい';
};
