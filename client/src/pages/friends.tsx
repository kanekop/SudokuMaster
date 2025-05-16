import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useGame } from "@/context/game-context";
import { apiRequest } from "@/lib/queryClient";
import MobileTabs from "@/components/tabs/mobile-tabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Grid,
  History as HistoryIcon,
  Users,
  Send,
  Play,
  Search,
  Plus,
  LogIn,
} from "lucide-react";

export default function Friends() {
  const [location, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const { loadSharedGame } = useGame();
  const { toast } = useToast();
  const [friendSearch, setFriendSearch] = useState("");
  const [selectedPuzzle, setSelectedPuzzle] = useState("");
  const [selectedFriend, setSelectedFriend] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  // Get friends list
  const { data: friends, isLoading: loadingFriends } = useQuery({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  // Get shared puzzles
  const { data: sharedPuzzles, isLoading: loadingSharedPuzzles } = useQuery({
    queryKey: ["/api/shared-puzzles"],
    enabled: isAuthenticated,
  });

  // Get game history for sharing
  const { data: games } = useQuery({
    queryKey: ["/api/games"],
    enabled: isAuthenticated,
  });

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await apiRequest("POST", "/api/friends", { friendId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "友達追加",
        description: "友達リストに追加しました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "友達の追加に失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to add friend:", error);
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await apiRequest("DELETE", `/api/friends/${friendId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "友達削除",
        description: "友達リストから削除しました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "友達の削除に失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to remove friend:", error);
    },
  });

  // Share puzzle mutation
  const sharePuzzleMutation = useMutation({
    mutationFn: async (data: { puzzleId: number; receiverId: string; message?: string }) => {
      const res = await apiRequest("POST", "/api/shared-puzzles", data);
      return res.json();
    },
    onSuccess: () => {
      setSelectedPuzzle("");
      setSelectedFriend("");
      setShareMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/shared-puzzles"] });
      toast({
        title: "パズル送信",
        description: "パズルを友達に送信しました。",
      });
    },
    onError: (error) => {
      toast({
        title: "エラー",
        description: "パズルの送信に失敗しました。",
        variant: "destructive",
      });
      console.error("Failed to share puzzle:", error);
    },
  });

  // Play shared puzzle
  const handlePlaySharedPuzzle = async (sharedPuzzleId: number) => {
    try {
      await loadSharedGame(sharedPuzzleId);
      navigate("/game");
    } catch (error) {
      console.error("Failed to load shared puzzle:", error);
      toast({
        title: "エラー",
        description: "シェアされたパズルの読み込みに失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleSharePuzzle = () => {
    if (!selectedPuzzle || !selectedFriend) {
      toast({
        title: "入力不足",
        description: "パズルと友達を選択してください。",
        variant: "destructive",
      });
      return;
    }

    sharePuzzleMutation.mutate({
      puzzleId: parseInt(selectedPuzzle),
      receiverId: selectedFriend,
      message: shareMessage || undefined,
    });
  };

  // Get user initials for avatar
  const getUserInitials = (user: any) => {
    if (!user) return "?";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "?";
  };

  // Filter friends by search term
  const filteredFriends = friends?.filter((friend: any) => {
    const searchLower = friendSearch.toLowerCase();
    const name = `${friend.firstName || ""} ${friend.lastName || ""}`.toLowerCase();
    const email = (friend.email || "").toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-8 text-center">
            <h1 className="text-2xl font-bold mb-4">ログインが必要です</h1>
            <p className="text-muted-foreground mb-6">
              友達機能を使用するには、ログインしてください。友達とパズルを共有したり、シェアされたパズルをプレイできます。
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
        <Tabs value="friends" className="w-full">
          <TabsList className="bg-transparent">
            <TabsTrigger value="game" asChild>
              <Link href="/game">
                <a className="flex items-center">
                  <Grid className="h-4 w-4 mr-2" />
                  ゲーム
                </a>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="history" asChild>
              <Link href="/history">
                <a className="flex items-center">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  履歴
                </a>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="friends" asChild>
              <Link href="/friends">
                <a className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  友達
                </a>
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-medium mb-4">友達</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Friends List */}
          <div className="col-span-1 md:col-span-2">
            <Card>
              <CardHeader className="py-3 px-4 bg-muted/50 border-b">
                <CardTitle className="text-lg">友達リスト</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4 relative">
                  <Input
                    type="text"
                    placeholder="友達を検索..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>

                <div className="divide-y">
                  {loadingFriends ? (
                    <div className="py-8 text-center text-muted-foreground">友達を読み込み中...</div>
                  ) : filteredFriends && filteredFriends.length > 0 ? (
                    filteredFriends.map((friend: any) => (
                      <div key={friend.id} className="py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3 bg-primary-light">
                            <AvatarImage src={friend.profileImageUrl || ""} />
                            <AvatarFallback>
                              {getUserInitials(friend)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {friend.firstName} {friend.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {friend.email || ""}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => setSelectedFriend(friend.id)}
                        >
                          パズル送信
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      友達がいません。IDで友達を追加できます。
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shared Puzzles */}
            <Card className="mt-6">
              <CardHeader className="py-3 px-4 bg-muted/50 border-b">
                <CardTitle className="text-lg">シェアされたパズル</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {loadingSharedPuzzles ? (
                  <div className="py-8 text-center text-muted-foreground">
                    シェアされたパズルを読み込み中...
                  </div>
                ) : sharedPuzzles && sharedPuzzles.length > 0 ? (
                  <div className="divide-y">
                    {sharedPuzzles.map((puzzle: any) => (
                      <div key={puzzle.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {puzzle.sender.firstName} {puzzle.sender.lastName}からのパズル
                            </div>
                            <div className="text-sm text-muted-foreground">
                              レベル {puzzle.puzzle.difficultyLevel} •{" "}
                              {new Date(puzzle.sharedAt).toLocaleDateString()} 送信
                            </div>
                            {puzzle.message && (
                              <div className="mt-1 text-sm border-l-2 border-muted pl-2 italic">
                                {puzzle.message}
                              </div>
                            )}
                          </div>
                          <div>
                            <Button
                              size="sm"
                              onClick={() => handlePlaySharedPuzzle(puzzle.id)}
                              disabled={puzzle.isPlayed}
                            >
                              {puzzle.isPlayed ? "プレイ済み" : "プレイ"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    シェアされたパズルはありません。
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Share Puzzle Panel */}
          <div className="col-span-1 space-y-6">
            <Card>
              <CardHeader className="py-3 px-4 bg-muted/50 border-b">
                <CardTitle className="text-lg">パズルをシェアする</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    パズルを選択
                  </label>
                  <Select value={selectedPuzzle} onValueChange={setSelectedPuzzle}>
                    <SelectTrigger>
                      <SelectValue placeholder="パズルを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {games?.filter((game: any) => game.isCompleted).map((game: any) => (
                        <SelectItem key={game.puzzleId} value={game.puzzleId.toString()}>
                          {new Date(game.completedAt || game.startedAt).toLocaleDateString()} 完了 (レベル{" "}
                          {game.puzzle.difficultyLevel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    友達を選択
                  </label>
                  <Select value={selectedFriend} onValueChange={setSelectedFriend}>
                    <SelectTrigger>
                      <SelectValue placeholder="友達を選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {friends?.map((friend: any) => (
                        <SelectItem key={friend.id} value={friend.id}>
                          {friend.firstName} {friend.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    メッセージ (任意)
                  </label>
                  <Textarea
                    placeholder="このパズル面白いよ！"
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    className="h-24 resize-none"
                  />
                </div>

                <Button
                  className="w-full flex items-center justify-center"
                  onClick={handleSharePuzzle}
                  disabled={!selectedPuzzle || !selectedFriend || sharePuzzleMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  送信する
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4 bg-muted/50 border-b">
                <CardTitle className="text-lg">友達を追加</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  友達のIDを入力して友達リストに追加できます。
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    友達ID
                  </label>
                  <Input
                    type="text"
                    placeholder="友達IDを入力..."
                    className="mb-2"
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  友達を追加
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <MobileTabs />

      {/* Add bottom padding to account for mobile tabs */}
      <div className="md:hidden h-16"></div>
    </>
  );
}
