import { useGame } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";

export default function NumberPad() {
  const { setValue, selectedCell, board } = useGame();

  const handleNumberClick = (num: number | null) => {
    setValue(num);
  };
  
  // Check if a number is already used 9 times (maximum allowed in sudoku)
  const isNumberFullyUsed = (num: number): boolean => {
    if (!board) return false;
    
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === num) {
          count++;
        }
      }
    }
    return count >= 9;
  };

  // Check if the selected cell contains this number
  const isActiveNumber = (num: number): boolean => {
    if (!selectedCell || !board) return false;
    return board[selectedCell[0]][selectedCell[1]] === num;
  };

  return (
    <div className="number-pad mt-4 grid grid-cols-5 gap-2 md:max-w-md mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Button
          key={num}
          onClick={() => handleNumberClick(num)}
          variant="outline"
          size="lg"
          className={cn(
            "number-btn h-12 text-lg font-mono",
            isNumberFullyUsed(num) && "opacity-50",
            isActiveNumber(num) && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          disabled={!selectedCell}
        >
          {num}
        </Button>
      ))}
      <Button
        onClick={() => handleNumberClick(null)}
        variant="outline"
        size="lg"
        className="number-btn col-span-2 h-12"
        disabled={!selectedCell}
      >
        <Delete className="h-5 w-5" />
      </Button>
    </div>
  );
}
