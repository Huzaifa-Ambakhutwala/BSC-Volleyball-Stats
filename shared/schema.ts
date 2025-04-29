import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define Firebase data structure type definitions
// These won't be used with Drizzle but provide type safety for our Firebase data

export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  teamName: string;
  players: string[]; // Array of player IDs
};

export type Match = {
  id: string;
  courtNumber: number;
  teamA: string; // Team ID
  teamB: string; // Team ID
  startTime: string;
  scoreA: number;
  scoreB: number;
};

export type PlayerStats = {
  aces: number;
  serveErrors: number;
  spikes: number;
  spikeErrors: number;
  digs: number;
  blocks: number;
  netTouches: number;
  tips: number;
  dumps: number;
  footFaults: number;
  reaches: number;
  carries: number;
};

export type MatchStats = {
  [playerId: string]: PlayerStats;
};

// Keep original schema for Drizzle ORM compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
