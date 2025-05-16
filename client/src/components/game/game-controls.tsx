import { useState } from "react";
import { useGame } from "@/context/game-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Save, Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function GameControls() {
  const { isAuthenticated } = useAuth();
  const { 
    createNewGame, 
    saveGame, 
    resetGame,
    formattedTime, 
    difficulty, 
    setDifficulty,
    isLoading,
    game
  } = useGame();
  const { toast } = useToast();
  const [isCreatingGame, setIsCreatingGame] = useState(false);

  const handleNewGame = async () => {
    if (!isAuthenticated) {
      toast({
        title: "ログインが必要です",
        description: "新しいゲームを作成するにはログインしてください。",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingGame(true);
    try {
      await createNewGame(difficulty);
      toast({
        title: "新しいゲームを開始しました",
        description: `レベル ${difficulty} のゲームを開始します。`
      });
    } catch (error) {
      console.error("Failed to create new game:", error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleSaveGame = async () => {
    if (!game) {
      toast({
        title: "ゲームが開始されていません",
        description: "保存するゲームがありません。",
        variant: "destructive",
      });
      return;
    }
    
    await saveGame();
  };

  const handleHint = () => {
    toast({
      title: "ヒント機能",
      description: "ヒント機能は現在準備中です。",
    });
  };

  const handleResetGame = async () => {
    if (!game) {
      toast({
        title: "ゲームが開始されていません",
        description: "リセットするゲームがありません。",
        variant: "destructive",
      });
      return;
    }
    
    await resetGame();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-lg font-medium mb-4">ゲーム情報</div>
        
        {/* Timer */}
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">タイマー</div>
          <div className="font-mono text-3xl font-medium">{formattedTime}</div>
        </div>
        
        {/* Difficulty */}
        <div className="mb-4">
          <div className="text-sm text-muted-foreground mb-1">難易度</div>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant="outline"
                size="sm"
                className={cn(
                  "text-sm py-1 px-2",
                  difficulty === level && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => setDifficulty(level)}
              >
                {level}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[6, 7, 8, 9, 10].map((level) => (
              <Button
                key={level}
                variant="outline"
                size="sm"
                className={cn(
                  "text-sm py-1 px-2",
                  difficulty === level && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => setDifficulty(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col space-y-3">
          <Button 
            className="flex items-center"
            onClick={handleNewGame}
            disabled={isLoading || isCreatingGame}
          >
            <Plus className="mr-2 h-4 w-4" />
            新しいゲーム
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleSaveGame}
            disabled={isLoading || !game}
          >
            <Save className="mr-2 h-4 w-4" />
            保存して終了
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleHint}
            disabled={isLoading || !game}
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            ヒント
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleResetGame}
            disabled={isLoading || !game}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            初期状態に戻す
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
