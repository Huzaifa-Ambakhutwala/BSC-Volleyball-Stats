import { useState, useEffect, useMemo } from 'react';
import { getMatchStats } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Download, 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Users,
  BarChart3,
  Lightbulb,
  X,
  Plus
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadarController, RadialLinearScale, PointElement, LineElement);

interface PlayerComparisonProps {
  players: Record<string, Player>;
  matches: Record<string, Match>;
  teams: Record<string, any>;
}

type PlayerPerformanceData = {
  player: Player;
  playerId: string;
  totalStats: PlayerStats;
  matchCount: number;
  teamInfo?: {
    id: string;
    name: string;
    color?: string;
  };
  netScore: number;
  averagePerMatch: number;
};

const PlayerComparison = ({ players, matches, teams }: PlayerComparisonProps) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonData, setComparisonData] = useState<PlayerPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string[]>>({});
  const { toast } = useToast();

  // Helper functions
  const calculateTotalEarned = (stats: PlayerStats): number => {
    return (stats.aces || 0) + (stats.spikes || 0) + (stats.blocks || 0) + 
           (stats.tips || 0) + (stats.dumps || 0) + (stats.digs || 0) + (stats.points || 0);
  };

  const calculateTotalFaults = (stats: PlayerStats): number => {
    return (stats.serveErrors || 0) + (stats.spikeErrors || 0) + (stats.netTouches || 0) + 
           (stats.footFaults || 0) + (stats.reaches || 0) + (stats.carries || 0) + 
           (stats.outOfBounds || 0) + (stats.faults || 0);
  };

  // Generate AI-powered suggestions based on player stats
  const generateAISuggestions = (playerData: PlayerPerformanceData, comparisonPlayers: PlayerPerformanceData[]): string[] => {
    const suggestions: string[] = [];
    const totalEarned = calculateTotalEarned(playerData.totalStats);
    const totalFaults = calculateTotalFaults(playerData.totalStats);
    const matchCount = playerData.matchCount;

    // Compare with other players
    if (comparisonPlayers.length > 1) {
      const avgNetScore = comparisonPlayers.reduce((sum, p) => sum + p.netScore, 0) / comparisonPlayers.length;
      const playerRank = comparisonPlayers.sort((a, b) => b.netScore - a.netScore).findIndex(p => p.playerId === playerData.playerId) + 1;
      
      if (playerData.netScore < avgNetScore) {
        suggestions.push(`Performance below group average. Focus on increasing points earned while maintaining low error rate. Currently ranked ${playerRank} of ${comparisonPlayers.length}.`);
      } else {
        suggestions.push(`Strong performance above group average! Ranked ${playerRank} of ${comparisonPlayers.length}. Maintain consistency.`);
      }
    }

    // Performance analysis
    if (totalFaults > totalEarned) {
      suggestions.push("Focus on reducing errors - your faults exceed your points earned. Practice fundamental techniques with emphasis on control over power.");
    }

    // Serve analysis
    const serveAccuracy = playerData.totalStats.aces / Math.max(1, (playerData.totalStats.aces + playerData.totalStats.serveErrors));
    if (serveAccuracy < 0.6) {
      suggestions.push("Improve serve consistency - practice target serving and focus on placement over power to reduce serve errors.");
    }

    // Attack analysis
    const attackEfficiency = playerData.totalStats.spikes / Math.max(1, (playerData.totalStats.spikes + playerData.totalStats.spikeErrors));
    if (attackEfficiency < 0.7) {
      suggestions.push("Work on attack accuracy - focus on shot placement and approach timing to improve spike success rate.");
    }

    // Defense analysis
    if (playerData.totalStats.digs < matchCount * 2) {
      suggestions.push("Enhance defensive skills - practice reading opponent attacks and improve court positioning for better dig opportunities.");
    }

    // Blocking analysis
    if (playerData.totalStats.blocks < matchCount) {
      suggestions.push("Develop blocking technique - work on timing, hand positioning, and reading setter patterns to increase block effectiveness.");
    }

    return suggestions.length > 0 ? suggestions : ["Great performance! Continue with your current training regimen and focus on maintaining consistency."];
  };

  // Filter players based on search
  const filteredPlayers = useMemo(() => {
    return Object.entries(players).filter(([id, player]) =>
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (player.jerseyName && player.jerseyName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [players, searchQuery]);

  // Load data for a single player
  const loadSinglePlayerData = async (playerId: string): Promise<PlayerPerformanceData | null> => {
    const player = players[playerId];
    if (!player) return null;

    // Get all match stats in parallel
    const allMatchStats = await Promise.all(
      Object.keys(matches).map(async (matchId) => {
        try {
          const stats = await getMatchStats(matchId);
          return { matchId, stats };
        } catch (error) {
          console.error(`Error loading stats for match ${matchId}:`, error);
          return { matchId, stats: {} };
        }
      })
    );

    // Initialize totals
    const totalStats: PlayerStats = {
      aces: 0, serveErrors: 0, spikes: 0, spikeErrors: 0, digs: 0, blocks: 0,
      netTouches: 0, tips: 0, dumps: 0, footFaults: 0, reaches: 0, carries: 0,
      points: 0, outOfBounds: 0, faults: 0, neutralBlocks: 0
    };

    let matchCount = 0;
    let teamInfo: PlayerPerformanceData['teamInfo'] = undefined;

    // Process each match
    allMatchStats.forEach(({ matchId, stats }) => {
      if (stats[playerId]) {
        const playerStats = stats[playerId];
        matchCount++;
        
        // Add to totals
        Object.keys(totalStats).forEach(statKey => {
          const key = statKey as keyof PlayerStats;
          if (typeof playerStats[key] === 'number') {
            (totalStats[key] as number) += (playerStats[key] as number) || 0;
          }
        });

        // Find player's team
        if (!teamInfo) {
          Object.entries(teams).forEach(([teamId, team]) => {
            if (team.players && team.players.includes(playerId)) {
              teamInfo = {
                id: teamId,
                name: team.teamName,
                color: team.teamColor
              };
            }
          });
        }
      }
    });

    const totalEarned = calculateTotalEarned(totalStats);
    const totalFaults = calculateTotalFaults(totalStats);
    const netScore = totalEarned - totalFaults;

    return {
      player,
      playerId,
      totalStats,
      matchCount,
      teamInfo,
      netScore,
      averagePerMatch: matchCount > 0 ? netScore / matchCount : 0
    };
  };

  // Load comparison data for selected players
  const loadComparisonData = async () => {
    if (selectedPlayerIds.length === 0) return;
    
    setIsLoading(true);
    try {
      const comparisonResults = await Promise.all(
        selectedPlayerIds.map(id => loadSinglePlayerData(id))
      );
      const validResults = comparisonResults.filter(Boolean) as PlayerPerformanceData[];
      setComparisonData(validResults);

      // Generate AI suggestions for each player
      const suggestions: Record<string, string[]> = {};
      validResults.forEach(playerData => {
        suggestions[playerData.playerId] = generateAISuggestions(playerData, validResults);
      });
      setAiSuggestions(suggestions);
      
    } catch (error) {
      console.error('Error loading comparison data:', error);
      toast({
        title: "Error",
        description: "Failed to load comparison data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle player selection
  const handlePlayerSelect = (playerId: string) => {
    if (selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    } else if (selectedPlayerIds.length < 4) {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    } else {
      toast({
        title: "Maximum players reached",
        description: "You can compare up to 4 players at once",
        variant: "destructive",
      });
    }
  };

  // Load data when selection changes
  useEffect(() => {
    if (selectedPlayerIds.length > 0) {
      loadComparisonData();
    } else {
      setComparisonData([]);
      setAiSuggestions({});
    }
  }, [selectedPlayerIds]);

  // Chart data for comparison
  const comparisonChartData = useMemo(() => {
    if (comparisonData.length === 0) return null;

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];
    
    return {
      labels: ['Aces', 'Spikes', 'Blocks', 'Tips', 'Digs', 'Serve Errors', 'Spike Errors', 'Net Score'],
      datasets: comparisonData.map((playerData, index) => ({
        label: playerData.player.name,
        data: [
          playerData.totalStats.aces || 0,
          playerData.totalStats.spikes || 0,
          playerData.totalStats.blocks || 0,
          playerData.totalStats.tips || 0,
          playerData.totalStats.digs || 0,
          playerData.totalStats.serveErrors || 0,
          playerData.totalStats.spikeErrors || 0,
          playerData.netScore
        ],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        fill: false
      }))
    };
  }, [comparisonData]);

  // Export comparison data
  const exportComparisonData = () => {
    if (comparisonData.length === 0) return;

    const csvData = [
      ['Player Comparison Report'],
      ['Generated on:', new Date().toLocaleDateString()],
      [''],
      ['Player', 'Team', 'Matches', 'Net Score', 'Avg/Match', 'Aces', 'Spikes', 'Blocks', 'Tips', 'Digs', 'Serve Errors', 'Spike Errors'],
      ...comparisonData.map(playerData => [
        playerData.player.name,
        playerData.teamInfo?.name || 'No Team',
        playerData.matchCount.toString(),
        playerData.netScore.toString(),
        playerData.averagePerMatch.toFixed(2),
        (playerData.totalStats.aces || 0).toString(),
        (playerData.totalStats.spikes || 0).toString(),
        (playerData.totalStats.blocks || 0).toString(),
        (playerData.totalStats.tips || 0).toString(),
        (playerData.totalStats.digs || 0).toString(),
        (playerData.totalStats.serveErrors || 0).toString(),
        (playerData.totalStats.spikeErrors || 0).toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `player-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Player Comparison
          </h2>
          <p className="text-gray-600">Compare up to 4 players side by side with AI-powered insights</p>
        </div>
        {comparisonData.length > 0 && (
          <button
            onClick={exportComparisonData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            Export Comparison
          </button>
        )}
      </div>

      {/* Player Selection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Select Players to Compare</h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Selected Players */}
        {selectedPlayerIds.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Players ({selectedPlayerIds.length}/4):</h4>
            <div className="flex flex-wrap gap-2">
              {selectedPlayerIds.map(playerId => {
                const player = players[playerId];
                return (
                  <div key={playerId} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    <span className="text-sm font-medium">{player.name}</span>
                    <button
                      onClick={() => handlePlayerSelect(playerId)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Player Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
          {filteredPlayers.map(([playerId, player]) => {
            const isSelected = selectedPlayerIds.includes(playerId);
            const canSelect = selectedPlayerIds.length < 4 || isSelected;
            
            return (
              <button
                key={playerId}
                onClick={() => canSelect && handlePlayerSelect(playerId)}
                disabled={!canSelect}
                className={`p-3 text-left rounded-lg border transition ${
                  isSelected
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : canSelect
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="font-medium">{player.name}</span>
                </div>
                {player.jerseyNumber && (
                  <p className="text-sm text-gray-500 mt-1">#{player.jerseyNumber}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comparison data...</p>
        </div>
      )}

      {/* Comparison Results */}
      {comparisonData.length > 0 && !isLoading && (
        <>
          {/* Statistics Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Performance Comparison</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matches</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Match</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aces</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spikes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blocks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serve Errors</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.sort((a, b) => b.netScore - a.netScore).map((playerData, index) => (
                    <tr key={playerData.playerId} className={index === 0 ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-600 mr-2" />}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{playerData.player.name}</div>
                            {playerData.player.jerseyNumber && (
                              <div className="text-sm text-gray-500">#{playerData.player.jerseyNumber}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {playerData.teamInfo?.name || 'No Team'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {playerData.matchCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          playerData.netScore >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {playerData.netScore >= 0 ? '+' : ''}{playerData.netScore}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {playerData.averagePerMatch.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {playerData.totalStats.aces || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {playerData.totalStats.spikes || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {playerData.totalStats.blocks || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {playerData.totalStats.serveErrors || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison Chart */}
          {comparisonChartData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Radar Chart</h3>
              <div className="h-96">
                <Radar 
                  data={comparisonChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true,
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        },
                        angleLines: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Player Performance Comparison'
                      }
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {/* AI Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              AI-Powered Performance Insights
            </h3>
            {comparisonData.map((playerData) => (
              <div key={playerData.playerId} className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  Suggestions for {playerData.player.name}
                </h4>
                <div className="space-y-2">
                  {aiSuggestions[playerData.playerId]?.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {selectedPlayerIds.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select Players to Compare</h3>
          <p className="text-gray-600">Choose 2-4 players from the list above to see detailed performance comparisons and AI-powered insights.</p>
        </div>
      )}
    </div>
  );
};

export default PlayerComparison;