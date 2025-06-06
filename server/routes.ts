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
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { hashPassword } from "./auth"; // Import hashPassword function

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
      const matchSummary: any = {};
      const matchesAsTeamA: any[] = [];
      const matchesAsTeamB: any[] = [];
      const matchesAsTracker: any[] = [];

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
      (matchSummary as any)['asTeamA'] = matchesAsTeamA;
      (matchSummary as any)['asTeamB'] = matchesAsTeamB;
      (matchSummary as any)['asTracker'] = matchesAsTracker;

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

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user;
    res.json({ id: user.id, username: user.username });
  });

  // API endpoint to update admin password
  app.post("/api/admin/update-password", isAuthenticated, async (req, res) => {
    try {
      const { username, newPassword } = req.body;

      if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update the user in the database
      const success = await storage.updateUserPassword(username, hashedPassword);

      if (success) {
        res.json({ message: "Password updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating admin password:", error);
      res.status(500).json({ message: "Internal server error" });
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

  // Feedback API routes

  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: async (req: any, file: any, cb: any) => {
      const uploadDir = path.join(process.cwd(), 'feedback', 'screenshots');
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req: any, file: any, cb: any) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      cb(null, `screenshot-${timestamp}${ext}`);
    }
  });

  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
      }
    }
  });

  // Submit feedback (public endpoint)
  app.post("/api/feedback", upload.single('screenshot'), async (req: any, res) => {
    try {
      const { type, message, email } = req.body;

      if (!type || !message) {
        return res.status(400).json({ message: "Type and message are required" });
      }

      const timestamp = new Date();
      const feedbackId = `feedback-${Date.now()}`;

      const feedbackData = {
        feedbackId,
        type,
        message,
        email: email || null,
        timestamp
      };

      // Save feedback to database
      const savedFeedback = await storage.createFeedback(feedbackData);

      res.status(201).json({ message: "Feedback submitted successfully", id: feedbackId });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ message: "Error submitting feedback" });
    }
  });

  // Serve screenshot files
  app.get("/api/feedback/screenshots/:filename", isAuthenticated, async (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), 'feedback', 'screenshots', filename);

      // Check if file exists
      try {
        await fs.access(filePath);
        res.sendFile(filePath);
      } catch (error) {
        res.status(404).json({ message: "Screenshot not found" });
      }
    } catch (error) {
      console.error('Error serving screenshot:', error);
      res.status(500).json({ message: "Error serving screenshot" });
    }
  });

  // Delete feedback (admin only)
  app.delete("/api/feedback/:feedbackId", isAuthenticated, async (req, res) => {
    try {
      const feedbackId = req.params.feedbackId;
      const success = await storage.deleteFeedback(feedbackId);

      if (!success) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      res.json({ message: "Feedback deleted successfully" });
    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({ message: "Error deleting feedback" });
    }
  });

  // Get all feedback (admin only)
  app.get("/api/feedback", isAuthenticated, async (req, res) => {
    try {
      const feedbackList = await storage.getFeedback();
      res.json(feedbackList);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({ message: "Error fetching feedback" });
    }
  });

  // Downtime Management API Routes

  // Get current downtime status
  // Optimized downtime endpoint with caching
  let downtimeApiCache: any = null;
  let downtimeApiCacheTime = 0;
  const DOWNTIME_API_CACHE_DURATION = 30000; // 30 seconds
  
  app.get("/api/downtime", async (req, res) => {
    try {
      const now = Date.now();
      
      // Use cached response if available and fresh
      if (downtimeApiCache && (now - downtimeApiCacheTime) < DOWNTIME_API_CACHE_DURATION) {
        res.set({
          'Cache-Control': 'public, max-age=30',
          'ETag': `"${downtimeApiCacheTime}"`,
          'Last-Modified': new Date(downtimeApiCacheTime).toUTCString()
        });
        return res.json(downtimeApiCache);
      }
      
      // Check if client has current version
      const clientETag = req.get('If-None-Match');
      if (clientETag === `"${downtimeApiCacheTime}"` && downtimeApiCache) {
        return res.status(304).end();
      }
      
      const downtimeData = await fs.readFile(path.join(process.cwd(), 'data', 'downtime.json'), 'utf8');
      const downtime = JSON.parse(downtimeData);
      
      // Update cache
      downtimeApiCache = downtime;
      downtimeApiCacheTime = now;
      
      res.set({
        'Cache-Control': 'public, max-age=30',
        'ETag': `"${downtimeApiCacheTime}"`,
        'Last-Modified': new Date(downtimeApiCacheTime).toUTCString()
      });
      
      res.json(downtime);
    } catch (error) {
      // If file doesn't exist, return default state
      const defaultDowntime = {
        active: false,
        start: null,
        end: null,
        message: ""
      };
      
      // Cache default response too
      downtimeApiCache = defaultDowntime;
      downtimeApiCacheTime = Date.now();
      
      res.set({
        'Cache-Control': 'public, max-age=30',
        'ETag': `"${downtimeApiCacheTime}"`,
        'Last-Modified': new Date(downtimeApiCacheTime).toUTCString()
      });
      
      res.json(defaultDowntime);
    }
  });

  // Schedule downtime
  app.post("/api/downtime/schedule", isAuthenticated, async (req, res) => {
    try {
      const { start, end, message } = req.body;

      if (!start || !end || !message) {
        return res.status(400).json({ message: "Start time, end time, and message are required" });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);
      const now = new Date();

      if (endDate <= startDate) {
        return res.status(400).json({ message: "End time must be after start time" });
      }

      const downtimeConfig = {
        active: now >= startDate, // Active if start time has passed
        start: start,
        end: end,
        message: message
      };

      await fs.writeFile(
        path.join(process.cwd(), 'data', 'downtime.json'),
        JSON.stringify(downtimeConfig, null, 2)
      );

      res.json({ message: "Downtime scheduled successfully", downtime: downtimeConfig });
    } catch (error) {
      console.error('Error scheduling downtime:', error);
      res.status(500).json({ message: "Error scheduling downtime" });
    }
  });

  // Start immediate downtime
  app.post("/api/downtime/start", isAuthenticated, async (req, res) => {
    try {
      const { message } = req.body;
      const defaultMessage = "The site is temporarily under maintenance. Please check back later.";

      const downtimeConfig = {
        active: true,
        start: new Date().toISOString(),
        end: null,
        message: message || defaultMessage
      };

      await fs.writeFile(
        path.join(process.cwd(), 'data', 'downtime.json'),
        JSON.stringify(downtimeConfig, null, 2)
      );

      res.json({ message: "Downtime started successfully", downtime: downtimeConfig });
    } catch (error) {
      console.error('Error starting downtime:', error);
      res.status(500).json({ message: "Error starting downtime" });
    }
  });

  // End downtime now
  app.post("/api/downtime/end", isAuthenticated, async (req, res) => {
    try {
      const downtimeConfig = {
        active: false,
        start: null,
        end: null,
        message: ""
      };

      await fs.writeFile(
        path.join(process.cwd(), 'data', 'downtime.json'),
        JSON.stringify(downtimeConfig, null, 2)
      );

      res.json({ message: "Downtime ended successfully", downtime: downtimeConfig });
    } catch (error) {
      console.error('Error ending downtime:', error);
      res.status(500).json({ message: "Error ending downtime" });
    }
  });

  // Admin override downtime (sets secure cookie for individual admin access only)
  app.post("/api/downtime/override", isAuthenticated, async (req, res) => {
    try {
      // Set secure cookie for this specific admin user only - does not affect other users
      const overrideToken = `admin_override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.cookie('adminDowntimeOverride', overrideToken, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      console.log('Setting admin override cookie:', overrideToken);
      res.json({ message: "Admin downtime override activated for this browser only" });
    } catch (error) {
      console.error('Error setting admin override:', error);
      res.status(500).json({ message: "Error setting admin override" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}