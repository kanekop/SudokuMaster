import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, LogIn } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  // Get stats if authenticated
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
    enabled: isAuthenticated,
  });

  // Get active game
  const { data: activeGame } = useQuery({
    queryKey: ['/api/games/active'],
    enabled: isAuthenticated,
  });

  const hasActiveGame = !!activeGame;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">数独アプリへようこそ</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">数独を始めましょう</h2>
              <p className="text-muted-foreground mb-6">
                数独は9×9のグリッドに1から9までの数字を入れるパズルです。各行、各列、各3×3ブロックに同じ数字が重複してはいけません。
              </p>

              {isAuthenticated ? (
                <div className="flex flex-col space-y-4">
                  {hasActiveGame ? (
                    <Button asChild size="lg">
                      <Link href="/game">
                        続きからプレイ
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg">
                      <Link href="/game">
                        新しいゲームを始める
                        <ChevronRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link href="/history">
                      過去のゲームを見る
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Button asChild size="lg">
                    <a href="/api/login" className="flex items-center justify-center">
                      <LogIn className="mr-2 h-5 w-5" />
                      ログインしてプレイ
                    </a>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    ログインすると、ゲームの進行状況が保存され、端末をまたいでプレイできます。
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {isAuthenticated && stats && (
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">あなたの統計</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">総ゲーム数</p>
                    <p className="text-2xl font-bold text-primary">{stats.totalGames}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">完了ゲーム</p>
                    <p className="text-2xl font-bold text-primary">{stats.completedGames}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">平均クリア時間</p>
                    <p className="text-2xl font-bold text-primary">
                      {stats.averageCompletionTime 
                        ? Math.floor(stats.averageCompletionTime / 60) + ":" + 
                          (stats.averageCompletionTime % 60).toString().padStart(2, '0') 
                        : "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">よくクリアするレベル</p>
                    <p className="text-2xl font-bold text-primary">
                      {stats.mostCompletedLevel 
                        ? `レベル ${stats.mostCompletedLevel.level}` 
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-semibold mb-4">遊び方</h2>
            <ul className="space-y-3 list-disc list-inside text-muted-foreground">
              <li>1～9の数字を各行、各列、各3x3ブロックに1つずつ入れます</li>
              <li>同じ行、列、ブロックに同じ数字は入れられません</li>
              <li>最初から入っている数字（太字の数字）は動かせません</li>
              <li>全てのマスを正しく埋めるとゲーム完了です</li>
              <li>難易度は10段階から選べます（レベル1が最も簡単）</li>
              <li>タイマーでプレイ時間を計測します</li>
              <li>いつでも保存して後で続きからプレイできます</li>
              <li>過去に解いたパズルを再度プレイすることもできます</li>
              <li>友達にパズルをシェアすることもできます</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {!isLoading && !isAuthenticated && (
        <div className="mt-8 p-4 border rounded-lg bg-muted/30">
          <p className="text-center text-muted-foreground">
            アカウントをお持ちでない方は、ログインしてアカウントを作成できます。
            <br />
            <a 
              href="/api/login" 
              className="text-primary hover:underline mt-2 inline-block"
            >
              ログインする →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
