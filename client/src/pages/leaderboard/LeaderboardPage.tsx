import { useState, useEffect } from 'react';
import { getPlayers, getMatches, getMatchStats, getTeams } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { Trophy, Medal, Users, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define player with calculated performance score
type PlayerWithScore = {
  id: string;
  player: Player;
  score: number;
  matchCount: number;
  team?: {
    name: string;
    color: string;
  };
  stats: PlayerStats;
};

// Define sort direction type
type SortDirection = 'asc' | 'desc';

// Define sort field type
type SortField = 'score' | 'name' | 'team' | 'matches';

const LeaderboardPage = () => {
  const [playersWithScores, setPlayersWithScores] = useState<PlayerWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [teams, setTeams] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Function to calculate player score based on weighted metrics
  const calculatePlayerScore = (stats: PlayerStats): number => {
    const weights = {
      points: 3,
      spikes: 2,
      aces: 2,
      blocks: 1.5,
      tips: 1,
      dumps: 1,
      digs: 1,
      // Deductions
      serveErrors: -1,
      spikeErrors: -1,
      netTouches: -1,
      footFaults: -1,
      reaches: -1,
      carries: -1,
      outOfBounds: -1,
      faults: -1
    };

    let score = 0;
    Object.entries(stats).forEach(([key, value]) => {
      const statKey = key as keyof typeof weights;
      if (weights[statKey]) {
        score += (value || 0) * weights[statKey];
      }
    });

    return Math.max(0, Math.round(score)); // Ensure score is not negative
  };

  // Handle toggling sort direction or changing sort field
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new fields
    }
  };

  // Sort players based on selected field and direction
  const sortedPlayers = [...playersWithScores].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'score':
        comparison = b.score - a.score; // Higher score first
        break;
      case 'name':
        comparison = a.player.name.localeCompare(b.player.name);
        break;
      case 'team':
        comparison = (a.team?.name || '').localeCompare(b.team?.name || '');
        break;
      case 'matches':
        comparison = b.matchCount - a.matchCount; // More matches first
        break;
      default:
        comparison = b.score - a.score;
    }

    // Reverse if ascending
    return sortDirection === 'asc' ? -comparison : comparison;
  });

  // Get the top player for MVP badge
  const mvpPlayer = playersWithScores.length > 0
    ? [...playersWithScores].sort((a, b) => b.score - a.score)[0]
    : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch players, matches, and team data
        const [playersData, matchesData] = await Promise.all([
          getPlayers(),
          getMatches()
        ]);

        // Create a map of teams for display purposes
        const teamsMap: Record<string, string> = {};
        Object.entries(matchesData).forEach(([_, match]) => {
          const { teamA, teamB } = match;
          // Populate team names map
          if (!teamsMap[teamA]) {
            // Attempt to get team name using Firebase (could implement getTeamById if needed)
            teamsMap[teamA] = `Team A (${teamA})`;
          }
          if (!teamsMap[teamB]) {
            teamsMap[teamB] = `Team B (${teamB})`;
          }
        });
        setTeams(teamsMap);

        // Process player stats to calculate scores
        await processPlayerStats(playersData, matchesData);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leaderboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const processPlayerStats = async (
    players: Record<string, Player>,
    matches: Record<string, Match>
  ) => {
    try {
      const playerStatsMap = new Map<string, {
        stats: PlayerStats,
        matchCount: number,
        teamId?: string
      }>();

      // Initialize stats for all players
      Object.entries(players).forEach(([id, player]) => {
        playerStatsMap.set(id, {
          stats: {
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
            carries: 0,
            points: 0,
            outOfBounds: 0,
            faults: 0,
            neutralBlocks: 0
          },
          matchCount: 0
        });
      });

      // Get all teams data
      const teamsData = await getTeams();

      // For each match, get stats and add to player totals
      for (const matchId of Object.keys(matches)) {
        try {
          const match = matches[matchId];
          const matchStats = await getMatchStats(matchId);

          // Add stats for each player in this match
          Object.entries(matchStats).forEach(([playerId, stats]) => {
            const playerData = playerStatsMap.get(playerId);

            if (playerData) {
              // Find which team this player belongs to
              let teamId = '';
              let teamInfo = null;

              // Check team A
              if (teamsData[match.teamA]?.players?.includes(playerId)) {
                teamId = match.teamA;
                teamInfo = teamsData[match.teamA];
              }
              // Check team B
              else if (teamsData[match.teamB]?.players?.includes(playerId)) {
                teamId = match.teamB;
                teamInfo = teamsData[match.teamB];
              }

              // Update stats
              const updatedStats = { ...playerData.stats };
              Object.keys(stats).forEach(key => {
                const statKey = key as keyof PlayerStats;
                updatedStats[statKey] = (updatedStats[statKey] || 0) + (stats[statKey] || 0);
              });

              // Update player data
              playerStatsMap.set(playerId, {
                stats: updatedStats,
                matchCount: playerData.matchCount + 1,
                teamId
              });
            }
          });
        } catch (error) {
          console.error(`Error processing match ${matchId}:`, error);
          // Continue with other matches even if one fails
        }
      }

      // Calculate scores and create the leaderboard data
      const playersWithScoresData = Array.from(playerStatsMap.entries())
        .map(([id, data]) => {
          const teamInfo = data.teamId ? teamsData[data.teamId] : null;
          return {
            id,
            player: players[id],
            score: calculatePlayerScore(data.stats),
            matchCount: data.matchCount,
            team: teamInfo ? {
              name: teamInfo.teamName,
              color: teamInfo.teamColor || '#3B82F6' // Default to blue if no color specified
            } : undefined,
            stats: data.stats
          };
        })
        .filter(item => item.matchCount > 0); // Only include players who have participated in matches

      setPlayersWithScores(playersWithScoresData);
    } catch (error) {
      console.error('Error processing player statistics:', error);
      toast({
        title: 'Error',
        description: 'Failed to process player statistics',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get MVP badge
  const getMVPBadge = (playerId: string) => {
    if (mvpPlayer && mvpPlayer.id === playerId) {
      return (
        <div className="inline-flex items-center justify-center bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full ml-2">
          <Trophy className="w-3 h-3 mr-1" />
          MVP
        </div>
      );
    }
    return null;
  };

  // Get medal for top 3 players
  const getMedal = (index: number) => {
    if (index === 0) return <Medal className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Medal className="w-4 h-4 text-amber-700" />;
    return null;
  };

  // Sort icon helper
  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 ml-1" /> :
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Helper function to determine text color based on background color
  const getTextColor = (hexColor: string): string => {
    const c = hexColor.substring(1); // strip #
    const rgb = parseInt(c, 16); // convert rrggbb to decimal
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    return brightness > 150 ? 'black' : 'white';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
          Tournament Leaderboard
        </h1>
        <p className="text-gray-600">
          Ranking all players based on performance across the tournament
        </p>
      </div>

      {playersWithScores.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">No player statistics available yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Check back after matches have been played and stats have been recorded.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    Rank
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Player
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('team')}
                  >
                    <div className="flex items-center">
                      Team
                      <SortIcon field="team" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center">
                      Performance Score
                      <SortIcon field="score" />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('matches')}
                  >
                    <div className="flex items-center">
                      Matches
                      <SortIcon field="matches" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    className={`${index < 3 ? 'bg-gray-50' : ''} hover:bg-gray-50 transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {index + 1}
                        <span className="ml-2">{getMedal(index)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {player.player.name}
                        {getMVPBadge(player.id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.team ? (
                        <span
                          style={{
                            backgroundColor: player.team.color,
                            color: getTextColor(player.team.color),
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            display: 'inline-block',
                          }}
                        >
                          {player.team.name}
                        </span>
                      ) : (
                        "Unassigned"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {player.score}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (player.score / (mvpPlayer?.score || 100)) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {player.matchCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <h3 className="font-medium text-sm mb-2">How scores are calculated:</h3>
            <div className="text-xs text-gray-600">
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <li>Points: 3 points</li>
                <li>Spikes: 2 points</li>
                <li>Aces: 2 points</li>
                <li>Blocks: 1.5 points</li>
                <li>Tips: 1 point</li>
                <li>Digs: 1 point</li>
                <li>Errors: -1 point</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;