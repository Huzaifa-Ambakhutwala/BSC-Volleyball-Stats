import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { listenToMatchesByCourtNumber, getTeamById, getPlayers, listenToMatchStats } from '@/lib/firebase';
import type { Match, Team, Player, PlayerStats, MatchStats } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Activity } from 'lucide-react';

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
  const [matchStatsData, setMatchStatsData] = useState<MatchStats>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const { toast } = useToast();

  // Helper function to get emoji for stat type
  const getStatEmoji = (statName: keyof PlayerStats): string => {
    const emojiMap: Record<keyof PlayerStats, string> = {
      aces: '🔥',
      serveErrors: '❌',
      spikes: '💥',
      spikeErrors: '❌',
      digs: '🛡️',
      blocks: '🧱',
      netTouches: '🔗',
      tips: '👆',
      dumps: '🧮',
      footFaults: '👣',
      reaches: '🙋',
      carries: '🤲'
    };
    return emojiMap[statName] || '📊';
  };

  // Helper function for stat category color
  const getStatCategoryColor = (statName: keyof PlayerStats): string => {
    // Earned points - Green
    if (['aces', 'spikes', 'blocks', 'tips', 'dumps', 'digs'].includes(statName)) {
      return 'bg-green-500';
    }
    // Faults - Red (including reaches now)
    else {
      return 'bg-red-500';
    }
  };

  // Listen for matches on the specified court
  useEffect(() => {
    console.log(`[SCOREBOARD] Setting up listener for court ${courtNumber}`);
    
    const unsubscribe = listenToMatchesByCourtNumber(courtNumber, (matchesByCourtNumber) => {
      console.log(`[SCOREBOARD] Received ${Object.keys(matchesByCourtNumber).length} matches for court ${courtNumber}`);
      setMatches(matchesByCourtNumber);
      
      // Get the first match (or the one that's currently happening)
      const matchEntries = Object.entries(matchesByCourtNumber);
      if (matchEntries.length > 0) {
        const [matchId, firstMatch] = matchEntries[0];
        console.log(`[SCOREBOARD] Setting current match to: ${matchId}`);
        
        // IMPORTANT: Include the ID in the match object
        setCurrentMatch({ 
          id: matchId, 
          ...firstMatch 
        });
      } else {
        console.log(`[SCOREBOARD] No matches found for court ${courtNumber}`);
        setCurrentMatch(null);
      }
      
      setIsLoading(false);
    });
    
    return () => {
      console.log(`[SCOREBOARD] Removing listener for court ${courtNumber}`);
      unsubscribe();
    };
  }, [courtNumber]);

  // Fetch team data when current match changes
  useEffect(() => {
    if (!currentMatch) {
      setTeamA(null);
      setTeamB(null);
      return;
    }
    
    console.log(`[SCOREBOARD] Loading teams for match`);
    
    const loadTeams = async () => {
      try {
        const [teamAData, teamBData] = await Promise.all([
          getTeamById(currentMatch.teamA),
          getTeamById(currentMatch.teamB)
        ]);
        
        console.log(`[SCOREBOARD] Loaded Team A: ${teamAData?.teamName}`);
        console.log(`[SCOREBOARD] Loaded Team B: ${teamBData?.teamName}`);
        
        setTeamA(teamAData);
        setTeamB(teamBData);
      } catch (error) {
        console.error(`[SCOREBOARD] Error loading teams:`, error);
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
        console.log(`[SCOREBOARD] Loading all players`);
        const players = await getPlayers();
        console.log(`[SCOREBOARD] Loaded ${Object.keys(players).length} players`);
        setAllPlayers(players);
      } catch (error) {
        console.error(`[SCOREBOARD] Error loading players:`, error);
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

    console.log(`[SCOREBOARD] Filtering players for teams`);
    
    const teamAPlayers = teamA.players
      .map(playerId => allPlayers[playerId])
      .filter(Boolean);
      
    const teamBPlayers = teamB.players
      .map(playerId => allPlayers[playerId])
      .filter(Boolean);

    console.log(`[SCOREBOARD] Team A has ${teamAPlayers.length} players`);
    console.log(`[SCOREBOARD] Team B has ${teamBPlayers.length} players`);
    
    setPlayersA(teamAPlayers);
    setPlayersB(teamBPlayers);
  }, [teamA, teamB, allPlayers]);
  
  // Load match statistics when current match changes - USE listenToMatchStats directly
  useEffect(() => {
    if (!currentMatch?.id) {
      console.log(`[SCOREBOARD] No current match ID, skipping stats listener setup`);
      setMatchStatsData({});
      setStatsLoading(false);
      return;
    }
    
    console.log(`[SCOREBOARD] Setting up listenToMatchStats for match ID: ${currentMatch.id}`);
    setStatsLoading(true);
    
    // This is the key change - use listenToMatchStats instead of processing stat logs manually
    const unsubscribe = listenToMatchStats(currentMatch.id, (stats) => {
      console.log(`[SCOREBOARD] Received match stats update:`, stats);
      setMatchStatsData(stats);
      setStatsLoading(false);
    });
    
    return () => {
      console.log(`[SCOREBOARD] Removing match stats listener for match ${currentMatch.id}`);
      unsubscribe();
    };
  }, [currentMatch]);

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Court selector */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">Scoreboard Display</h2>
          <p className="text-gray-600">Select a court to view:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link key="all" href="/scoreboard/all">
              <button className="btn-blue">All Courts</button>
            </Link>
            <Link key="court1" href="/scoreboard/1">
              <button className={`btn-blue ${courtNumber === 1 ? 'bg-blue-800' : ''}`}>Court 1</button>
            </Link>
            <Link key="court2" href="/scoreboard/2">
              <button className={`btn-blue ${courtNumber === 2 ? 'bg-blue-800' : ''}`}>Court 2</button>
            </Link>
            <Link key="court3" href="/scoreboard/3">
              <button className={`btn-blue ${courtNumber === 3 ? 'bg-blue-800' : ''}`}>Court 3</button>
            </Link>
            <Link key="court4" href="/scoreboard/4">
              <button className={`btn-blue ${courtNumber === 4 ? 'bg-blue-800' : ''}`}>Court 4</button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading scoreboard data...</p>
          </div>
        ) : !currentMatch ? (
          <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-6">Court {courtNumber}</h3>
              <p className="text-xl">No matches scheduled for this court</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Match Scoreboard */}
            <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden mb-6">
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
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Player Statistics
                </h3>
                
                {statsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading player statistics...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Team A Stats */}
                    <div>
                      <h4 
                        className="text-md font-semibold mb-3 pb-2 border-b"
                        style={{ color: teamA?.teamColor, borderColor: teamA?.teamColor }}
                      >
                        {teamA?.teamName || 'Team A'}
                      </h4>
                      <div className="space-y-4">
                        {playersA.map(player => {
                          const playerStats = playerStats[player.id] || {};
                          
                          // Calculate totals
                          const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + 
                            (playerStats.blocks || 0) + (playerStats.digs || 0) + (playerStats.tips || 0) + 
                            (playerStats.dumps || 0);
                            
                          const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + 
                            (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) +
                            (playerStats.reaches || 0);
                          
                          const hasStats = totalEarnedPoints > 0 || totalFaults > 0;
                          
                          return (
                            <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-semibold mb-2">{player.name}</h5>
                              
                              {hasStats ? (
                                <>
                                  <div className="flex space-x-2 mb-3">
                                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                                      Points: {totalEarnedPoints}
                                    </div>
                                    <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                                      Faults: {totalFaults}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(playerStats).map(([key, value]) => {
                                      if (value > 0) {
                                        const statName = key as keyof PlayerStats;
                                        return (
                                          <div 
                                            key={key} 
                                            className={`flex items-center py-1 px-2 rounded text-white text-xs ${getStatCategoryColor(statName)}`}
                                            title={`${statName}: ${value}`}
                                          >
                                            <span className="mr-1">{getStatEmoji(statName)}</span>
                                            <span className="capitalize">{statName}: {value}</span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">No recorded stats for this player</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Team B Stats */}
                    <div>
                      <h4 
                        className="text-md font-semibold mb-3 pb-2 border-b"
                        style={{ color: teamB?.teamColor, borderColor: teamB?.teamColor }}
                      >
                        {teamB?.teamName || 'Team B'}
                      </h4>
                      <div className="space-y-4">
                        {playersB.map(player => {
                          const playerStats = playerStats[player.id] || {};
                          
                          // Calculate totals
                          const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + 
                            (playerStats.blocks || 0) + (playerStats.digs || 0) + (playerStats.tips || 0) + 
                            (playerStats.dumps || 0);
                            
                          const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + 
                            (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) +
                            (playerStats.reaches || 0);
                          
                          const hasStats = totalEarnedPoints > 0 || totalFaults > 0;
                          
                          return (
                            <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-semibold mb-2">{player.name}</h5>
                              
                              {hasStats ? (
                                <>
                                  <div className="flex space-x-2 mb-3">
                                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                                      Points: {totalEarnedPoints}
                                    </div>
                                    <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                                      Faults: {totalFaults}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(playerStats).map(([key, value]) => {
                                      if (value > 0) {
                                        const statName = key as keyof PlayerStats;
                                        return (
                                          <div 
                                            key={key} 
                                            className={`flex items-center py-1 px-2 rounded text-white text-xs ${getStatCategoryColor(statName)}`}
                                            title={`${statName}: ${value}`}
                                          >
                                            <span className="mr-1">{getStatEmoji(statName)}</span>
                                            <span className="capitalize">{statName}: {value}</span>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-500">No recorded stats for this player</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ScoreboardPage;
