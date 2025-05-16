import { useGame } from "@/context/game-context";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

export default function SudokuBoard() {
  const { 
    board, 
    selectedCell, 
    setSelectedCell, 
    isFixedCell, 
    hasConflict, 
    highlightedCells 
  } = useGame();

  const isSelected = useCallback(
    (row: number, col: number) => {
      return selectedCell !== null && selectedCell[0] === row && selectedCell[1] === col;
    },
    [selectedCell]
  );

  const isHighlighted = useCallback(
    (row: number, col: number) => {
      return highlightedCells.has(`${row},${col}`);
    },
    [highlightedCells]
  );

  const isSameValue = useCallback(
    (row: number, col: number) => {
      return highlightedCells.has(`${row},${col},value`);
    },
    [highlightedCells]
  );

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col]);
  };

  return (
    <div className="sudoku-board-container mx-auto max-w-md">
      <div className="sudoku-grid border-2 border-gray-900 dark:border-gray-100 grid grid-cols-9 grid-rows-9 w-full max-w-500px aspect-square">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                "sudoku-cell w-full h-full flex items-center justify-center cursor-pointer transition-all border border-gray-300 dark:border-gray-700 font-mono",
                isSelected(rowIndex, colIndex) && "bg-blue-200 dark:bg-blue-900",
                isHighlighted(rowIndex, colIndex) && !isSelected(rowIndex, colIndex) && "bg-blue-50 dark:bg-blue-950",
                isSameValue(rowIndex, colIndex) && !isSelected(rowIndex, colIndex) && "bg-indigo-100 dark:bg-indigo-900",
                isFixedCell(rowIndex, colIndex) && "font-bold text-gray-900 dark:text-gray-100",
                hasConflict(rowIndex, colIndex) && "text-red-600 dark:text-red-400",
                // Add border styling for 3x3 boxes
                colIndex % 3 === 2 && colIndex !== 8 && "border-r-2 border-r-gray-900 dark:border-r-gray-100",
                rowIndex % 3 === 2 && rowIndex !== 8 && "border-b-2 border-b-gray-900 dark:border-b-gray-100"
              )}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              data-row={rowIndex}
              data-col={colIndex}
            >
              {cell !== null ? cell : ""}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
