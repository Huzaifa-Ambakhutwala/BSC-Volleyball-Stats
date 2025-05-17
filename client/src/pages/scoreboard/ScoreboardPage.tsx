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

        // Create match object with ID
        setCurrentMatch({
          ...firstMatch,
          id: matchId
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

  // Filter players for each team - MODIFIED TO PRESERVE FIREBASE IDs
  useEffect(() => {
    if (!teamA || !teamB || !allPlayers || Object.keys(allPlayers).length === 0) {
      setPlayersA([]);
      setPlayersB([]);
      return;
    }

    console.log(`[SCOREBOARD] Filtering players for teams`);

    // Create new arrays where each player object includes its Firebase ID
    const teamAPlayers: Player[] = [];
    const teamBPlayers: Player[] = [];

    // Process Team A players
    teamA.players.forEach(playerId => {
      // Get the player data
      const playerData = allPlayers[playerId];
      if (!playerData) return;

      // Create a Player object with the Firebase ID
      teamAPlayers.push({
        ...playerData,
        id: playerId // Explicitly set the ID to the Firebase ID
      });
    });

    // Process Team B players
    teamB.players.forEach(playerId => {
      // Get the player data
      const playerData = allPlayers[playerId];
      if (!playerData) return;

      // Create a Player object with the Firebase ID
      teamBPlayers.push({
        ...playerData,
        id: playerId // Explicitly set the ID to the Firebase ID
      });
    });

    console.log(`[SCOREBOARD] Team A has ${teamAPlayers.length} players`);
    console.log(`[SCOREBOARD] Team B has ${teamBPlayers.length} players`);

    // Log the player IDs to confirm they are properly set
    console.log(`[SCOREBOARD] Team A player IDs:`, teamAPlayers.map(p => p.id));
    console.log(`[SCOREBOARD] Team B player IDs:`, teamBPlayers.map(p => p.id));

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

    // Use the direct Firebase data
    const unsubscribe = listenToMatchStats(currentMatch.id, (stats) => {
      console.log(`[SCOREBOARD] Received match stats update:`, stats);
      console.log(`[SCOREBOARD-EXAMINE-DATA] Stats object contents:`, JSON.stringify(stats, null, 2));

      // Type safety check on the data to ensure we have proper objects
      const cleanedStats: MatchStats = {};

      // Process each player's stats individually
      Object.entries(stats).forEach(([playerId, playerStats]) => {
        // Skip if somehow playerId is not a string
        if (typeof playerId !== 'string') {
          console.log(`[SCOREBOARD-WARNING] Invalid player ID:`, playerId);
          return;
        }

        if (!playerStats || typeof playerStats !== 'object') {
          console.log(`[SCOREBOARD-WARNING] Invalid player stats for ${playerId}:`, playerStats);
          return;
        }

        // Initialize this player's stats object with default values to satisfy the type
        cleanedStats[playerId] = {
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
        };

        // Copy all valid stat values
        Object.entries(playerStats).forEach(([statName, value]) => {
          // Only copy numeric values
          if (typeof value === 'number') {
            // Safely cast statName as a key of PlayerStats
            (cleanedStats[playerId] as any)[statName] = value;
          }
        });

        // Count the stats for this player
        const earnedPoints = (cleanedStats[playerId].aces || 0) +
          (cleanedStats[playerId].spikes || 0) +
          (cleanedStats[playerId].blocks || 0) +
          (cleanedStats[playerId].digs || 0) +
          (cleanedStats[playerId].tips || 0) +
          (cleanedStats[playerId].dumps || 0);

        const faults = (cleanedStats[playerId].serveErrors || 0) +
          (cleanedStats[playerId].spikeErrors || 0) +
          (cleanedStats[playerId].netTouches || 0) +
          (cleanedStats[playerId].footFaults || 0) +
          (cleanedStats[playerId].carries || 0) +
          (cleanedStats[playerId].reaches || 0);

        console.log(`[SCOREBOARD-PLAYER-STATS] Player ${playerId}: Points=${earnedPoints}, Faults=${faults}`);
      });

      console.log(`[SCOREBOARD-STATS-SUMMARY] Total players with stats: ${Object.keys(cleanedStats).length}`);

      // Set the cleaned data
      setMatchStatsData(cleanedStats);
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
                          // Print player ID for debugging
                          console.log(`[DEBUG-PLAYER-ID] Team A player: ${player.name}, ID: ${player.id}`);

                          // Check if this player ID exists in the stats
                          console.log(`[STATS-CHECK] Player ${player.id} has stats:`, !!matchStatsData[player.id]);

                          // Hard-code a temporary test with the IDs from our logs
                          const knownStatsIds = ["-OP2UkL0-hoG-HnZYJlU", "-OP2UkP00FgMO0IqPgR2", "-OP2UkrEwTsLlzAfKkPv",
                            "-OP2UktLuETRCYgo3z0E", "-OP2UktusIt0eOLwnIrI", "-OP2UkvC167jMXB_qvOZ"];

                          // See if player.id matches any known ID with stats
                          const isKnownId = knownStatsIds.includes(player.id);
                          console.log(`[KNOWN-ID-CHECK] Player ${player.id} is in known IDs: ${isKnownId}`);

                          // Get stats from matchStatsData
                          const playerData = matchStatsData[player.id] || {};

                          // Calculate totals
                          const totalEarnedPoints = (playerData.aces || 0) + (playerData.spikes || 0) +
                            (playerData.blocks || 0) + (playerData.digs || 0) + (playerData.tips || 0) +
                            (playerData.dumps || 0);

                          const totalFaults = (playerData.serveErrors || 0) + (playerData.spikeErrors || 0) +
                            (playerData.netTouches || 0) + (playerData.footFaults || 0) + (playerData.carries || 0) +
                            (playerData.reaches || 0);

                          const hasStats = totalEarnedPoints > 0 || totalFaults > 0;

                          // Log our findings
                          console.log(`[STATS-CALC] Player ${player.id}: hasStats=${hasStats}, earnedPoints=${totalEarnedPoints}, faults=${totalFaults}`);

                          return (
                            <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-semibold mb-2">
                                {player.name}
                                {isKnownId && <span className="text-xs text-blue-600 ml-1">(Has Firebase Stats)</span>}
                              </h5>


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
                                    {Object.entries(playerData).map(([key, value]) => {
                                      if (value && typeof value === 'number' && value > 0) {
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
                          // Print player ID for debugging
                          console.log(`[DEBUG-PLAYER-ID] Team B player: ${player.name}, ID: ${player.id}`);

                          // Check if this player ID exists in the stats
                          console.log(`[STATS-CHECK] Player ${player.id} has stats:`, !!matchStatsData[player.id]);

                          // Hard-code a temporary test with the IDs from our logs
                          const knownStatsIds = ["-OP2UkL0-hoG-HnZYJlU", "-OP2UkP00FgMO0IqPgR2", "-OP2UkrEwTsLlzAfKkPv",
                            "-OP2UktLuETRCYgo3z0E", "-OP2UktusIt0eOLwnIrI", "-OP2UkvC167jMXB_qvOZ"];

                          // See if player.id matches any known ID with stats
                          const isKnownId = knownStatsIds.includes(player.id);
                          console.log(`[KNOWN-ID-CHECK] Player ${player.id} is in known IDs: ${isKnownId}`);

                          // Get stats from matchStatsData
                          const playerData = matchStatsData[player.id] || {};

                          // Calculate totals
                          const totalEarnedPoints = (playerData.aces || 0) + (playerData.spikes || 0) +
                            (playerData.blocks || 0) + (playerData.digs || 0) + (playerData.tips || 0) +
                            (playerData.dumps || 0);

                          const totalFaults = (playerData.serveErrors || 0) + (playerData.spikeErrors || 0) +
                            (playerData.netTouches || 0) + (playerData.footFaults || 0) + (playerData.carries || 0) +
                            (playerData.reaches || 0);

                          const hasStats = totalEarnedPoints > 0 || totalFaults > 0;

                          // Log our findings
                          console.log(`[STATS-CALC] Player ${player.id}: hasStats=${hasStats}, earnedPoints=${totalEarnedPoints}, faults=${totalFaults}`);

                          return (
                            <div key={player.id} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-semibold mb-2">
                                {player.name}
                                {isKnownId && <span className="text-xs text-blue-600 ml-1">(Has Firebase Stats)</span>}
                              </h5>

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
                                    {Object.entries(playerData).map(([key, value]) => {
                                      if (value && typeof value === 'number' && value > 0) {
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