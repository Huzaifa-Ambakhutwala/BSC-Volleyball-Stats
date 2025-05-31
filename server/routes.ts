import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertPlayerSchema, 
  insertTeamSchema, 
  insertTeamPlayerSchema, 
  insertMatchSchema,
  insertPlayerStatSchema,
  insertTrackerLogSchema
} from "@shared/schema";
import { z } from "zod";

// Middleware to ensure user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Debug route to provide information about the application configuration
  app.get("/api/debug/env", async (req, res) => {
    try {
      // Return environment information (without exposing secrets)
      res.json({
        environment: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasFirebaseConfig: !!process.env.VITE_FIREBASE_API_KEY && 
                           !!process.env.VITE_FIREBASE_DATABASE_URL,
        server: 'active'
      });
    } catch (error) {
      console.error("Error in debug route:", error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Debug route to check Firebase configuration (redacted to avoid exposing secrets)
  app.get("/api/debug/firebase", async (req, res) => {
    try {
      const firebaseConfigStatus = {
        apiKey: process.env.VITE_FIREBASE_API_KEY ? "AVAILABLE" : "MISSING",
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ? "AVAILABLE" : "MISSING",
        databaseURL: process.env.VITE_FIREBASE_DATABASE_URL ? "AVAILABLE" : "MISSING",
        projectId: process.env.VITE_FIREBASE_PROJECT_ID ? "AVAILABLE" : "MISSING",
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ? "AVAILABLE" : "MISSING",
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? "AVAILABLE" : "MISSING",
        appId: process.env.VITE_FIREBASE_APP_ID ? "AVAILABLE" : "MISSING",
      };
      
      res.json({
        firebaseConfig: firebaseConfigStatus,
        timestamp: new Date().toISOString(),
        databaseUrlFormat: process.env.VITE_FIREBASE_DATABASE_URL ? 
          "Appears to be a " + (process.env.VITE_FIREBASE_DATABASE_URL.includes("firebaseio.com") ? "valid" : "suspicious") + " Firebase URL" : 
          "Missing database URL"
      });
    } catch (error) {
      console.error("Error in Firebase debug route:", error);
      res.status(500).json({ error: String(error) });
    }
  });
  
  // Special debug route to test matches for a specific team
  app.get("/api/debug/team-matches/:teamId", async (req, res) => {
    try {
      // Import necessary Firebase functions
      const { initializeApp, getApps } = await import('firebase/app');
      const { getDatabase, ref, get } = await import('firebase/database');
      
      // Get team ID from request params
      const teamId = req.params.teamId;
      
      if (!teamId) {
        return res.status(400).json({ error: "No team ID provided" });
      }
      
      // Initialize Firebase if not already initialized
      if (!getApps().length) {
        const firebaseConfig = {
          apiKey: process.env.VITE_FIREBASE_API_KEY,
          authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
          databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.VITE_FIREBASE_APP_ID,
        };
        
        initializeApp(firebaseConfig);
      }
      
      // Access the database
      const database = getDatabase();
      
      // Fetch all matches
      const matchesRef = ref(database, 'matches');
      const matchesSnapshot = await get(matchesRef);
      const allMatches = matchesSnapshot.val() || {};
      
      // Fetch all teams for reference (to display names)
      const teamsRef = ref(database, 'teams');
      const teamsSnapshot = await get(teamsRef);
      const allTeams = teamsSnapshot.val() || {};
      
      // Collect detailed match information for the requested team
      const matchSummary = {};
      const matchesAsTeamA = [];
      const matchesAsTeamB = [];
      const matchesAsTracker = [];
      
      // Loop through matches and categorize them
      Object.entries(allMatches).forEach(([matchId, matchData]) => {
        const match = matchData as any;
        const teamAName = allTeams[match.teamA]?.teamName || 'Unknown Team';
        const teamBName = allTeams[match.teamB]?.teamName || 'Unknown Team';
        const trackerTeamName = allTeams[match.trackerTeam]?.teamName || 'Unknown Team';
        
        // Create a match summary with readable info
        const matchInfo = {
          id: matchId,
          courtNumber: match.courtNumber,
          gameNumber: match.gameNumber,
          teamA: {
            id: match.teamA,
            name: teamAName
          },
          teamB: {
            id: match.teamB,
            name: teamBName
          },
          trackerTeam: {
            id: match.trackerTeam,
            name: trackerTeamName
          },
          startTime: match.startTime,
          score: `${match.scoreA}-${match.scoreB}`
        };
        
        // Add match to the appropriate category
        if (String(match.teamA) === String(teamId)) {
          matchesAsTeamA.push(matchInfo);
        }
        
        if (String(match.teamB) === String(teamId)) {
          matchesAsTeamB.push(matchInfo);
        }
        
        // Check for tracker team using both direct and looser comparison
        if (
          String(match.trackerTeam) === String(teamId) || 
          (match.trackerTeam && teamId && 
           (String(match.trackerTeam).includes(teamId) || 
            String(teamId).includes(match.trackerTeam)))
        ) {
          matchesAsTracker.push(matchInfo);
        }
      });
      
      // Check for any exact string matches in the raw data
      const exactStringMatches = Object.entries(allMatches)
        .filter(([_, match]) => String((match as any).trackerTeam) === String(teamId))
        .map(([id]) => id);
      
      // Compile results
      matchSummary['asTeamA'] = matchesAsTeamA;
      matchSummary['asTeamB'] = matchesAsTeamB;
      matchSummary['asTracker'] = matchesAsTracker;
      
      res.json({
        teamId,
        matchCounts: {
          asTeamA: matchesAsTeamA.length,
          asTeamB: matchesAsTeamB.length,
          asTracker: matchesAsTracker.length,
          total: Object.keys(allMatches).length
        },
        matches: matchSummary,
        teamInfo: allTeams[teamId] || null,
        exactMatches: exactStringMatches,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error in team matches debug route:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Players API
  app.get("/api/players", async (req, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Error fetching players", error });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid player ID" });
      }

      const player = await storage.getPlayer(id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Error fetching player", error });
    }
  });

  app.post("/api/players", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating player", error });
    }
  });

  // Teams API
  app.get("/api/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams", error });
    }
  });

  app.get("/api/teams/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team", error });
    }
  });

  app.post("/api/teams", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating team", error });
    }
  });

  // Team Players API
  app.get("/api/teams/:id/players", async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }

      const players = await storage.getTeamPlayers(teamId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team players", error });
    }
  });

  app.post("/api/team-players", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTeamPlayerSchema.parse(req.body);
      const teamPlayer = await storage.assignPlayerToTeam(validatedData);
      res.status(201).json(teamPlayer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team player data", errors: error.errors });
      }
      res.status(500).json({ message: "Error assigning player to team", error });
    }
  });

  // Matches API
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches", error });
    }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const match = await storage.getMatch(id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match", error });
    }
  });

  app.get("/api/courts/:number/matches", async (req, res) => {
    try {
      const courtNumber = parseInt(req.params.number);
      if (isNaN(courtNumber)) {
        return res.status(400).json({ message: "Invalid court number" });
      }

      const matches = await storage.getMatchesByCourtNumber(courtNumber);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching matches by court", error });
    }
  });

  app.post("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(validatedData);
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating match", error });
    }
  });

  app.patch("/api/matches/:id/score", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const { scoreA, scoreB } = req.body;
      if (typeof scoreA !== 'number' || typeof scoreB !== 'number') {
        return res.status(400).json({ message: "Invalid score data" });
      }

      const match = await storage.updateMatchScore(id, scoreA, scoreB);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Error updating match score", error });
    }
  });

  // Player Stats API
  app.get("/api/matches/:matchId/stats", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      if (isNaN(matchId)) {
        return res.status(400).json({ message: "Invalid match ID" });
      }

      const stats = await storage.getMatchStats(matchId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching match stats", error });
    }
  });

  app.get("/api/matches/:matchId/players/:playerId/stats", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const playerId = parseInt(req.params.playerId);
      
      if (isNaN(matchId) || isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      const stats = await storage.getPlayerStat(matchId, playerId);
      if (!stats) {
        return res.status(404).json({ message: "Stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching player stats", error });
    }
  });

  app.post("/api/player-stats", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPlayerStatSchema.parse(req.body);
      const stats = await storage.createPlayerStat(validatedData);
      res.status(201).json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stats data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating player stats", error });
    }
  });

  app.patch("/api/matches/:matchId/players/:playerId/stats", isAuthenticated, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const playerId = parseInt(req.params.playerId);
      
      if (isNaN(matchId) || isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid IDs" });
      }

      // Validate the update data
      const updates = req.body;
      if (typeof updates !== 'object' || updates === null) {
        return res.status(400).json({ message: "Invalid update data" });
      }

      const updatedStats = await storage.updatePlayerStat(matchId, playerId, updates);
      if (!updatedStats) {
        return res.status(404).json({ message: "Stats not found" });
      }
      
      res.json(updatedStats);
    } catch (error) {
      res.status(500).json({ message: "Error updating player stats", error });
    }
  });

  // Tracker Logs API
  app.post("/api/tracker-logs", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTrackerLogSchema.parse(req.body);
      const log = await storage.createTrackerLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid log data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating tracker log", error });
    }
  });

  app.get("/api/tracker-logs", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const teamName = req.query.teamName as string;
      const action = req.query.action as string;
      const search = req.query.search as string;

      let logs;
      if (search) {
        logs = await storage.searchTrackerLogs(search);
      } else if (teamName) {
        logs = await storage.getTrackerLogsByTeam(teamName);
      } else if (action) {
        logs = await storage.getTrackerLogsByAction(action);
      } else {
        logs = await storage.getTrackerLogs(limit, offset);
      }

      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching tracker logs", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
