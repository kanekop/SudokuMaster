import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import MobileTabs from "@/components/tabs/mobile-tabs";
import { useGame } from "@/context/game-context";
import { formatTime, difficultyText } from "@/lib/sudoku-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Grid, 
  History as HistoryIcon, 
  Users, 
  Play, 
  Share, 
  Trash, 
  LogIn 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { loadGame } = useGame();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    period: "week",
    difficulty: "all",
    status: "all",
  });

  // Get game history
  const { data: games, isLoading } = useQuery({
    queryKey: ['/api/games', filters],
    enabled: isAuthenticated,
    queryFn: async ({ queryKey }) => {
      const [_, filterParams] = queryKey;
      const params = new URLSearchParams();
      
      for (const [key, value] of Object.entries(filterParams)) {
        params.append(key, value as string);
      }
      
      const res = await fetch(`/api/games?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch game history');
      }
      
      return res.json();
    },
  });

  // Get user stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    enabled: isAuthenticated,
  });

  const handlePlayGame = async (gameId: number) => {
    try {
      await loadGame(gameId);
      navigate('/game');
    } catch (error) {
      console.error('Failed to load game:', error);
      toast({
        title: "エラー",
        description: "ゲームの読み込みに失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleShareGame = (gameId: number) => {
    toast({
      title: "準備中",
      description: "この機能は現在準備中です。",
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 text-center">
            <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
            <p className="text-muted-foreground mb-6">
              プレイ履歴を見るには、ログインしてください。ログインすると、ゲームの進行状況や過去のプレイ記録を確認できます。
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
        <Tabs value="history" className="w-full">
          <TabsList className="bg-transparent">
            <TabsTrigger value="game" asChild>
              <Link href="/game" className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                ゲーム
              </Link>
            </TabsTrigger>
            <TabsTrigger value="history" asChild>
              <Link href="/history" className="flex items-center">
                <HistoryIcon className="h-4 w-4 mr-2" />
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

      <div className="mb-6">
        <h2 className="text-xl font-medium mb-4">プレー履歴</h2>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-muted-foreground mb-1">期間</label>
            <Select 
              value={filters.period} 
              onValueChange={(value) => setFilters({...filters, period: value})}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="week">1週間</SelectItem>
                <SelectItem value="month">1か月</SelectItem>
                <SelectItem value="year">1年</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-muted-foreground mb-1">難易度</label>
            <Select 
              value={filters.difficulty} 
              onValueChange={(value) => setFilters({...filters, difficulty: value})}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="難易度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="easy">かんたん (1-3)</SelectItem>
                <SelectItem value="medium">ふつう (4-7)</SelectItem>
                <SelectItem value="hard">むずかしい (8-10)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-auto">
            <label className="block text-sm font-medium text-muted-foreground mb-1">状態</label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="状態を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="completed">完了</SelectItem>
                <SelectItem value="in-progress">進行中</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* History Records */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>難易度</TableHead>
                <TableHead>時間</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>アクション</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    ロード中...
                  </TableCell>
                </TableRow>
              ) : games && games.length > 0 ? (
                games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(game.startedAt).toLocaleDateString()} {new Date(game.startedAt).toLocaleTimeString()}
                      <div className="text-xs text-muted-foreground">{game.startedAtRelative}</div>
                    </TableCell>
                    <TableCell>レベル {game.puzzle.difficultyLevel}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatTime(game.timeSpent)}
                    </TableCell>
                    <TableCell>
                      {game.isCompleted ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          完了
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          進行中
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-2 text-primary"
                          onClick={() => handlePlayGame(game.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {game.isCompleted ? 'リプレイ' : '続ける'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary"
                          onClick={() => handleShareGame(game.id)}
                        >
                          <Share className="h-4 w-4 mr-1" />
                          シェア
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    プレイ履歴がありません。新しいゲームをプレイしましょう！
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">合計ゲーム数</h3>
                <p className="text-3xl font-bold text-primary">{stats.totalGames}</p>
                <div className="text-sm text-muted-foreground mt-2">
                  完了: {stats.completedGames} / 進行中: {stats.inProgressGames}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">平均クリア時間</h3>
                <p className="text-3xl font-bold text-primary">
                  {stats.averageCompletionTime 
                    ? formatTime(Math.round(stats.averageCompletionTime)) 
                    : "N/A"}
                </p>
                <div className="text-sm text-muted-foreground mt-2">
                  最速: {stats.fastestCompletionTime ? formatTime(stats.fastestCompletionTime) : "N/A"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-2">最多クリアレベル</h3>
                <p className="text-3xl font-bold text-primary">
                  {stats.mostCompletedLevel 
                    ? `レベル ${stats.mostCompletedLevel.level}` 
                    : "N/A"}
                </p>
                <div className="text-sm text-muted-foreground mt-2">
                  クリア数: {stats.mostCompletedLevel ? stats.mostCompletedLevel.count : 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Mobile Tab Navigation */}
      <MobileTabs />
      
      {/* Add bottom padding to account for mobile tabs */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
