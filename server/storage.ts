import {
  users, 
  type User, 
  type UpsertUser,
  puzzles,
  type Puzzle,
  type InsertPuzzle,
  games,
  type Game,
  type InsertGame,
  sharedPuzzles,
  type SharedPuzzle,
  type InsertSharedPuzzle,
  friends,
  type Friend,
  type InsertFriend,
  type GameWithDetails,
  type SharedPuzzleWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Puzzle operations
  getPuzzle(id: number): Promise<Puzzle | undefined>;
  getPuzzlesByDifficulty(level: number): Promise<Puzzle[]>;
  createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle>;
  
  // Game operations
  getGame(id: number): Promise<Game | undefined>;
  getActiveGameByUserId(userId: string): Promise<GameWithDetails | undefined>;
  getGamesByUserId(
    userId: string, 
    filters?: { 
      startDate?: Date, 
      endDate?: Date, 
      difficultyRange?: [number, number], 
      status?: 'completed' | 'in-progress' | 'all'
    }
  ): Promise<GameWithDetails[]>;
  getGamesByUserIdAndPuzzleId(userId: string, puzzleId: number): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, data: Partial<Game>): Promise<Game>;
  
  // Shared puzzle operations
  getSharedPuzzlesByReceiverId(userId: string): Promise<SharedPuzzleWithDetails[]>;
  getSharedPuzzle(id: number): Promise<SharedPuzzle | undefined>;
  createSharedPuzzle(sharedPuzzle: InsertSharedPuzzle): Promise<SharedPuzzle>;
  markSharedPuzzleAsPlayed(id: number): Promise<SharedPuzzle>;
  
  // Friend operations
  getFriendsByUserId(userId: string): Promise<User[]>;
  addFriend(friendship: InsertFriend): Promise<Friend>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  // Stats
  getUserStats(userId: string): Promise<{
    totalGames: number, 
    completedGames: number,
    inProgressGames: number,
    averageCompletionTime: number | null,
    fastestCompletionTime: number | null,
    mostCompletedLevel: { level: number, count: number } | null
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  
  // Puzzle operations
  async getPuzzle(id: number): Promise<Puzzle | undefined> {
    const [puzzle] = await db.select().from(puzzles).where(eq(puzzles.id, id));
    return puzzle;
  }
  
  async getPuzzlesByDifficulty(level: number): Promise<Puzzle[]> {
    return db.select().from(puzzles).where(eq(puzzles.difficultyLevel, level));
  }
  
  async createPuzzle(puzzle: InsertPuzzle): Promise<Puzzle> {
    const [newPuzzle] = await db.insert(puzzles).values(puzzle).returning();
    return newPuzzle;
  }
  
  // Game operations
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getActiveGameByUserId(userId: string): Promise<GameWithDetails | undefined> {
    const result = await db
      .select({
        game: games,
        puzzle: puzzles
      })
      .from(games)
      .innerJoin(puzzles, eq(games.puzzleId, puzzles.id))
      .where(
        and(
          eq(games.userId, userId),
          eq(games.isCompleted, false)
        )
      )
      .orderBy(desc(games.startedAt))
      .limit(1);
    
    if (result.length === 0) {
      return undefined;
    }
    
    return {
      ...result[0].game,
      puzzle: result[0].puzzle
    };
  }

  async getGamesByUserId(
    userId: string, 
    filters?: { 
      startDate?: Date, 
      endDate?: Date, 
      difficultyRange?: [number, number], 
      status?: 'completed' | 'in-progress' | 'all'
    }
  ): Promise<GameWithDetails[]> {
    let query = db
      .select({
        game: games,
        puzzle: puzzles
      })
      .from(games)
      .innerJoin(puzzles, eq(games.puzzleId, puzzles.id))
      .where(eq(games.userId, userId));
    
    if (filters) {
      if (filters.startDate) {
        query = query.where(gte(games.startedAt, filters.startDate));
      }
      if (filters.endDate) {
        query = query.where(lte(games.startedAt, filters.endDate));
      }
      if (filters.difficultyRange) {
        query = query.where(
          and(
            gte(puzzles.difficultyLevel, filters.difficultyRange[0]),
            lte(puzzles.difficultyLevel, filters.difficultyRange[1])
          )
        );
      }
      if (filters.status && filters.status !== 'all') {
        query = query.where(eq(games.isCompleted, filters.status === 'completed'));
      }
    }
    
    const result = await query.orderBy(desc(games.startedAt));
    
    return result.map(item => ({
      ...item.game,
      puzzle: item.puzzle
    }));
  }

  async getGamesByUserIdAndPuzzleId(userId: string, puzzleId: number): Promise<Game[]> {
    return db
      .select()
      .from(games)
      .where(
        and(
          eq(games.userId, userId),
          eq(games.puzzleId, puzzleId)
        )
      );
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async updateGame(id: number, data: Partial<Game>): Promise<Game> {
    console.log("UpdateGame called with data:", JSON.stringify(data));
    
    // 日付文字列を Date オブジェクトに変換
    const processedData = { ...data };
    
    // 日付に関する処理を安全に行う
    if (processedData.completedAt !== undefined) {
      // completedAt が文字列の場合は Date オブジェクトに変換
      if (processedData.completedAt !== null && typeof processedData.completedAt === 'string') {
        try {
          processedData.completedAt = new Date(processedData.completedAt);
          console.log("Converted completedAt to Date:", processedData.completedAt);
        } catch (e) {
          console.error("Error converting completedAt to Date:", e);
          // エラーが発生した場合は現在時刻を使用
          processedData.completedAt = new Date();
        }
      }
    }
    
    try {
      // データベース更新に使用するオブジェクトを作成
      const updateObj: any = {
        ...processedData,
        updatedAt: new Date()
      };
      
      console.log("Final update object:", JSON.stringify(updateObj, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));
      
      const [updatedGame] = await db
        .update(games)
        .set(updateObj)
        .where(eq(games.id, id))
        .returning();
      
      console.log("Game updated successfully:", JSON.stringify(updatedGame));
      return updatedGame;
    } catch (error) {
      console.error("Error in updateGame:", error);
      throw error;
    }
  }
  
  // Shared puzzle operations
  async getSharedPuzzlesByReceiverId(userId: string): Promise<SharedPuzzleWithDetails[]> {
    const result = await db
      .select({
        sharedPuzzle: sharedPuzzles,
        puzzle: puzzles,
        sender: users
      })
      .from(sharedPuzzles)
      .innerJoin(puzzles, eq(sharedPuzzles.puzzleId, puzzles.id))
      .innerJoin(users, eq(sharedPuzzles.senderId, users.id))
      .where(eq(sharedPuzzles.receiverId, userId))
      .orderBy(desc(sharedPuzzles.sharedAt));
    
    return result.map(item => ({
      ...item.sharedPuzzle,
      puzzle: item.puzzle,
      sender: item.sender
    }));
  }

  async getSharedPuzzle(id: number): Promise<SharedPuzzle | undefined> {
    const [sharedPuzzle] = await db.select().from(sharedPuzzles).where(eq(sharedPuzzles.id, id));
    return sharedPuzzle;
  }

  async createSharedPuzzle(sharedPuzzle: InsertSharedPuzzle): Promise<SharedPuzzle> {
    const [newSharedPuzzle] = await db.insert(sharedPuzzles).values(sharedPuzzle).returning();
    return newSharedPuzzle;
  }

  async markSharedPuzzleAsPlayed(id: number): Promise<SharedPuzzle> {
    const [updatedSharedPuzzle] = await db
      .update(sharedPuzzles)
      .set({ isPlayed: true })
      .where(eq(sharedPuzzles.id, id))
      .returning();
    return updatedSharedPuzzle;
  }
  
  // Friend operations
  async getFriendsByUserId(userId: string): Promise<User[]> {
    const result = await db
      .select({ friend: users })
      .from(friends)
      .innerJoin(users, eq(friends.friendId, users.id))
      .where(eq(friends.userId, userId));
    
    return result.map(item => item.friend);
  }

  async addFriend(friendship: InsertFriend): Promise<Friend> {
    const [newFriend] = await db.insert(friends).values(friendship).returning();
    return newFriend;
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friends)
      .where(
        and(
          eq(friends.userId, userId),
          eq(friends.friendId, friendId)
        )
      );
  }
  
  // Stats
  async getUserStats(userId: string): Promise<{
    totalGames: number, 
    completedGames: number,
    inProgressGames: number,
    averageCompletionTime: number | null,
    fastestCompletionTime: number | null,
    mostCompletedLevel: { level: number, count: number } | null
  }> {
    // Count games
    const totalGamesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(eq(games.userId, userId));
    
    const completedGamesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(
        and(
          eq(games.userId, userId),
          eq(games.isCompleted, true)
        )
      );
      
    const inProgressGamesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(
        and(
          eq(games.userId, userId),
          eq(games.isCompleted, false)
        )
      );
    
    // Time stats (for completed games only)
    const timeResults = await db
      .select({ 
        avg: sql<number>`avg(${games.timeSpent})`,
        min: sql<number>`min(${games.timeSpent})`
      })
      .from(games)
      .where(
        and(
          eq(games.userId, userId),
          eq(games.isCompleted, true)
        )
      );
    
    // Most completed level
    const levelCounts = await db
      .select({ 
        level: puzzles.difficultyLevel,
        count: sql<number>`count(*)`
      })
      .from(games)
      .innerJoin(puzzles, eq(games.puzzleId, puzzles.id))
      .where(
        and(
          eq(games.userId, userId),
          eq(games.isCompleted, true)
        )
      )
      .groupBy(puzzles.difficultyLevel)
      .orderBy(desc(sql<number>`count(*)`))
      .limit(1);
    
    const totalGames = totalGamesResult[0]?.count || 0;
    const completedGames = completedGamesResult[0]?.count || 0;
    const inProgressGames = inProgressGamesResult[0]?.count || 0;
    const averageCompletionTime = timeResults[0]?.avg || null;
    const fastestCompletionTime = timeResults[0]?.min || null;
    const mostCompletedLevel = levelCounts.length > 0 
      ? { level: levelCounts[0].level, count: levelCounts[0].count }
      : null;
    
    return {
      totalGames,
      completedGames,
      inProgressGames,
      averageCompletionTime,
      fastestCompletionTime,
      mostCompletedLevel
    };
  }
}

export const storage = new DatabaseStorage();
