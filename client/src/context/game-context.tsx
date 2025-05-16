import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTimer } from "@/lib/timer";
import { useToast } from "@/hooks/use-toast";
import { isBoardComplete } from "@/lib/sudoku-utils";
import { useAuth } from "@/hooks/useAuth";

type SudokuCell = number | null;
type SudokuBoard = SudokuCell[][];

export interface Game {
  id: number;
  userId: string;
  puzzleId: number;
  currentBoard: SudokuBoard;
  isCompleted: boolean;
  timeSpent: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  puzzle: {
    id: number;
    initialBoard: SudokuBoard;
    solvedBoard: number[][];
    difficultyLevel: number;
    createdAt: string;
  };
}

interface GameContextType {
  game: Game | null;
  isLoading: boolean;
  board: SudokuBoard;
  initialBoard: SudokuBoard;
  selectedCell: [number, number] | null;
  setSelectedCell: (cell: [number, number] | null) => void;
  setValue: (value: number | null) => void;
  createNewGame: (difficultyLevel: number) => Promise<void>;
  loadGame: (gameId: number) => Promise<void>;
  loadSharedGame: (sharedPuzzleId: number) => Promise<void>;
  saveGame: () => Promise<void>;
  difficulty: number;
  setDifficulty: (level: number) => void;
  isFixedCell: (row: number, col: number) => boolean;
  hasConflict: (row: number, col: number) => boolean;
  isSameValue: (row: number, col: number, value: number) => boolean;
  highlightedCells: Set<string>;
  time: number;
  formattedTime: string;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  showCelebration: boolean;
  setShowCelebration: (show: boolean) => void;
  resetGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [board, setBoard] = useState<SudokuBoard>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [initialBoard, setInitialBoard] = useState<SudokuBoard>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<number>(6); // Default medium difficulty
  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { time, formattedTime, startTimer, pauseTimer, resetTimer, setTime } = useTimer();

  // Load active game if authenticated
  const { data: activeGame, isLoading: isLoadingActiveGame } = useQuery({
    queryKey: ['/api/games/active'],
    enabled: isAuthenticated,
  });

  // Initialize or update board when active game data changes
  useEffect(() => {
    if (activeGame) {
      setGame(activeGame);
      setBoard(JSON.parse(JSON.stringify(activeGame.currentBoard)));
      setInitialBoard(JSON.parse(JSON.stringify(activeGame.puzzle.initialBoard)));
      setDifficulty(activeGame.puzzle.difficultyLevel);
      setTime(activeGame.timeSpent);
      if (!activeGame.isCompleted) {
        startTimer();
      }
    }
  }, [activeGame, setTime, startTimer]);

  // Update highlighted cells when selected cell changes
  useEffect(() => {
    if (selectedCell) {
      updateHighlightedCells(selectedCell[0], selectedCell[1]);
    } else {
      setHighlightedCells(new Set());
    }
  }, [selectedCell, board]);

  // Auto-save game progress every 30 seconds
  useEffect(() => {
    if (!game || game.isCompleted) return;

    const saveInterval = setInterval(() => {
      if (game) {
        saveGameProgress();
      }
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [game, board, time]);

  // Create a new game mutation
  const createGameMutation = useMutation({
    mutationFn: async (difficultyLevel: number) => {
      const res = await apiRequest('POST', '/api/games', { difficultyLevel });
      return res.json();
    },
    onSuccess: (newGame) => {
      setGame(newGame);
      setBoard(JSON.parse(JSON.stringify(newGame.currentBoard)));
      setInitialBoard(JSON.parse(JSON.stringify(newGame.puzzle.initialBoard)));
      setDifficulty(newGame.puzzle.difficultyLevel);
      resetTimer();
      startTimer();
      queryClient.invalidateQueries({ queryKey: ['/api/games/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "ゲームの作成に失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to create game:", error);
    }
  });

  // Load game mutation
  const loadGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest('GET', `/api/games/${gameId}`, undefined);
      return res.json();
    },
    onSuccess: (loadedGame) => {
      setGame(loadedGame);
      setBoard(JSON.parse(JSON.stringify(loadedGame.currentBoard)));
      setInitialBoard(JSON.parse(JSON.stringify(loadedGame.puzzle.initialBoard)));
      setDifficulty(loadedGame.puzzle.difficultyLevel);
      setTime(loadedGame.timeSpent);
      if (!loadedGame.isCompleted) {
        startTimer();
      }
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "ゲームの読み込みに失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to load game:", error);
    }
  });

  // Load shared game mutation
  const loadSharedGameMutation = useMutation({
    mutationFn: async (sharedPuzzleId: number) => {
      const res = await apiRequest('POST', `/api/shared-puzzles/${sharedPuzzleId}/play`, undefined);
      return res.json();
    },
    onSuccess: (newGame) => {
      setGame(newGame);
      setBoard(JSON.parse(JSON.stringify(newGame.currentBoard)));
      setInitialBoard(JSON.parse(JSON.stringify(newGame.puzzle.initialBoard)));
      setDifficulty(newGame.puzzle.difficultyLevel);
      resetTimer();
      startTimer();
      queryClient.invalidateQueries({ queryKey: ['/api/games/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-puzzles'] });
      
      toast({
        title: "シェアされたパズルをロードしました",
        description: `レベル ${newGame.puzzle.difficultyLevel} のパズルを開始します。`,
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "シェアされたパズルの読み込みに失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to load shared puzzle:", error);
    }
  });

  // Save game mutation
  const saveGameMutation = useMutation({
    mutationFn: async () => {
      if (!game) throw new Error("No active game to save");
      
      const res = await apiRequest('PATCH', `/api/games/${game.id}`, { 
        currentBoard: board,
        timeSpent: time
      });
      return res.json();
    },
    onSuccess: (updatedGame) => {
      setGame(updatedGame);
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      toast({
        title: "ゲームを保存しました",
        description: "ゲームの進行状況が保存されました。"
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "ゲームの保存に失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to save game:", error);
    }
  });

  // Complete game mutation
  const completeGameMutation = useMutation({
    mutationFn: async () => {
      if (!game) throw new Error("No active game to complete");
      
      const res = await apiRequest('PATCH', `/api/games/${game.id}`, { 
        currentBoard: board,
        isCompleted: true,
        timeSpent: time,
        completedAt: new Date().toISOString()
      });
      return res.json();
    },
    onSuccess: (completedGame) => {
      setGame(completedGame);
      pauseTimer();
      setShowCelebration(true);
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "ゲームの完了処理に失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to complete game:", error);
    }
  });

  // Create a new game
  const createNewGame = async (difficultyLevel: number) => {
    await createGameMutation.mutateAsync(difficultyLevel);
  };

  // Load a specific game
  const loadGame = async (gameId: number) => {
    await loadGameMutation.mutateAsync(gameId);
  };

  // Load a shared game
  const loadSharedGame = async (sharedPuzzleId: number) => {
    await loadSharedGameMutation.mutateAsync(sharedPuzzleId);
  };

  // Save current game progress
  const saveGame = async () => {
    await saveGameMutation.mutateAsync();
  };

  // Save game progress without notification
  const saveGameProgress = async () => {
    if (!game) return;
    
    try {
      const res = await apiRequest('PATCH', `/api/games/${game.id}`, { 
        currentBoard: board,
        timeSpent: time
      });
      const updatedGame = await res.json();
      setGame(updatedGame);
    } catch (error) {
      console.error("Failed to auto-save game:", error);
    }
  };

  // Reset game to initial state
  const resetGame = async () => {
    if (!game) return;
    
    setBoard(JSON.parse(JSON.stringify(game.puzzle.initialBoard)));
    resetTimer();
    startTimer();
    
    await saveGameMutation.mutateAsync();
    
    toast({
      title: "ゲームをリセットしました",
      description: "初期状態に戻りました。"
    });
  };

  // Check if a cell is fixed (part of the initial puzzle)
  const isFixedCell = (row: number, col: number): boolean => {
    return initialBoard[row][col] !== null;
  };

  // Set value for the selected cell
  const setValue = (value: number | null) => {
    if (!selectedCell || isFixedCell(selectedCell[0], selectedCell[1])) return;
    
    const [row, col] = selectedCell;
    const newBoard = [...board];
    newBoard[row][col] = value;
    setBoard(newBoard);
    
    // Check if the board is complete after this move
    if (value !== null && isBoardComplete(newBoard)) {
      completeGameMutation.mutate();
    }
  };

  // Check if a cell has a conflict (same number in row, column or box)
  const hasConflict = (row: number, col: number): boolean => {
    const value = board[row][col];
    if (value === null) return false;
    
    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && board[row][c] === value) {
        return true;
      }
    }
    
    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && board[r][col] === value) {
        return true;
      }
    }
    
    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && board[r][c] === value) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Check if a cell has the same value as the provided value
  const isSameValue = (row: number, col: number, value: number): boolean => {
    return board[row][col] === value && value !== null;
  };

  // Update highlighted cells based on selected cell
  const updateHighlightedCells = (row: number, col: number) => {
    const newHighlighted = new Set<string>();
    const value = board[row][col];
    
    // Highlight same row
    for (let c = 0; c < 9; c++) {
      newHighlighted.add(`${row},${c}`);
    }
    
    // Highlight same column
    for (let r = 0; r < 9; r++) {
      newHighlighted.add(`${r},${col}`);
    }
    
    // Highlight same 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        newHighlighted.add(`${r},${c}`);
      }
    }
    
    // Highlight cells with same value
    if (value !== null) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === value) {
            newHighlighted.add(`${r},${c},value`);
          }
        }
      }
    }
    
    setHighlightedCells(newHighlighted);
  };

  const value = {
    game,
    isLoading: isLoadingActiveGame || createGameMutation.isPending || loadGameMutation.isPending,
    board,
    initialBoard,
    selectedCell,
    setSelectedCell,
    setValue,
    createNewGame,
    loadGame,
    loadSharedGame,
    saveGame,
    difficulty,
    setDifficulty,
    isFixedCell,
    hasConflict,
    isSameValue,
    highlightedCells,
    time,
    formattedTime,
    startTimer,
    pauseTimer,
    resetTimer,
    showCelebration,
    setShowCelebration,
    resetGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
