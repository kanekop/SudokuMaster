import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGame } from "@/context/game-context";
import { useAuth } from "@/hooks/useAuth";
import SudokuBoard from "@/components/game/sudoku-board";
import NumberPad from "@/components/game/number-pad";
import GameControls from "@/components/game/game-controls";
import CelebrationOverlay from "@/components/ui/celebration";
import MobileTabs from "@/components/tabs/mobile-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid, History, Users, LogIn } from "lucide-react";

export default function Game() {
  const { isAuthenticated } = useAuth();
  const { game } = useGame();
  const [activeTab, setActiveTab] = useState("game");

  useEffect(() => {
    // Update document title with game info
    document.title = game 
      ? `レベル ${game.puzzle.difficultyLevel} - 数独アプリ` 
      : "数独アプリ";
  }, [game]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 text-center">
            <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
            <p className="text-muted-foreground mb-6">
              ゲームをプレイするには、ログインしてください。ログインすると、ゲームの進行状況が保存され、端末をまたいでプレイできます。
            </p>
            <Button asChild size="lg">
              <a href="/api/login" className="flex items-center justify-center">
                <LogIn className="mr-2 h-5 w-5" />
                ログインしてプレイ
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <div className="hidden md:block mb-6 border-b border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent">
            <TabsTrigger value="game" asChild>
              <Link href="/game" className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                ゲーム
              </Link>
            </TabsTrigger>
            <TabsTrigger value="history" asChild>
              <Link href="/history" className="flex items-center">
                <History className="h-4 w-4 mr-2" />
                履歴
              </Link>
            </TabsTrigger>
            <TabsTrigger value="friends" asChild>
              <Link href="/friends" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                友達
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Game Controls (Left Side) */}
        <div className="w-full md:w-1/3 lg:w-1/4 order-2 md:order-1">
          <GameControls />
          
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="text-lg font-medium mb-2">遊び方</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>1～9の数字を各行、各列、各3x3ブロックに1つずつ入れます</li>
                <li>同じ行、列、ブロックに同じ数字は入れられません</li>
                <li>最初から入っている数字（太字の数字）は動かせません</li>
                <li>全てのマスを正しく埋めるとゲーム完了です</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        {/* Game Board (Right Side) */}
        <div className="w-full md:w-2/3 lg:w-3/4 order-1 md:order-2">
          <div className="mb-6 mx-auto">
            <SudokuBoard />
            <NumberPad />
          </div>
        </div>
      </div>

      {/* Celebration Overlay */}
      <CelebrationOverlay />
      
      {/* Mobile Tab Navigation */}
      <MobileTabs />
      
      {/* Add bottom padding to account for mobile tabs */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
