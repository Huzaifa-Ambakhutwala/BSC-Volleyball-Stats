import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, push, onValue, off, remove, child } from "firebase/database";
import type { Player, Team, Match, PlayerStats, MatchStats } from "@shared/schema";

// Type definition for StatLog with explicit ID field
export type StatLog = {
  id: string;
  matchId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  statName: keyof PlayerStats;
  value: number;
  timestamp: number;
  category: 'earned' | 'fault' | 'neutral';
  set?: number; // Which set the stat belongs to
};

// Firebase configuration from environment variables
// Use temp-project as a placeholder to ensure URL format is correct
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "temp-project";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${projectId}.firebaseio.com`,
  projectId: projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Export Firebase functions and database for direct use
export { ref, get, set, update, push, remove, onValue, off };
export { database };

// Players API
export const addPlayer = async (name: string, jerseyNumber?: number, jerseyName?: string) => {
  const playersRef = ref(database, 'players');
  const newPlayerRef = push(playersRef);
  await set(newPlayerRef, { 
    name,
    jerseyNumber: jerseyNumber || 0,
    jerseyName: jerseyName || ''
  });
  return newPlayerRef.key;
};

export const getPlayers = async (): Promise<Record<string, Player>> => {
  const playersRef = ref(database, 'players');
  const snapshot = await get(playersRef);
  return snapshot.val() || {};
};

export const listenToPlayers = (callback: (players: Record<string, Player>) => void) => {
  const playersRef = ref(database, 'players');
  console.log('Setting up players listener');

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(playersRef, (snapshot) => {
    const data = snapshot.val() || {};
    console.log('Players data received:', data);
    callback(data);
  }, (error) => {
    console.error('Error in players listener:', error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log('Removing players listener');
    unsubscribe();
  };
};

export const updatePlayer = async (playerId: string, name: string, jerseyNumber?: number, jerseyName?: string) => {
  try {
    console.log(`Updating player with ID: ${playerId}, name: ${name}, jersey: ${jerseyNumber}, jerseyName: ${jerseyName}`);
    const playerRef = ref(database, `players/${playerId}`);
    
    const updates: any = { name };
    
    if (jerseyNumber !== undefined) {
      updates.jerseyNumber = jerseyNumber;
    }
    
    if (jerseyName !== undefined) {
      updates.jerseyName = jerseyName;
    }
    
    await update(playerRef, updates);
    console.log('Player update completed successfully');
    return true;
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

export const deletePlayer = async (playerId: string) => {
  try {
    console.log(`Deleting player with ID: ${playerId}`);
    const playerRef = ref(database, `players/${playerId}`);
    await remove(playerRef);
    console.log('Player deletion completed successfully');
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

// Teams API
export const createTeam = async (teamName: string, playerIds: string[], teamColor?: string) => {
  const teamsRef = ref(database, 'teams');
  const newTeamRef = push(teamsRef);
  await set(newTeamRef, { teamName, players: playerIds, teamColor });
  return newTeamRef.key;
};

export const getTeams = async (): Promise<Record<string, Team>> => {
  const teamsRef = ref(database, 'teams');
  const snapshot = await get(teamsRef);
  return snapshot.val() || {};
};

export const listenToTeams = (callback: (teams: Record<string, Team>) => void) => {
  const teamsRef = ref(database, 'teams');
  console.log('Setting up teams listener');

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(teamsRef, (snapshot) => {
    const data = snapshot.val() || {};
    console.log('Teams data received:', data);
    callback(data);
  }, (error) => {
    console.error('Error in teams listener:', error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log('Removing teams listener');
    unsubscribe();
  };
};

export const getTeamById = async (teamId: string): Promise<Team | null> => {
  if (!teamId) {
    console.log("getTeamById called with empty/null teamId");
    return null;
  }

  const teamRef = ref(database, `teams/${teamId}`);
  const snapshot = await get(teamRef);
  const team = snapshot.val();

  if (!team) {
    console.log(`Team with ID '${teamId}' not found in database`);
    return null;
  }

  console.log(`Found team for ID '${teamId}':`, team);
  return team;
};

export const updateTeam = async (teamId: string, teamName: string, playerIds: string[], teamColor?: string) => {
  try {
    console.log(`Updating team with ID: ${teamId}, name: ${teamName}, players:`, playerIds);
    const teamRef = ref(database, `teams/${teamId}`);
    await update(teamRef, { teamName, players: playerIds, ...(teamColor && { teamColor }) });
    console.log('Team update completed successfully');
    return true;
  } catch (error) {
    console.error('Error updating team:', error);
    throw error;
  }
};

export const deleteTeam = async (teamId: string) => {
  try {
    console.log(`Deleting team with ID: ${teamId}`);
    const teamRef = ref(database, `teams/${teamId}`);
    await remove(teamRef);
    console.log('Team deletion completed successfully');
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

// Matches API
export const createMatch = async (match: Omit<Match, "id" | "scoreA" | "scoreB">) => {
  const matchesRef = ref(database, 'matches');
  const newMatchRef = push(matchesRef);
  await set(newMatchRef, {
    ...match,
    scoreA: 0,
    scoreB: 0,
    gameNumber: match.gameNumber || 0
  });
  return newMatchRef.key;
};

export const getMatches = async (): Promise<Record<string, Match>> => {
  const matchesRef = ref(database, 'matches');
  const snapshot = await get(matchesRef);
  return snapshot.val() || {};
};

export const listenToMatches = (callback: (matches: Record<string, Match>) => void) => {
  const matchesRef = ref(database, 'matches');
  console.log('Setting up matches listener');

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    const data = snapshot.val() || {};
    console.log('Matches data received:', data);
    callback(data);
  }, (error) => {
    console.error('Error in matches listener:', error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log('Removing matches listener');
    unsubscribe();
  };
};

export const getMatchById = async (matchId: string): Promise<Match | null> => {
  const matchRef = ref(database, `matches/${matchId}`);
  const snapshot = await get(matchRef);
  return snapshot.val();
};

export const listenToMatchById = (matchId: string, callback: (match: Match | null) => void) => {
  const matchRef = ref(database, `matches/${matchId}`);
  console.log(`Setting up match listener for ID: ${matchId}`);

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(matchRef, (snapshot) => {
    const data = snapshot.val();
    console.log(`Match data received for ID ${matchId}:`, data);
    callback(data);
  }, (error) => {
    console.error(`Error in match listener for ID ${matchId}:`, error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log(`Removing match listener for ID: ${matchId}`);
    unsubscribe();
  };
};

export const updateMatchScore = async (matchId: string, scoreA: number, scoreB: number, setNumber: number = 1) => {
  const matchRef = ref(database, `matches/${matchId}`);
  const matchSnapshot = await get(matchRef);
  const match = matchSnapshot.val() as Match;

  // If match doesn't exist, just update the main scores
  if (!match) {
    await update(matchRef, { scoreA, scoreB });
    return;
  }

  // Initialize setScores if it doesn't exist
  const setScores = match.setScores || {
    set1: { scoreA: 0, scoreB: 0 },
    set2: { scoreA: 0, scoreB: 0 },
    set3: { scoreA: 0, scoreB: 0 }
  };

  // Update the specific set's score
  if (setNumber === 1) {
    setScores.set1 = { scoreA, scoreB };
  } else if (setNumber === 2) {
    setScores.set2 = { scoreA, scoreB };
  } else if (setNumber === 3) {
    setScores.set3 = { scoreA, scoreB };
  }

  // Update both the main score and the set-specific scores
  await update(matchRef, {
    scoreA,
    scoreB,
    setScores,
    currentSet: setNumber // Always update the current set
  });
};

export const updateMatch = async (
  matchId: string,
  updates: {
    gameNumber?: number;
    courtNumber?: number;
    teamA?: string;
    teamB?: string;
    trackerTeam?: string;
    startTime?: string;
    scoreA?: number;
    scoreB?: number;
  }
) => {
  try {
    console.log(`Updating match with ID: ${matchId}, updates:`, updates);
    const matchRef = ref(database, `matches/${matchId}`);
    await update(matchRef, updates);
    console.log('Match update completed successfully');
    return true;
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
};

export const deleteMatch = async (matchId: string) => {
  try {
    console.log(`Deleting match with ID: ${matchId}`);
    // Delete match from matches collection
    const matchRef = ref(database, `matches/${matchId}`);
    await remove(matchRef);

    // Delete associated stats if they exist
    console.log(`Deleting match stats for match ID: ${matchId}`);
    const statsRef = ref(database, `stats/${matchId}`);
    await remove(statsRef);

    console.log('Match deletion completed successfully');
    return true;
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};

export const getMatchesByCourtNumber = async (courtNumber: number): Promise<Record<string, Match>> => {
  const matchesRef = ref(database, 'matches');
  const snapshot = await get(matchesRef);
  const matches = snapshot.val() || {};

  // Filter matches by court number
  const filteredMatches: Record<string, Match> = {};
  Object.entries(matches).forEach(([key, match]) => {
    if ((match as Match).courtNumber === courtNumber) {
      filteredMatches[key] = match as Match;
    }
  });

  return filteredMatches;
};

export const listenToMatchesByCourtNumber = (courtNumber: number, callback: (matches: Record<string, Match>) => void) => {
  const matchesRef = ref(database, 'matches');
  console.log(`Setting up matches by court ${courtNumber} listener`);

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    const matches = snapshot.val() || {};

    // Filter matches by court number
    const filteredMatches: Record<string, Match> = {};
    Object.entries(matches).forEach(([key, match]) => {
      if ((match as Match).courtNumber === courtNumber) {
        filteredMatches[key] = match as Match;
      }
    });

    console.log(`Matches for court ${courtNumber} received:`, filteredMatches);
    callback(filteredMatches);
  }, (error) => {
    console.error(`Error in matches by court ${courtNumber} listener:`, error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log(`Removing matches by court ${courtNumber} listener`);
    unsubscribe();
  };
};

// Stats API
export const initializeMatchStats = async (matchId: string) => {
  const statsRef = ref(database, `stats/${matchId}`);
  await set(statsRef, {});
};

// Type definition for TrackerUser

export type TrackerUser = {
  teamId: string;
  teamName: string;
  isAuthenticated: boolean;
}

// Team password management
export const setTeamPassword = async (teamId: string, password: string): Promise<boolean> => {
  try {
    const teamPasswordRef = ref(database, `teamPasswords/${teamId}`);
    await set(teamPasswordRef, password);
    return true;
  } catch (error) {
    console.error('Error setting team password:', error);
    return false;
  }
};

export const getTeamPassword = async (teamId: string): Promise<string | null> => {
  try {
    const teamPasswordRef = ref(database, `teamPasswords/${teamId}`);
    const snapshot = await get(teamPasswordRef);
    return snapshot.val();
  } catch (error) {
    console.error('Error getting team password:', error);
    return null;
  }
};

// Authentication for stat trackers
export const loginStatTracker = async (teamId: string, password: string): Promise<TrackerUser | null> => {
  try {
    console.log(`Attempting to login with team ID: ${teamId}`);

    // Get team info
    const teamRef = ref(database, `teams/${teamId}`);
    const teamSnapshot = await get(teamRef);
    const team = teamSnapshot.val();

    if (!team) {
      console.error(`Team not found with ID: ${teamId}`);
      return null;
    }

    console.log(`Team found: ${team.teamName}`);

    // Verify password
    const teamPasswordRef = ref(database, `teamPasswords/${teamId}`);
    const passwordSnapshot = await get(teamPasswordRef);
    const storedPassword = passwordSnapshot.val();

    console.log(`Password check - Stored password exists: ${!!storedPassword}`);

    // If no password is set yet, set it
    if (!storedPassword) {
      console.log(`Setting new password for team: ${teamId}`);
      await set(teamPasswordRef, password);
    } else if (password !== storedPassword) {
      console.error('Incorrect password provided');
      return null;
    }

    const trackerUser: TrackerUser = {
      teamId,
      teamName: team.teamName,
      isAuthenticated: true
    };

    console.log(`Login successful, storing user in localStorage:`, trackerUser);

    // Store tracker session in localStorage
    localStorage.setItem('trackerUser', JSON.stringify(trackerUser));
    return trackerUser;
  } catch (error) {
    console.error('Error logging in stat tracker:', error);
    return null;
  }
};

export const getTrackerUser = (): TrackerUser | null => {
  const userJson = localStorage.getItem('trackerUser');
  if (!userJson) return null;

  const user = JSON.parse(userJson);
  // Ensure the user object has all required properties
  if (!user.isAuthenticated) {
    user.isAuthenticated = true; // Add missing property for backward compatibility
  }
  return user;
};

export const logoutStatTracker = (): void => {
  localStorage.removeItem('trackerUser');
};

export const getMatchesForTracker = async (teamId: string): Promise<Record<string, Match>> => {
  if (!teamId) {
    console.error('Invalid teamId provided to getMatchesForTracker');
    return {};
  }

  console.log(`[getMatchesForTracker] Getting matches for tracker team ${teamId}`);
  const matchesRef = ref(database, 'matches');
  const snapshot = await get(matchesRef);
  const matches = snapshot.val() || {};

  console.log(`[getMatchesForTracker] All matches:`, Object.keys(matches).length);

  // Filter matches where this team is assigned as the tracker
  const filteredMatches: Record<string, Match> = {};

  for (const [matchId, matchData] of Object.entries(matches)) {
    const match = matchData as Match;

    // Check if trackerTeam is null/undefined and log it
    if (!match.trackerTeam) {
      console.log(`[getMatchesForTracker] Match ${matchId} has no trackerTeam assigned`);
      continue;
    }

    console.log(`[getMatchesForTracker] Checking match ${matchId}:`);
    console.log(`[getMatchesForTracker] - trackerTeam: "${match.trackerTeam}" (${typeof match.trackerTeam})`);
    console.log(`[getMatchesForTracker] - current teamId: "${teamId}" (${typeof teamId})`);

    // IMPORTANT FIX: Create normalized strings for comparison
    // Sometimes Firebase data can have whitespace or be stored as numbers
    const trackerTeamId = String(match.trackerTeam || '').trim();
    const currentTeamId = String(teamId || '').trim();

    // Check for exact match first
    if (trackerTeamId === currentTeamId) {
      console.log(`[getMatchesForTracker] EXACT MATCH FOUND! Match ${matchId} is assigned to team ${teamId} for tracking`);
      filteredMatches[matchId] = match;
      continue;
    }

    // Try various matching techniques as fallback
    // This handles cases where the IDs might be slightly different formats
    if (trackerTeamId.includes(currentTeamId) || currentTeamId.includes(trackerTeamId)) {
      console.log(`[getMatchesForTracker] PARTIAL MATCH FOUND! Match ${matchId} is assigned to team ${match.trackerTeam}`);
      filteredMatches[matchId] = match;
      continue;
    }

    // Last resort - check if the IDs have the same base value
    const numericTeamId = parseInt(currentTeamId, 10);
    const numericTrackerTeamId = parseInt(trackerTeamId, 10);

    if (!isNaN(numericTeamId) && !isNaN(numericTrackerTeamId) && numericTeamId === numericTrackerTeamId) {
      console.log(`[getMatchesForTracker] NUMERIC MATCH FOUND! Match ${matchId} is assigned to team ${teamId} for tracking`);
      filteredMatches[matchId] = match;
    }
  }

  const matchCount = Object.keys(filteredMatches).length;
  console.log(`[getMatchesForTracker] Found ${matchCount} matches for team ${teamId}`);

  if (matchCount === 0) {
    console.log(`[getMatchesForTracker] WARNING: No matches found for team ${teamId}`,);
    console.log(`[getMatchesForTracker] This might be a data issue - make sure the match has been properly assigned to this team`);
  }

  return filteredMatches;
};

export const listenToMatchesForTracker = (teamId: string, callback: (matches: Record<string, Match>) => void) => {
  if (!teamId) {
    console.error('[listenToMatchesForTracker] Invalid teamId provided:', teamId);
    callback({});
    return () => { };
  }

  const matchesRef = ref(database, 'matches');
  console.log(`[listenToMatchesForTracker] Setting up listener for team ${teamId}`);

  // First, use getMatchesForTracker to get matches immediately
  getMatchesForTracker(teamId).then(initialMatches => {
    if (Object.keys(initialMatches).length > 0) {
      console.log(`[listenToMatchesForTracker] Initial check found ${Object.keys(initialMatches).length} matches`);
      callback(initialMatches);
    } else {
      console.log(`[listenToMatchesForTracker] Initial check found no matches`);
    }
  });

  // Set up the real-time listener with comprehensive matching logic
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    const allMatches = snapshot.val() || {};
    console.log(`[listenToMatchesForTracker] Real-time update received with ${Object.keys(allMatches).length} total matches`);

    // Filter matches for this tracker team
    const filteredMatches: Record<string, Match> = {};

    // Comprehensive matching with all techniques
    for (const [matchId, matchData] of Object.entries(allMatches)) {
      const match = matchData as Match;

      // Skip if no trackerTeam is set
      if (!match.trackerTeam) {
        continue;
      }

      // Create normalized strings for comparison
      const trackerTeamId = String(match.trackerTeam || '').trim();
      const currentTeamId = String(teamId || '').trim();

      // 1. Try exact match first (most reliable)
      if (trackerTeamId === currentTeamId) {
        console.log(`[listenToMatchesForTracker] EXACT MATCH: ${matchId}`);
        filteredMatches[matchId] = match;
        continue;
      }

      // 2. Check for substring inclusion (less reliable but helpful)
      if (trackerTeamId.includes(currentTeamId) || currentTeamId.includes(trackerTeamId)) {
        console.log(`[listenToMatchesForTracker] SUBSTRING MATCH: ${matchId}`);
        filteredMatches[matchId] = match;
        continue;
      }

      // 3. Check for numeric equivalence (for number-based IDs)
      const numericTeamId = parseInt(currentTeamId, 10);
      const numericTrackerTeamId = parseInt(trackerTeamId, 10);

      if (!isNaN(numericTeamId) && !isNaN(numericTrackerTeamId) && numericTeamId === numericTrackerTeamId) {
        console.log(`[listenToMatchesForTracker] NUMERIC MATCH: ${matchId}`);
        filteredMatches[matchId] = match;
      }
    }

    const matchCount = Object.keys(filteredMatches).length;
    console.log(`[listenToMatchesForTracker] Found ${matchCount} matches for team ${teamId}`);

    // Always callback even with empty object, so UI can update accordingly
    callback(filteredMatches);

    // Log warning if no matches found
    if (matchCount === 0) {
      console.warn(`[listenToMatchesForTracker] No matches found for team ${teamId}. Check that matches have this team set as tracker.`);
    }
  }, (error) => {
    console.error(`[listenToMatchesForTracker] Error in listener for team ${teamId}:`, error);
  });

  return () => {
    console.log(`[listenToMatchesForTracker] Removing listener for team ${teamId}`);
    unsubscribe();
  };
};

export const updatePlayerStat = async (
  matchId: string,
  playerId: string,
  statName: keyof PlayerStats,
  value: number,
  category: 'earned' | 'fault' | 'neutral' = 'earned',
  setNumber: number = 1
) => {
  console.log(`[UPDATE_STAT] Starting stat update for match ${matchId}, player ${playerId}, stat ${statName}`);

  // Get player and team info for the log
  const playerRef = ref(database, `players/${playerId}`);
  const playerSnapshot = await get(playerRef);
  const player = playerSnapshot.val();

  if (!player) {
    console.error(`[UPDATE_STAT] CRITICAL ERROR: Player with ID ${playerId} not found`);
    throw new Error(`Player with ID ${playerId} not found`);
  }

  console.log(`[UPDATE_STAT] Found player:`, player);

  // Update player stats in Firebase
  const playerStatsRef = ref(database, `stats/${matchId}/${playerId}`);
  const statsSnapshot = await get(playerStatsRef);
  const currentStats = statsSnapshot.val() || createEmptyPlayerStats(setNumber);

  console.log(`[UPDATE_STAT] Current stats for player:`, currentStats);

  // Calculate new stat value
  const newStatValue = (currentStats[statName] || 0) + value;
  console.log(`[UPDATE_STAT] Updating ${statName} from ${currentStats[statName] || 0} to ${newStatValue}`);

  // Always ensure set number is included
  await update(playerStatsRef, {
    [statName]: newStatValue,
    set: setNumber // Store the set number with the stats
  });

  // Find which team this player belongs to and update score
  const matchRef = ref(database, `matches/${matchId}`);
  const matchSnapshot = await get(matchRef);
  const match = matchSnapshot.val() as Match;

  if (!match) {
    console.error(`[UPDATE_STAT] CRITICAL ERROR: Match with ID ${matchId} not found`);
    throw new Error(`Match with ID ${matchId} not found`);
  }

  console.log(`[UPDATE_STAT] Found match:`, match);

  // Determine player's team
  let playerTeamId = '';
  let playerTeamName = '';
  let isTeamA = false;

  // Check team A players
  const teamARef = ref(database, `teams/${match.teamA}`);
  const teamASnapshot = await get(teamARef);
  const teamA = teamASnapshot.val();

  console.log(`[UPDATE_STAT] Team A:`, teamA);

  if (teamA && teamA.players && teamA.players.includes(playerId)) {
    playerTeamId = match.teamA;
    playerTeamName = teamA.teamName;
    isTeamA = true;
    console.log(`[UPDATE_STAT] Player belongs to Team A (${teamA.teamName})`);
  } else {
    // Check team B players
    const teamBRef = ref(database, `teams/${match.teamB}`);
    const teamBSnapshot = await get(teamBRef);
    const teamB = teamBSnapshot.val();

    console.log(`[UPDATE_STAT] Team B:`, teamB);

    if (teamB && teamB.players && teamB.players.includes(playerId)) {
      playerTeamId = match.teamB;
      playerTeamName = teamB.teamName;
      isTeamA = false;
      console.log(`[UPDATE_STAT] Player belongs to Team B (${teamB.teamName})`);
    } else {
      console.warn(`[UPDATE_STAT] CRITICAL WARNING: Player ${playerId} not found in either team for match ${matchId}`);
    }
  }

  // Get current set scores
  const currentSetNumber = match.currentSet || setNumber;
  let currentSetScoreA = match.scoreA;
  let currentSetScoreB = match.scoreB;

  // Get current set-specific scores if available
  if (match.setScores) {
    const setKey = `set${currentSetNumber}` as keyof typeof match.setScores;
    const setScore = match.setScores[setKey];
    if (setScore) {
      currentSetScoreA = setScore.scoreA;
      currentSetScoreB = setScore.scoreB;
    }
  }

  // Update score based on the stat category and team
  if (category === 'earned' && isTeamA) {
    // Team A earned a point
    await updateMatchScore(matchId, currentSetScoreA + 1, currentSetScoreB, currentSetNumber);
    console.log(`[UPDATE_STAT] Team A earned a point, set ${currentSetNumber} score updated to ${currentSetScoreA + 1}-${currentSetScoreB}`);
  } else if (category === 'earned' && !isTeamA) {
    // Team B earned a point
    await updateMatchScore(matchId, currentSetScoreA, currentSetScoreB + 1, currentSetNumber);
    console.log(`[UPDATE_STAT] Team B earned a point, set ${currentSetNumber} score updated to ${currentSetScoreA}-${currentSetScoreB + 1}`);
  } else if (category === 'fault' && isTeamA) {
    // Team A fault gives point to Team B
    await updateMatchScore(matchId, currentSetScoreA, currentSetScoreB + 1, currentSetNumber);
    console.log(`[UPDATE_STAT] Team A fault, point to Team B, set ${currentSetNumber} score updated to ${currentSetScoreA}-${currentSetScoreB + 1}`);
  } else if (category === 'fault' && !isTeamA) {
    // Team B fault gives point to Team A
    await updateMatchScore(matchId, currentSetScoreA + 1, currentSetScoreB, currentSetNumber);
    console.log(`[UPDATE_STAT] Team B fault, point to Team A, set ${currentSetNumber} score updated to ${currentSetScoreA + 1}-${currentSetScoreB}`);
  } else if (category === 'neutral') {
    // Neutral actions don't affect the score
    console.log(`[UPDATE_STAT] Neutral action recorded, no score change`);
  }

  // Create and save the stat log
  const statLogsRef = ref(database, `statLogs/${matchId}`);
  const newLogRef = push(statLogsRef);
  const logId = newLogRef.key || '';

  const log: StatLog = {
    id: logId,
    matchId,
    playerId,
    playerName: player.name,
    teamId: playerTeamId,
    teamName: playerTeamName,
    statName,
    value,
    timestamp: Date.now(),
    category,
    set: setNumber // Include the set number in the log
  };

  console.log(`[UPDATE_STAT] Creating log entry:`, log);

  try {
    await set(newLogRef, log);
    console.log(`[UPDATE_STAT] Successfully created log with ID ${logId}`);

    // Verify the log was saved
    const verifyLogRef = ref(database, `statLogs/${matchId}/${logId}`);
    const verifySnapshot = await get(verifyLogRef);

    if (verifySnapshot.exists()) {
      console.log(`[UPDATE_STAT] Verified log exists in Firebase`);
    } else {
      console.error(`[UPDATE_STAT] CRITICAL ERROR: Log verification failed, log not found`);
    }

    return log;
  } catch (error) {
    console.error(`[UPDATE_STAT] Error saving log:`, error);
    throw error;
  }
};

export const getPlayerStats = async (matchId: string, playerId: string): Promise<PlayerStats> => {
  const playerStatsRef = ref(database, `stats/${matchId}/${playerId}`);
  const snapshot = await get(playerStatsRef);
  return snapshot.val() || createEmptyPlayerStats();
};

export const getMatchStats = async (matchId: string): Promise<MatchStats> => {
  const matchStatsRef = ref(database, `stats/${matchId}`);
  const snapshot = await get(matchStatsRef);
  return snapshot.val() || {};
};

export const listenToPlayerStats = (
  matchId: string,
  playerId: string,
  callback: (stats: PlayerStats) => void
) => {
  const playerStatsRef = ref(database, `stats/${matchId}/${playerId}`);
  console.log(`Setting up player stats listener for match ID: ${matchId}, player ID: ${playerId}`);

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(playerStatsRef, (snapshot) => {
    const data = snapshot.val() || createEmptyPlayerStats();
    console.log(`Player stats received for match ID: ${matchId}, player ID: ${playerId}:`, data);
    callback(data);
  }, (error) => {
    console.error(`Error in player stats listener for match ID: ${matchId}, player ID: ${playerId}:`, error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log(`Removing player stats listener for match ID: ${matchId}, player ID: ${playerId}`);
    unsubscribe();
  };
};

export const listenToMatchStats = (
  matchId: string,
  callback: (stats: MatchStats) => void
) => {
  const matchStatsRef = ref(database, `stats/${matchId}`);
  console.log(`Setting up match stats listener for match ID: ${matchId}`);

  // Use the returned unsubscribe function from onValue for proper cleanup
  const unsubscribe = onValue(matchStatsRef, (snapshot) => {
    const data = snapshot.val() || {};
    console.log(`Match stats received for match ID: ${matchId}:`, data);

    // Enhanced debug information
    if (Object.keys(data).length === 0) {
      console.log(`[IMPORTANT] No stats data found for match ID: ${matchId}`);
      console.log(`Looking up all player stats manually for this match...`);

      // Attempt to do separate player stat lookups
      const playerStatsRef = ref(database);
      get(child(playerStatsRef, `stats/${matchId}`)).then((statsSnapshot) => {
        if (statsSnapshot.exists()) {
          const allStats = statsSnapshot.val();
          console.log(`[DATA CHECK] Direct query found stats:`, allStats);
        } else {
          console.log(`[DATA CHECK] No stats found with direct query either. Path checked: stats/${matchId}`);
        }
      }).catch((error) => {
        console.error(`[ERROR] Error checking stats path:`, error);
      });
    } else {
      console.log(`[SUCCESS] Found ${Object.keys(data).length} player stats for match ID: ${matchId}`);
    }

    callback(data);
  }, (error) => {
    console.error(`Error in match stats listener for match ID: ${matchId}:`, error);
  });

  // Return function that calls the unsubscribe function
  return () => {
    console.log(`Removing match stats listener for match ID: ${matchId}`);
    unsubscribe();
  };
};

// Helper function to get stat logs with proper ID handling
export const getStatLogs = async (matchId: string): Promise<StatLog[]> => {
  const logsRef = ref(database, `statLogs/${matchId}`);
  const snapshot = await get(logsRef);
  const logs = snapshot.val() || {};

  // Convert to array with IDs and sort by timestamp (newest first)
  return Object.entries(logs)
    .map(([logId, logData]) => ({
      ...(logData as StatLog),
      id: logId
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
};

export const listenToStatLogs = (matchId: string, callback: (logs: StatLog[]) => void) => {
  const logsRef = ref(database, `statLogs/${matchId}`);
  console.log(`[STAT_LOGS] Setting up stat logs listener for match ID: ${matchId}`);

  // First, do a direct check to see if logs exist for this match
  get(logsRef).then(directSnapshot => {
    const directLogs = directSnapshot.val();
    if (!directLogs) {
      console.warn(`[STAT_LOGS] WARNING: Direct check found NO logs for match ${matchId}`);
    } else {
      console.log(`[STAT_LOGS] Direct check found ${Object.keys(directLogs).length} logs for match ${matchId}`);
    }
  }).catch(error => {
    console.error(`[STAT_LOGS] Error during direct check:`, error);
  });

  const unsubscribe = onValue(logsRef, (snapshot) => {
    const logs = snapshot.val() || {};

    // Log the raw data for debugging
    console.log(`[STAT_LOGS] Raw logs data for match ID: ${matchId}:`, logs);

    // Convert to array and sort by timestamp (newest first)
    const logArray = Object.entries(logs)
      .map(([logId, logData]) => ({
        ...(logData as StatLog),
        id: logId
      }))
      .sort((a, b) => b.timestamp - a.timestamp);

    console.log(`[STAT_LOGS] Processed ${logArray.length} stat logs for match ID: ${matchId}`);

    // Debug individual logs if available
    if (logArray.length > 0) {
      console.log(`[STAT_LOGS] First log:`, logArray[0]);

      // Check for any potential issues with the log entries
      logArray.forEach((log, index) => {
        if (!log.playerId || !log.statName || log.value === undefined) {
          console.warn(`[STAT_LOGS] Malformed log at index ${index}:`, log);
        }
      });
    }

    callback(logArray);
  }, (error) => {
    console.error(`[STAT_LOGS] Error in listener for match ID: ${matchId}:`, error);
  });

  return () => {
    console.log(`[STAT_LOGS] Removing stat logs listener for match ID: ${matchId}`);
    unsubscribe();
  };
};

export const deleteStatLog = async (matchId: string, logId: string): Promise<boolean> => {
  try {
    // Get all logs first to check if this is the most recent
    const logsRef = ref(database, `statLogs/${matchId}`);
    const logsSnapshot = await get(logsRef);
    const logs = logsSnapshot.val() || {};

    // Convert logs to an array and sort by timestamp (newest first)
    const sortedLogs = Object.entries(logs)
      .map(([logId, logData]) => {
        // Create a new object with log data
        const logWithId = { ...(logData as StatLog) };
        // Add the id property separately
        logWithId.id = logId;
        return logWithId;
      })
      .sort((a, b) => b.timestamp - a.timestamp);

    // Check if the requested log is the most recent one
    if (sortedLogs.length === 0 || sortedLogs[0].id !== logId) {
      console.error('Cannot delete log: not the most recent one. Only the most recent log can be deleted.');
      return false;
    }

    // Get the log to delete
    const logRef = ref(database, `statLogs/${matchId}/${logId}`);
    const snapshot = await get(logRef);
    const log = snapshot.val() as StatLog;

    if (log) {
      // Get current player stats
      const playerStatsRef = ref(database, `stats/${matchId}/${log.playerId}`);
      const statsSnapshot = await get(playerStatsRef);
      const currentStats = statsSnapshot.val() || createEmptyPlayerStats();

      // Decrement the stat
      await update(playerStatsRef, {
        [log.statName]: Math.max(0, (currentStats[log.statName] || 0) - log.value)
      });

      // Get current match for score adjustment
      const matchRef = ref(database, `matches/${matchId}`);
      const matchSnapshot = await get(matchRef);
      const match = matchSnapshot.val() as Match;

      // Determine if player is on Team A or Team B
      const isTeamA = log.teamId === match.teamA;

      // Adjust score based on the original action
      if (log.category === 'earned' && isTeamA) {
        // Undo Team A earned point
        await updateMatchScore(matchId, Math.max(0, match.scoreA - 1), match.scoreB);
      } else if (log.category === 'earned' && !isTeamA) {
        // Undo Team B earned point
        await updateMatchScore(matchId, match.scoreA, Math.max(0, match.scoreB - 1));
      } else if (log.category === 'fault' && isTeamA) {
        // Undo Team A fault (point for Team B)
        await updateMatchScore(matchId, match.scoreA, Math.max(0, match.scoreB - 1));
      } else if (log.category === 'fault' && !isTeamA) {
        // Undo Team B fault (point for Team A)
        await updateMatchScore(matchId, Math.max(0, match.scoreA - 1), match.scoreB);
      }

      // Delete the log
      await remove(logRef);
      console.log(`Successfully deleted the most recent stat log: ${logId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting stat log:', error);
    return false;
  }
};

export const createEmptyPlayerStats = (setNumber: number = 1): PlayerStats => ({
  // Earned points
  aces: 0,
  spikes: 0,
  blocks: 0,
  tips: 0,
  dumps: 0,
  digs: 0,
  points: 0,

  // Faults
  serveErrors: 0,
  spikeErrors: 0,
  netTouches: 0,
  footFaults: 0,
  reaches: 0,
  carries: 0,
  outOfBounds: 0,
  faults: 0,

  // Set information
  set: setNumber,

  // Block tracking
  neutralBlocks: 0
});

// Admin user type
export type AdminUser = {
  username: string;
  password: string;
};

// Authentication
// Function to advance to the next set
export const advanceToNextSet = async (matchId: string, currentSet: number): Promise<number> => {
  // Validate current set
  if (currentSet < 1 || currentSet > 2) {
    console.error(`[ADVANCE_SET] Invalid current set: ${currentSet}`);
    return 0; // Return 0 if invalid
  }

  const nextSet = currentSet + 1;
  console.log(`[ADVANCE_SET] Advancing from set ${currentSet} to set ${nextSet}`);

  // Fetch current match to get completedSets
  const matchRef = ref(database, `matches/${matchId}`);
  let match: any = null;
  try {
    const matchSnapshot = await get(matchRef);
    match = matchSnapshot.val();
  } catch (error) {
    console.error(`[ADVANCE_SET] Failed to fetch match for updating completedSets:`, error);
    return 0;
  }

  const setKey = `set${currentSet}`;
  const completedSets = { ...(match?.completedSets || {}), [setKey]: true };

  const updates: any = {
    currentSet: nextSet,
    completedSets
  };

  try {
    await update(matchRef, updates);
    console.log(`[ADVANCE_SET] Successfully advanced to set ${nextSet} for match ${matchId}`);
    return nextSet;
  } catch (error) {
    console.error(`[ADVANCE_SET] Failed to advance to set ${nextSet} for match ${matchId}:`, error);
    return 0;
  }
};

// New function to check if a set is locked/finalized
export const isSetLocked = (match: Match, setNumber: number): boolean => {
  if (!match) return false;

  // Check if the set is marked as completed
  if (match.completedSets) {
    // Type-safe way to access the set
    const setKey = `set${setNumber}` as keyof typeof match.completedSets;
    if (match.completedSets[setKey]) {
      return true;
    }
  }

  // When a match has advanced to a later set, all previous sets are considered locked
  if (match.currentSet && match.currentSet > setNumber) {
    return true;
  }

  return false;
};

// Function to finalize an entire match
export const finalizeMatch = async (matchId: string): Promise<boolean> => {
  try {
    const matchRef = ref(database, `matches/${matchId}`);
    await update(matchRef, {
      status: 'completed',
      completedDate: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('[FINALIZE_MATCH] Error finalizing match:', error);
    return false;
  }
};

export const loginAdmin = async (username: string, password: string): Promise<boolean> => {
  try {
    // Get all admin users from Firebase
    const adminUsersRef = ref(database, 'adminUsers');
    const snapshot = await get(adminUsersRef);
    const adminUsers = snapshot.val() || {};

    // Check if username/password match an admin user
    for (const key in adminUsers) {
      const admin = adminUsers[key];
      if (admin.username === username && admin.password === password) {
        // Store admin session data in localStorage
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminUsername', username);
        return true;
      }
    }

    // If no admin users exist yet and using default credentials, create the default admin
    if (Object.keys(adminUsers).length === 0 && username === 'Mehdi' && password === '0000') {
      // Store admin session data in localStorage
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminUsername', username);

      // Create this default admin in Firebase
      await addAdminUser(username, password);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error logging in admin:', error);

    // Fall back to hardcoded credentials if Firebase fails
    if (username === 'Mehdi' && password === '0000') {
      localStorage.setItem('adminAuthenticated', 'true');
      localStorage.setItem('adminUsername', username);
      return true;
    }

    return false;
  }
};

// Admin user management
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const adminUsersRef = ref(database, 'adminUsers');
    const snapshot = await get(adminUsersRef);
    const adminUsers = snapshot.val() || {};

    // If no admins exist yet, create the default admin
    if (Object.keys(adminUsers).length === 0) {
      await addAdminUser('Mehdi', '0000');
      return [{ username: 'Mehdi', password: '0000' }];
    }

    return Object.values(adminUsers);
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
};

export const addAdminUser = async (username: string, password: string): Promise<boolean> => {
  try {
    // Check if username already exists
    const adminUsersRef = ref(database, 'adminUsers');
    const snapshot = await get(adminUsersRef);
    const adminUsers = snapshot.val() || {};

    for (const id in adminUsers) {
      if (adminUsers[id].username === username) {
        return false; // Username already exists
      }
    }

    const newAdminRef = push(adminUsersRef);
    await set(newAdminRef, { username, password });
    return true;
  } catch (error) {
    console.error('Error adding admin user:', error);
    return false;
  }
};

export const updateAdminUser = async (username: string, newPassword: string): Promise<boolean> => {
  try {
    const adminUsersRef = ref(database, 'adminUsers');
    const snapshot = await get(adminUsersRef);
    const adminUsers = snapshot.val() || {};

    let adminId = null;
    for (const id in adminUsers) {
      if (adminUsers[id].username === username) {
        adminId = id;
        break;
      }
    }

    if (!adminId) return false;

    await update(ref(database, `adminUsers/${adminId}`), { password: newPassword });
    return true;
  } catch (error) {
    console.error('Error updating admin user:', error);
    return false;
  }
};

export const deleteAdminUser = async (username: string): Promise<boolean> => {
  try {
    // Don't allow deleting the last admin
    const admins = await getAdminUsers();
    if (admins.length <= 1) {
      return false;
    }

    const adminUsersRef = ref(database, 'adminUsers');
    const snapshot = await get(adminUsersRef);
    const adminUsers = snapshot.val() || {};

    let adminId = null;
    for (const id in adminUsers) {
      if (adminUsers[id].username === username) {
        adminId = id;
        break;
      }
    }

    if (!adminId) return false;

    await remove(ref(database, `adminUsers/${adminId}`));
    return true;
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return false;
  }
};


