import { pgTable, text, serial, integer, timestamp, json, primaryKey, uniqueIndex, foreignKey, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Firebase data structure type definitions
// We'll keep these for compatibility during the transition from Firebase to PostgreSQL
export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  teamName: string;
  players: string[]; // Array of player IDs
  teamColor?: string; // Hex color code for the team
};

export type Match = {
  id: string;
  gameNumber: number;
  courtNumber: number;
  teamA: string; // Team ID
  teamB: string; // Team ID
  trackerTeam: string; // Team ID for tracking stats
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

// PostgreSQL Schema with Drizzle ORM
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const teamPlayers = pgTable("team_players", {
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.teamId, t.playerId] }),
}));

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  courtNumber: integer("court_number").notNull(),
  teamAId: integer("team_a_id").notNull().references(() => teams.id),
  teamBId: integer("team_b_id").notNull().references(() => teams.id),
  startTime: timestamp("start_time").notNull(),
  scoreA: integer("score_a").default(0).notNull(),
  scoreB: integer("score_b").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: "cascade" }),
  aces: integer("aces").default(0).notNull(),
  serveErrors: integer("serve_errors").default(0).notNull(),
  spikes: integer("spikes").default(0).notNull(),
  spikeErrors: integer("spike_errors").default(0).notNull(),
  digs: integer("digs").default(0).notNull(),
  blocks: integer("blocks").default(0).notNull(),
  netTouches: integer("net_touches").default(0).notNull(),
  tips: integer("tips").default(0).notNull(),
  dumps: integer("dumps").default(0).notNull(),
  footFaults: integer("foot_faults").default(0).notNull(),
  reaches: integer("reaches").default(0).notNull(),
  carries: integer("carries").default(0).notNull(),
}, (t) => ({
  unq: uniqueIndex("player_match_unique").on(t.matchId, t.playerId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
}));

export const playersRelations = relations(players, ({ many }) => ({
  teamPlayers: many(teamPlayers),
  stats: many(playerStats),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  teamPlayers: many(teamPlayers),
  matchesAsTeamA: many(matches, { relationName: "teamA" }),
  matchesAsTeamB: many(matches, { relationName: "teamB" }),
}));

export const teamPlayersRelations = relations(teamPlayers, ({ one }) => ({
  team: one(teams, {
    fields: [teamPlayers.teamId],
    references: [teams.id],
  }),
  player: one(players, {
    fields: [teamPlayers.playerId],
    references: [players.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  teamA: one(teams, {
    fields: [matches.teamAId],
    references: [teams.id],
    relationName: "teamA",
  }),
  teamB: one(teams, {
    fields: [matches.teamBId],
    references: [teams.id],
    relationName: "teamB",
  }),
  playerStats: many(playerStats),
}));

export const playerStatsRelations = relations(playerStats, ({ one }) => ({
  match: one(matches, {
    fields: [playerStats.matchId],
    references: [matches.id],
  }),
  player: one(players, {
    fields: [playerStats.playerId],
    references: [players.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users, {
  isAdmin: z.boolean().default(false)
}).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertPlayerSchema = createInsertSchema(players);
export const insertTeamSchema = createInsertSchema(teams);
export const insertTeamPlayerSchema = createInsertSchema(teamPlayers);
export const insertMatchSchema = createInsertSchema(matches, {
  completed: z.boolean().default(false)
}).omit({
  id: true
});
export const insertPlayerStatSchema = createInsertSchema(playerStats).omit({
  id: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player_DB = typeof players.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team_DB = typeof teams.$inferSelect;

export type InsertTeamPlayer = z.infer<typeof insertTeamPlayerSchema>;
export type TeamPlayer = typeof teamPlayers.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match_DB = typeof matches.$inferSelect;

export type InsertPlayerStat = z.infer<typeof insertPlayerStatSchema>;
export type PlayerStat_DB = typeof playerStats.$inferSelect;
