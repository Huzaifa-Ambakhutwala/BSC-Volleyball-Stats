import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { listenToMatchesByCourtNumber, getTeamById, getPlayers, getMatchStats, listenToStatLogs, getStatLogs, type StatLog, createEmptyPlayerStats } from '@/lib/firebase';
import type { Match, Team, Player, PlayerStats, MatchStats } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ScoreboardStatCard from '@/components/ScoreboardStatCard';
import { Loader2 } from 'lucide-react';

const ScoreboardPage = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const courtNumber = parseInt(courtId || '1');
  
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<Record<string, Player>>({});
  const [playerStats, setPlayerStats] = useState<MatchStats>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const { toast } = useToast();

  // Listen for matches on the specified court
  useEffect(() => {
    const unsubscribe = listenToMatchesByCourtNumber(courtNumber, (matchesByCourtNumber) => {
      setMatches(matchesByCourtNumber);
      
      // Get the first match (or the one that's currently happening)
      const matchEntries = Object.entries(matchesByCourtNumber);
      if (matchEntries.length > 0) {
        const [, firstMatch] = matchEntries[0];
        setCurrentMatch(firstMatch);
      } else {
        setCurrentMatch(null);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [courtNumber]);

  // Fetch team data when current match changes
  useEffect(() => {
    if (!currentMatch) {
      setTeamA(null);
      setTeamB(null);
      return;
    }
    
    const loadTeams = async () => {
      try {
        const [teamAData, teamBData] = await Promise.all([
          getTeamById(currentMatch.teamA),
          getTeamById(currentMatch.teamB)
        ]);
        
        setTeamA(teamAData);
        setTeamB(teamBData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load team information",
          variant: "destructive",
        });
      }
    };
    
    loadTeams();
  }, [currentMatch, toast]);

  // Load all players data
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const players = await getPlayers();
        setAllPlayers(players);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load player information",
          variant: "destructive",
        });
      }
    };
    
    loadPlayers();
  }, [toast]);

  // Filter players for each team
  useEffect(() => {
    if (!teamA || !teamB || !allPlayers || Object.keys(allPlayers).length === 0) {
      setPlayersA([]);
      setPlayersB([]);
      return;
    }

    const teamAPlayers = teamA.players
      .map(playerId => allPlayers[playerId])
      .filter(Boolean);
      
    const teamBPlayers = teamB.players
      .map(playerId => allPlayers[playerId])
      .filter(Boolean);

    setPlayersA(teamAPlayers);
    setPlayersB(teamBPlayers);
  }, [teamA, teamB, allPlayers]);
  
  // Load player stats when current match changes
  useEffect(() => {
    if (!currentMatch || !currentMatch.id) {
      // Clear player stats if no match is selected
      setPlayerStats({});
      setStatsLoading(false);
      return;
    }
    
    console.log(`[SCOREBOARD] Loading match stats for match ID: ${currentMatch.id}`);
    setStatsLoading(true);
    
    // Set up a real-time listener for stat logs
    // This will update the UI whenever a new stat is recorded
    const unsubscribeStatLogs = listenToStatLogs(currentMatch.id, async (logs) => {
      console.log(`[SCOREBOARD] Stat logs listener updated, ${logs.length} logs received`);
      
      if (logs.length > 0) {
        console.log(`[SCOREBOARD] First log sample:`, logs[0]);
      } else {
        console.warn(`[SCOREBOARD] WARNING: No logs received for match ${currentMatch.id}`);
      }
      
      try {
        setStatsLoading(true);
        
        // IMPROVEMENT: Calculate stats directly from logs instead of relying on Firebase stats path
        // This ensures we always have the most up-to-date stats even if the Firebase stats path isn't updating
        const calculatedStats: MatchStats = {};
        
        // Process each log to build up player stats
        logs.forEach((log: StatLog) => {
          // Make sure the log has a valid playerId and statName
          if (!log.playerId || !log.statName) {
            console.warn(`[SCOREBOARD] Invalid log encountered:`, log);
            return; // Skip this log
          }
          
          // Initialize player stats if this is the first log for this player
          if (!calculatedStats[log.playerId]) {
            calculatedStats[log.playerId] = createEmptyPlayerStats();
          }
          
          // Update the specific stat from the log
          const statName = log.statName as keyof PlayerStats;
          const currentValue = calculatedStats[log.playerId][statName] || 0;
          calculatedStats[log.playerId][statName] = currentValue + log.value;
        });
        
        console.log(`[SCOREBOARD] Calculated player stats from ${logs.length} logs:`, calculatedStats);
        
        // Debug output to help diagnose if stats are being calculated
        if (Object.keys(calculatedStats).length === 0) {
          console.warn(`[SCOREBOARD] WARNING: No player stats calculated for match ${currentMatch.id}`);
          
          // Direct database check as fallback
          try {
            // First try direct logs path check
            console.log(`[SCOREBOARD] Attempting direct check of statLogs/${currentMatch.id}`);
            
            // Fallback to Firebase stats path
            const stats = await getMatchStats(currentMatch.id);
            console.log(`[SCOREBOARD] Fallback to Firebase stats path returned:`, stats);
            
            if (Object.keys(stats).length > 0) {
              console.log(`[SCOREBOARD] SUCCESS: Fetched stats from Firebase stats path as fallback`);
              setPlayerStats(stats);
            } else {
              console.error(`[SCOREBOARD] CRITICAL: Both calculation and Firebase stats failed`);
              setPlayerStats({});
            }
          } catch (error) {
            console.error(`[SCOREBOARD] Fallback to Firebase stats failed:`, error);
            setPlayerStats({});
          }
        } else {
          console.log(`[SCOREBOARD] SUCCESS: Calculated stats for ${Object.keys(calculatedStats).length} players`);
          
          // Log the first player's stats as a sample
          const firstPlayerId = Object.keys(calculatedStats)[0];
          if (firstPlayerId) {
            console.log(`[SCOREBOARD] Sample player ${firstPlayerId} stats:`, calculatedStats[firstPlayerId]);
          }
          
          // Update state with calculated stats
          setPlayerStats(calculatedStats);
        }
        
        setStatsLoading(false);
      } catch (error) {
        console.error(`[SCOREBOARD] Error processing stat logs:`, error);
        setStatsLoading(false);
        toast({
          title: "Error",
          description: "Failed to load player statistics",
          variant: "destructive",
        });
      }
    });
    
    // Initial load of match stats (eager loading)
    const loadInitialStats = async () => {
      try {
        console.log(`[SCOREBOARD] Initial: Starting eager load of stats for match ${currentMatch.id}`);
        setStatsLoading(true);
        
        // First try to get stat logs and calculate stats from those
        const logs = await getStatLogs(currentMatch.id);
        console.log(`[SCOREBOARD] Initial: Got ${logs.length} stat logs directly`);
        
        if (logs.length > 0) {
          // Calculate stats from logs
          const calculatedStats: MatchStats = {};
          
          // Process each log to build up player stats
          logs.forEach((log: StatLog) => {
            // Skip invalid logs
            if (!log.playerId || !log.statName) {
              console.warn(`[SCOREBOARD] Initial: Invalid log encountered:`, log);
              return;
            }
            
            if (!calculatedStats[log.playerId]) {
              calculatedStats[log.playerId] = createEmptyPlayerStats();
            }
            
            const statName = log.statName as keyof PlayerStats;
            const currentValue = calculatedStats[log.playerId][statName] || 0;
            calculatedStats[log.playerId][statName] = currentValue + log.value;
          });
          
          console.log(`[SCOREBOARD] Initial: Calculated stats from logs:`, calculatedStats);
          
          if (Object.keys(calculatedStats).length > 0) {
            setPlayerStats(calculatedStats);
            setStatsLoading(false);
            return; // Exit early if we have stats
          }
        }
        
        // Fallback to Firebase stats path
        console.log(`[SCOREBOARD] Initial: No stats from logs, trying Firebase stats path`);
        const stats = await getMatchStats(currentMatch.id);
        console.log(`[SCOREBOARD] Initial: Firebase stats path returned:`, stats);
        
        if (Object.keys(stats).length > 0) {
          setPlayerStats(stats);
        } else {
          console.warn(`[SCOREBOARD] Initial: All stats loading methods failed for match ${currentMatch.id}`);
          setPlayerStats({});
        }
        
        setStatsLoading(false);
      } catch (error) {
        console.error(`[SCOREBOARD] Error loading initial match stats:`, error);
        setStatsLoading(false);
      }
    };
    
    // Start eager loading of stats
    loadInitialStats();
    
    return () => {
      console.log(`[SCOREBOARD] Removing stat logs listener for match ID: ${currentMatch.id}`);
      unsubscribeStatLogs();
    };
  }, [currentMatch, toast]);

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Court selector */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">Scoreboard Display</h2>
          <p className="text-gray-600">Select a court to view:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/scoreboard/all">
              <button className="btn-blue">All Courts</button>
            </Link>
            <Link href="/scoreboard/1">
              <button className={`btn-blue ${courtNumber === 1 ? 'bg-blue-800' : ''}`}>Court 1</button>
            </Link>
            <Link href="/scoreboard/2">
              <button className={`btn-blue ${courtNumber === 2 ? 'bg-blue-800' : ''}`}>Court 2</button>
            </Link>
            <Link href="/scoreboard/3">
              <button className={`btn-blue ${courtNumber === 3 ? 'bg-blue-800' : ''}`}>Court 3</button>
            </Link>
            <Link href="/scoreboard/4">
              <button className={`btn-blue ${courtNumber === 4 ? 'bg-blue-800' : ''}`}>Court 4</button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading scoreboard data...</div>
        ) : !currentMatch ? (
          <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-6">Court {courtNumber}</h3>
              <p className="text-xl">No matches scheduled for this court</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-6">Court {courtNumber}</h3>
                <div className="flex justify-center items-center space-x-8">
                  <div className="text-center">
                    <div className="text-[hsl(var(--vb-blue))] font-bold text-3xl mb-2">
                      {teamA?.teamName || 'Team A'}
                    </div>
                    <div className="font-mono text-7xl font-bold">{currentMatch.scoreA}</div>
                  </div>
                  <div className="text-4xl font-bold">vs</div>
                  <div className="text-center">
                    <div className="text-[hsl(var(--vb-yellow))] font-bold text-3xl mb-2">
                      {teamB?.teamName || 'Team B'}
                    </div>
                    <div className="font-mono text-7xl font-bold">{currentMatch.scoreB}</div>
                  </div>
                </div>
                <div className="mt-8 text-lg text-gray-400">
                  Start Time: {formatTime(currentMatch.startTime)}
                </div>
              </div>
            </div>
            
            {/* Player Stats Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Player Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team A Players */}
                <div>
                  <h4 className="text-lg font-bold mb-3" style={{color: teamA?.teamColor}}>
                    {teamA?.teamName || 'Team A'} Players
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {playersA.map(player => (
                      <div key={player.id} className="w-full">
                        {/* Read-only player card for scoreboard with stats */}
                        <ScoreboardStatCard 
                          player={player}
                          playerId={player.id}
                          matchId={currentMatch.id}
                          teamId={teamA?.id}
                          stats={playerStats[player.id]}
                          isLoading={statsLoading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Team B Players */}
                <div>
                  <h4 className="text-lg font-bold mb-3" style={{color: teamB?.teamColor}}>
                    {teamB?.teamName || 'Team B'} Players
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {playersB.map(player => (
                      <div key={player.id} className="w-full">
                        <ScoreboardStatCard 
                          player={player}
                          playerId={player.id}
                          matchId={currentMatch.id}
                          teamId={teamB?.id}
                          stats={playerStats[player.id]}
                          isLoading={statsLoading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </section>
  );
};

export default ScoreboardPage;
