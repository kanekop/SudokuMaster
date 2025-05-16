import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateSudoku } from "./sudoku";
import { z } from "zod";
import { updateGameSchema, insertSharedPuzzleSchema } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth endpoint to get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // GAME ENDPOINTS

  // Start a new game
  app.post("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { difficultyLevel } = req.body;
      
      // Validate difficulty level
      if (!difficultyLevel || typeof difficultyLevel !== 'number' || difficultyLevel < 1 || difficultyLevel > 10) {
        return res.status(400).json({ message: "Invalid difficulty level" });
      }
      
      // Get existing puzzles at this difficulty or generate a new one
      let puzzles = await storage.getPuzzlesByDifficulty(difficultyLevel);
      
      if (puzzles.length === 0) {
        // Generate a new puzzle
        const { initialBoard, solvedBoard } = generateSudoku(difficultyLevel);
        const newPuzzle = await storage.createPuzzle({
          initialBoard,
          solvedBoard,
          difficultyLevel
        });
        puzzles = [newPuzzle];
      }
      
      // Randomly select a puzzle from available ones
      const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
      
      // Create a new game
      const game = await storage.createGame({
        userId,
        puzzleId: puzzle.id,
        currentBoard: puzzle.initialBoard,
        isCompleted: false,
        timeSpent: 0,
        startedAt: new Date()
      });
      
      res.status(201).json({
        ...game,
        puzzle
      });
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  // Get active game
  app.get("/api/games/active", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const game = await storage.getActiveGameByUserId(userId);
      
      if (!game) {
        return res.status(404).json({ message: "No active game found" });
      }
      
      res.json(game);
    } catch (error) {
      console.error("Error fetching active game:", error);
      res.status(500).json({ message: "Failed to fetch active game" });
    }
  });

  // Get game history
  app.get("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const period = req.query.period;
      const difficulty = req.query.difficulty;
      const status = req.query.status || 'all';
      
      const filters: any = {};
      
      // Parse period filter
      if (period) {
        const now = new Date();
        let startDate = new Date();
        
        if (period === 'week') {
          startDate.setDate(now.getDate() - 7);
        } else if (period === 'month') {
          startDate.setMonth(now.getMonth() - 1);
        } else if (period === 'year') {
          startDate.setFullYear(now.getFullYear() - 1);
        } else if (period !== 'all') {
          return res.status(400).json({ message: "Invalid period parameter" });
        }
        
        if (period !== 'all') {
          filters.startDate = startDate;
          filters.endDate = now;
        }
      }
      
      // Parse difficulty filter
      if (difficulty) {
        if (difficulty === 'easy') {
          filters.difficultyRange = [1, 3];
        } else if (difficulty === 'medium') {
          filters.difficultyRange = [4, 7];
        } else if (difficulty === 'hard') {
          filters.difficultyRange = [8, 10];
        } else if (difficulty !== 'all') {
          return res.status(400).json({ message: "Invalid difficulty parameter" });
        }
      }
      
      // Parse status filter
      if (status && ['completed', 'in-progress', 'all'].includes(status)) {
        filters.status = status;
      } else {
        return res.status(400).json({ message: "Invalid status parameter" });
      }
      
      const games = await storage.getGamesByUserId(userId, filters);
      
      // Format the response with relative time
      const formattedGames = games.map(game => ({
        ...game,
        startedAtRelative: formatDistanceToNow(new Date(game.startedAt), { addSuffix: true }),
        completedAtRelative: game.completedAt ? formatDistanceToNow(new Date(game.completedAt), { addSuffix: true }) : null
      }));
      
      res.json(formattedGames);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get specific game
  app.get("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameId = parseInt(req.params.id);
      
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to access this game" });
      }
      
      const puzzle = await storage.getPuzzle(game.puzzleId);
      
      res.json({
        ...game,
        puzzle
      });
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // Update a game (save progress)
  app.patch("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameId = parseInt(req.params.id);
      
      if (isNaN(gameId)) {
        return res.status(400).json({ message: "Invalid game ID" });
      }
      
      const game = await storage.getGame(gameId);
      
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      
      if (game.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this game" });
      }
      
      // デバッグ用にリクエストボディをログ出力
      console.log("Update game request body:", JSON.stringify(req.body));
      
      // Validate update data
      const validationResult = updateGameSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("Validation errors:", JSON.stringify(validationResult.error.errors));
        return res.status(400).json({ 
          message: "Invalid game data", 
          errors: validationResult.error.errors 
        });
      }
      
      const updateData = validationResult.data;
      console.log("Validated data:", JSON.stringify(updateData));
      
      // Update the game
      const updatedGame = await storage.updateGame(gameId, updateData);
      
      const puzzle = await storage.getPuzzle(updatedGame.puzzleId);
      
      res.json({
        ...updatedGame,
        puzzle
      });
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  // STATS ENDPOINTS

  // Get user stats
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // FRIENDS ENDPOINTS

  // Get friends
  app.get("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriendsByUserId(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // Add friend (by user ID)
  app.post("/api/friends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.body;
      
      if (!friendId) {
        return res.status(400).json({ message: "Friend ID is required" });
      }
      
      // Check if the friend exists
      const friend = await storage.getUser(friendId);
      if (!friend) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if trying to add self
      if (userId === friendId) {
        return res.status(400).json({ message: "Cannot add yourself as a friend" });
      }
      
      // Add as friend
      await storage.addFriend({
        userId,
        friendId
      });
      
      // Also add reverse relationship
      await storage.addFriend({
        userId: friendId,
        friendId: userId
      });
      
      res.status(201).json({ message: "Friend added successfully" });
    } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).json({ message: "Failed to add friend" });
    }
  });

  // Remove friend
  app.delete("/api/friends/:friendId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.params;
      
      // Remove both sides of the relationship
      await storage.removeFriend(userId, friendId);
      await storage.removeFriend(friendId, userId);
      
      res.json({ message: "Friend removed successfully" });
    } catch (error) {
      console.error("Error removing friend:", error);
      res.status(500).json({ message: "Failed to remove friend" });
    }
  });

  // SHARED PUZZLES ENDPOINTS

  // Get shared puzzles
  app.get("/api/shared-puzzles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedPuzzles = await storage.getSharedPuzzlesByReceiverId(userId);
      res.json(sharedPuzzles);
    } catch (error) {
      console.error("Error fetching shared puzzles:", error);
      res.status(500).json({ message: "Failed to fetch shared puzzles" });
    }
  });

  // Share a puzzle
  app.post("/api/shared-puzzles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const validationResult = insertSharedPuzzleSchema.safeParse({
        ...req.body,
        senderId: userId
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid shared puzzle data", 
          errors: validationResult.error.errors 
        });
      }
      
      const sharedPuzzleData = validationResult.data;
      
      // Check if puzzle exists
      const puzzle = await storage.getPuzzle(sharedPuzzleData.puzzleId);
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      // Check if receiver exists
      const receiver = await storage.getUser(sharedPuzzleData.receiverId);
      if (!receiver) {
        return res.status(404).json({ message: "Receiver not found" });
      }
      
      // Create shared puzzle
      const sharedPuzzle = await storage.createSharedPuzzle(sharedPuzzleData);
      
      res.status(201).json(sharedPuzzle);
    } catch (error) {
      console.error("Error sharing puzzle:", error);
      res.status(500).json({ message: "Failed to share puzzle" });
    }
  });

  // Play a shared puzzle
  app.post("/api/shared-puzzles/:id/play", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sharedPuzzleId = parseInt(req.params.id);
      
      if (isNaN(sharedPuzzleId)) {
        return res.status(400).json({ message: "Invalid shared puzzle ID" });
      }
      
      // Get the shared puzzle
      const sharedPuzzle = await storage.getSharedPuzzle(sharedPuzzleId);
      
      if (!sharedPuzzle) {
        return res.status(404).json({ message: "Shared puzzle not found" });
      }
      
      if (sharedPuzzle.receiverId !== userId) {
        return res.status(403).json({ message: "You don't have permission to play this shared puzzle" });
      }
      
      // Get the puzzle
      const puzzle = await storage.getPuzzle(sharedPuzzle.puzzleId);
      if (!puzzle) {
        return res.status(404).json({ message: "Puzzle not found" });
      }
      
      // Create a new game for the user with this puzzle
      const game = await storage.createGame({
        userId,
        puzzleId: puzzle.id,
        currentBoard: puzzle.initialBoard,
        isCompleted: false,
        timeSpent: 0,
        startedAt: new Date()
      });
      
      // Mark the shared puzzle as played
      await storage.markSharedPuzzleAsPlayed(sharedPuzzleId);
      
      res.status(201).json({
        ...game,
        puzzle
      });
    } catch (error) {
      console.error("Error playing shared puzzle:", error);
      res.status(500).json({ message: "Failed to play shared puzzle" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
