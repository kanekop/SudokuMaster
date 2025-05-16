// Sudoku generator and solver

// Helper to create a 9x9 empty board
const createEmptyBoard = (): (number | null)[][] => {
  return Array(9).fill(null).map(() => Array(9).fill(null));
};

// Helper to create a solved (filled) board
const createFilledBoard = (): number[][] => {
  const board: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));
  fillBoard(board);
  return board;
};

// Check if number can be placed at position
const isValid = (board: number[][], row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let y = 0; y < 9; y++) {
    if (board[y][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let y = boxRow; y < boxRow + 3; y++) {
    for (let x = boxCol; x < boxCol + 3; x++) {
      if (board[y][x] === num) return false;
    }
  }

  return true;
};

// Recursively fill the board with valid numbers
const fillBoard = (board: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        // Try each number 1-9
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        // Shuffle numbers for randomness
        nums.sort(() => Math.random() - 0.5);
        
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            
            if (fillBoard(board)) {
              return true;
            }
            
            board[row][col] = 0;
          }
        }
        
        return false;
      }
    }
  }
  
  return true;
};

// Solve a given board
const solveBoard = (board: (number | null)[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValidForSolve(board, row, col, num)) {
            board[row][col] = num;
            
            if (solveBoard(board)) {
              return true;
            }
            
            board[row][col] = null;
          }
        }
        
        return false;
      }
    }
  }
  
  return true;
};

// Check if number can be placed for solving
const isValidForSolve = (board: (number | null)[][], row: number, col: number, num: number): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  // Check column
  for (let y = 0; y < 9; y++) {
    if (board[y][col] === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let y = boxRow; y < boxRow + 3; y++) {
    for (let x = boxCol; x < boxCol + 3; x++) {
      if (board[y][x] === num) return false;
    }
  }

  return true;
};

// Check if a puzzle has a unique solution
const hasUniqueSolution = (board: (number | null)[][]): boolean => {
  // Copy the board
  const boardCopy: (number | null)[][] = board.map(row => [...row]);
  
  // Find the first empty cell
  let emptyFound = false;
  let row = 0, col = 0;
  
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (boardCopy[y][x] === null) {
        row = y;
        col = x;
        emptyFound = true;
        break;
      }
    }
    if (emptyFound) break;
  }
  
  if (!emptyFound) return true; // No empty cells, puzzle is already solved
  
  let solutionCount = 0;
  
  // Try each number in the empty cell
  for (let num = 1; num <= 9 && solutionCount < 2; num++) {
    if (isValidForSolve(boardCopy, row, col, num)) {
      boardCopy[row][col] = num;
      
      // If this placement leads to a valid solution, increment count
      if (hasUniqueSolution(boardCopy)) {
        solutionCount++;
      }
      
      boardCopy[row][col] = null;
    }
  }
  
  return solutionCount === 1;
};

// Generate a sudoku puzzle
export const generateSudoku = (difficulty: number): { initialBoard: (number | null)[][], solvedBoard: number[][] } => {
  // Create a solved board
  const solvedBoard = createFilledBoard();
  
  // Create the initial board by removing numbers
  const initialBoard: (number | null)[][] = solvedBoard.map(row => [...row]);
  
  // Determine how many cells to remove based on difficulty (1-10)
  // Easy (1-3): 30-40 cells removed
  // Medium (4-7): 41-55 cells removed
  // Hard (8-10): 56-65 cells removed
  let cellsToRemove = 30;
  
  if (difficulty <= 3) {
    cellsToRemove = 30 + (difficulty - 1) * 5;
  } else if (difficulty <= 7) {
    cellsToRemove = 40 + (difficulty - 3) * 5;
  } else {
    cellsToRemove = 55 + (difficulty - 7) * 5;
  }
  
  // Create a list of all positions
  const positions: [number, number][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle positions
  positions.sort(() => Math.random() - 0.5);
  
  // Remove cells one by one, ensuring the puzzle remains solvable
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;
    
    const temp = initialBoard[row][col];
    initialBoard[row][col] = null;
    
    // Create a copy for checking solution uniqueness
    const boardCopy: (number | null)[][] = initialBoard.map(r => [...r]);
    
    // If removing the number leads to multiple solutions, put it back
    if (!hasUniqueSolution(boardCopy)) {
      initialBoard[row][col] = temp;
    } else {
      removed++;
    }
  }
  
  return { initialBoard, solvedBoard };
};

// Check if a board is valid
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

// Check if a board is complete (no empty cells and valid)
export const isBoardComplete = (board: (number | null)[][]): boolean => {
  // Check if there are empty cells
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) return false;
    }
  }
  
  // Check if the board is valid
  return isValidBoard(board);
};

// Check if the user's solution matches the correct solution
export const isSolutionCorrect = (userBoard: (number | null)[][], solvedBoard: number[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (userBoard[row][col] !== solvedBoard[row][col]) {
        return false;
      }
    }
  }
  return true;
};
