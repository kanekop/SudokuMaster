import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sudoku puzzles table
export const puzzles = pgTable("puzzles", {
  id: serial("id").primaryKey(),
  initialBoard: jsonb("initial_board").notNull(), // 2D array representation of the initial board
  solvedBoard: jsonb("solved_board").notNull(), // 2D array representation of the solved board
  difficultyLevel: integer("difficulty_level").notNull(), // 1-10
  createdAt: timestamp("created_at").defaultNow(),
});

// Game progress table
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  puzzleId: integer("puzzle_id").notNull().references(() => puzzles.id),
  currentBoard: jsonb("current_board").notNull(), // Current state of the game
  isCompleted: boolean("is_completed").default(false),
  timeSpent: integer("time_spent").default(0), // Time spent in seconds
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shared puzzles table
export const sharedPuzzles = pgTable("shared_puzzles", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  puzzleId: integer("puzzle_id").notNull().references(() => puzzles.id),
  message: text("message"),
  isPlayed: boolean("is_played").default(false),
  sharedAt: timestamp("shared_at").defaultNow(),
});

// Friends table
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertPuzzle = typeof puzzles.$inferInsert;
export type Puzzle = typeof puzzles.$inferSelect;

export type InsertGame = typeof games.$inferInsert;
export type Game = typeof games.$inferSelect;

export type InsertSharedPuzzle = typeof sharedPuzzles.$inferInsert;
export type SharedPuzzle = typeof sharedPuzzles.$inferSelect;

export type InsertFriend = typeof friends.$inferInsert;
export type Friend = typeof friends.$inferSelect;

// Zod schemas for validation
export const insertPuzzleSchema = createInsertSchema(puzzles).omit({ id: true, createdAt: true });
export const insertGameSchema = createInsertSchema(games).omit({ id: true, createdAt: true, updatedAt: true });
export const updateGameSchema = z.object({
  currentBoard: z.array(z.array(z.number().nullable())),
  isCompleted: z.boolean().optional(),
  timeSpent: z.number().optional(),
  completedAt: z.union([z.date(), z.string(), z.null()]).optional()
    .transform(val => {
      if (val === null) return null;
      if (val instanceof Date) return val;
      try {
        return new Date(val);
      } catch (e) {
        return new Date();
      }
    }),
});
export const insertSharedPuzzleSchema = createInsertSchema(sharedPuzzles).omit({ id: true, sharedAt: true, isPlayed: true });
export const insertFriendSchema = createInsertSchema(friends).omit({ id: true, createdAt: true });

// Game with additional info for API responses
export type GameWithDetails = Game & {
  puzzle: Puzzle;
};

// Shared puzzle with additional info for API responses
export type SharedPuzzleWithDetails = SharedPuzzle & {
  puzzle: Puzzle;
  sender: User;
};
