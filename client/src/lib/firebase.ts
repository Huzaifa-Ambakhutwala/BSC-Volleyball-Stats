import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, push, onValue, off, remove } from "firebase/database";
import type { Player, Team, Match, PlayerStats, MatchStats } from "@shared/schema";

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

// Players API
export const addPlayer = async (name: string) => {
  const playersRef = ref(database, 'players');
  const newPlayerRef = push(playersRef);
  await set(newPlayerRef, { name });
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

export const updatePlayer = async (playerId: string, name: string) => {
  try {
    console.log(`Updating player with ID: ${playerId}, name: ${name}`);
    const playerRef = ref(database, `players/${playerId}`);
    await update(playerRef, { name });
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
export const createTeam = async (teamName: string, playerIds: string[]) => {
  const teamsRef = ref(database, 'teams');
  const newTeamRef = push(teamsRef);
  await set(newTeamRef, { teamName, players: playerIds });
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
  const teamRef = ref(database, `teams/${teamId}`);
  const snapshot = await get(teamRef);
  return snapshot.val();
};

export const updateTeam = async (teamId: string, teamName: string, playerIds: string[]) => {
  try {
    console.log(`Updating team with ID: ${teamId}, name: ${teamName}, players:`, playerIds);
    const teamRef = ref(database, `teams/${teamId}`);
    await update(teamRef, { teamName, players: playerIds });
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
  await set(newMatchRef, { ...match, scoreA: 0, scoreB: 0 });
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

export const updateMatchScore = async (matchId: string, scoreA: number, scoreB: number) => {
  const matchRef = ref(database, `matches/${matchId}`);
  await update(matchRef, { scoreA, scoreB });
};

export const updateMatch = async (
  matchId: string, 
  updates: {
    courtNumber?: number;
    teamA?: string;
    teamB?: string;
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

export const updatePlayerStat = async (
  matchId: string, 
  playerId: string, 
  statName: keyof PlayerStats, 
  value: number
) => {
  const playerStatsRef = ref(database, `stats/${matchId}/${playerId}`);
  const snapshot = await get(playerStatsRef);
  const currentStats = snapshot.val() || createEmptyPlayerStats();
  
  await update(playerStatsRef, {
    [statName]: (currentStats[statName] || 0) + value
  });
};

export const getPlayerStats = async (matchId: string, playerId: string): Promise<PlayerStats> => {
  const playerStatsRef = ref(database, `stats/${matchId}/${playerId}`);
  const snapshot = await get(playerStatsRef);
  return snapshot.val() || createEmptyPlayerStats();
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

// Helper function to create an empty player stats object
export const createEmptyPlayerStats = (): PlayerStats => ({
  aces: 0,
  serveErrors: 0,
  spikes: 0,
  spikeErrors: 0,
  digs: 0,
  blocks: 0,
  netTouches: 0,
  tips: 0,
  dumps: 0,
  footFaults: 0,
  reaches: 0,
  carries: 0
});
