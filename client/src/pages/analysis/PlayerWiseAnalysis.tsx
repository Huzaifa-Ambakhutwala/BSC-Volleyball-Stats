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
  Target,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  Lightbulb
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface PlayerWiseAnalysisProps {
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
  matchPerformances: Array<{
    matchId: string;
    match: Match;
    stats: PlayerStats;
    netScore: number;
  }>;
  bestPerformance?: {
    matchId: string;
    netScore: number;
    totalPoints: number;
  };
  worstPerformance?: {
    matchId: string;
    netScore: number;
    totalFaults: number;
  };
};

const PlayerWiseAnalysis = ({ players, matches, teams }: PlayerWiseAnalysisProps) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [playerData, setPlayerData] = useState<PlayerPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('overview');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
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
  const generateAISuggestions = (playerData: PlayerPerformanceData): string[] => {
    const suggestions: string[] = [];
    const totalEarned = calculateTotalEarned(playerData.totalStats);
    const totalFaults = calculateTotalFaults(playerData.totalStats);
    const netScore = totalEarned - totalFaults;
    const matchCount = playerData.matchCount;

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

    // Overall performance
    if (netScore / matchCount < 2) {
      suggestions.push("Focus on consistent positive impact - aim for at least 2-3 net positive points per match through smart play selection.");
    }

    // Consistency analysis
    const performances = playerData.matchPerformances.map(p => p.netScore);
    const avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;
    const variance = performances.reduce((a, b) => a + Math.pow(b - avgPerformance, 2), 0) / performances.length;
    if (variance > 4) {
      suggestions.push("Work on consistency - your performance varies significantly between matches. Focus on mental preparation and routine development.");
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

  // Load player performance data
  const loadPlayerData = async (playerId: string) => {
    if (!playerId) return;
    
    setIsLoading(true);
    try {
      const player = players[playerId];
      if (!player) return;

      console.log(`[PLAYER_ANALYSIS] Loading data for ${player.name}`);

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

      const matchPerformances: PlayerPerformanceData['matchPerformances'] = [];
      let teamInfo: PlayerPerformanceData['teamInfo'] = undefined;

      // Process each match
      allMatchStats.forEach(({ matchId, stats }) => {
        if (stats[playerId]) {
          const match = matches[matchId];
          const playerStats = stats[playerId];
          
          // Add to totals
          Object.keys(totalStats).forEach(statKey => {
            const key = statKey as keyof PlayerStats;
            if (typeof playerStats[key] === 'number') {
              (totalStats[key] as number) += (playerStats[key] as number) || 0;
            }
          });

          // Calculate net score for this match
          const earned = calculateTotalEarned(playerStats);
          const faults = calculateTotalFaults(playerStats);
          const netScore = earned - faults;

          matchPerformances.push({
            matchId,
            match,
            stats: playerStats,
            netScore
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

      // Find best and worst performances
      let bestPerformance: PlayerPerformanceData['bestPerformance'];
      let worstPerformance: PlayerPerformanceData['worstPerformance'];

      if (matchPerformances.length > 0) {
        const sortedByNet = [...matchPerformances].sort((a, b) => b.netScore - a.netScore);
        bestPerformance = {
          matchId: sortedByNet[0].matchId,
          netScore: sortedByNet[0].netScore,
          totalPoints: calculateTotalEarned(sortedByNet[0].stats)
        };

        worstPerformance = {
          matchId: sortedByNet[sortedByNet.length - 1].matchId,
          netScore: sortedByNet[sortedByNet.length - 1].netScore,
          totalFaults: calculateTotalFaults(sortedByNet[sortedByNet.length - 1].stats)
        };
      }

      const performanceData: PlayerPerformanceData = {
        player,
        playerId,
        totalStats,
        matchCount: matchPerformances.length,
        teamInfo,
        matchPerformances: matchPerformances.sort((a, b) => 
          new Date(a.match.startTime).getTime() - new Date(b.match.startTime).getTime()
        ),
        bestPerformance,
        worstPerformance
      };

      setPlayerData(performanceData);
      setAiSuggestions(generateAISuggestions(performanceData));
      console.log(`[PLAYER_ANALYSIS] Loaded data for ${player.name}:`, performanceData);

    } catch (error) {
      console.error('[PLAYER_ANALYSIS] Error loading player data:', error);
      toast({
        title: "Error",
        description: "Failed to load player performance data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when player is selected
  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerData(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  // Chart data for performance breakdown
  const performanceChartData = useMemo(() => {
    if (!playerData) return null;

    const stats = playerData.totalStats;
    return {
      labels: ['Aces', 'Spikes', 'Blocks', 'Tips', 'Dumps', 'Digs', 'Points'],
      datasets: [{
        label: 'Points Earned',
        data: [
          stats.aces || 0,
          stats.spikes || 0,
          stats.blocks || 0,
          stats.tips || 0,
          stats.dumps || 0,
          stats.digs || 0,
          stats.points || 0
        ],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'
        ]
      }]
    };
  }, [playerData]);

  // Faults chart data
  const faultsChartData = useMemo(() => {
    if (!playerData) return null;

    const stats = playerData.totalStats;
    return {
      labels: ['Serve Errors', 'Spike Errors', 'Net Touches', 'Foot Faults', 'Reaches', 'Carries', 'Out of Bounds', 'Other Faults'],
      datasets: [{
        label: 'Faults',
        data: [
          stats.serveErrors || 0,
          stats.spikeErrors || 0,
          stats.netTouches || 0,
          stats.footFaults || 0,
          stats.reaches || 0,
          stats.carries || 0,
          stats.outOfBounds || 0,
          stats.faults || 0
        ],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
      }]
    };
  }, [playerData]);

  // Performance trend chart data
  const trendChartData = useMemo(() => {
    if (!playerData || playerData.matchPerformances.length === 0) return null;

    return {
      labels: playerData.matchPerformances.map((_, index) => `Match ${index + 1}`),
      datasets: [{
        label: 'Net Score per Match',
        data: playerData.matchPerformances.map(p => p.netScore),
        borderColor: '#36A2EB',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1
      }, {
        label: 'Points Earned',
        data: playerData.matchPerformances.map(p => calculateTotalEarned(p.stats)),
        borderColor: '#4BC0C0',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1
      }, {
        label: 'Total Faults',
        data: playerData.matchPerformances.map(p => calculateTotalFaults(p.stats)),
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1
      }]
    };
  }, [playerData]);

  // Export player data as CSV
  const exportPlayerData = () => {
    if (!playerData) return;

    const csvData = [
      ['Player Performance Report'],
      ['Player:', playerData.player.name],
      ['Team:', playerData.teamInfo?.name || 'No Team'],
      ['Total Matches:', playerData.matchCount.toString()],
      ['Generated on:', new Date().toLocaleDateString()],
      [''],
      ['Summary Statistics'],
      ['Aces', (playerData.totalStats.aces || 0).toString()],
      ['Spikes', (playerData.totalStats.spikes || 0).toString()],
      ['Blocks', (playerData.totalStats.blocks || 0).toString()],
      ['Tips', (playerData.totalStats.tips || 0).toString()],
      ['Digs', (playerData.totalStats.digs || 0).toString()],
      [''],
      ['Match-by-Match Performance'],
      ['Match #', 'Teams', 'Date', 'Court', 'Points', 'Faults', 'Net Score'],
      ...playerData.matchPerformances.map((perf, index) => {
        const teamAName = teams[perf.match.teamA]?.teamName || 'Team A';
        const teamBName = teams[perf.match.teamB]?.teamName || 'Team B';
        return [
          (index + 1).toString(),
          `${teamAName} vs ${teamBName}`,
          new Date(perf.match.startTime).toLocaleDateString(),
          perf.match.courtNumber.toString(),
          calculateTotalEarned(perf.stats).toString(),
          calculateTotalFaults(perf.stats).toString(),
          perf.netScore.toString()
        ];
      })
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playerData.player.name.replace(/\s+/g, '_')}-performance-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Select a Player to Analyze</h2>
        
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

        {/* Player Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
          {filteredPlayers.map(([playerId, player]) => (
            <button
              key={playerId}
              onClick={() => setSelectedPlayerId(playerId)}
              className={`p-3 text-left rounded-lg border transition ${
                selectedPlayerId === playerId
                  ? 'bg-blue-50 border-blue-500 text-blue-900'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-900'
              }`}
            >
              <div className="font-medium">{player.name}</div>
              {player.jerseyNumber && (
                <div className="text-sm text-gray-500">#{player.jerseyNumber}</div>
              )}
              {player.jerseyName && (
                <div className="text-sm text-gray-500">{player.jerseyName}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading player performance data...</p>
        </div>
      )}

      {/* Player Performance Data */}
      {playerData && !isLoading && (
        <div className="space-y-6">
          {/* Player Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{playerData.player.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {playerData.teamInfo && (
                    <span>Team: {playerData.teamInfo.name}</span>
                  )}
                  {playerData.player.jerseyNumber && (
                    <span>Jersey: #{playerData.player.jerseyNumber}</span>
                  )}
                  <span>Matches Played: {playerData.matchCount}</span>
                </div>
              </div>
              <button
                onClick={exportPlayerData}
                className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Total Points</p>
                    <p className="text-2xl font-bold text-green-900">
                      {calculateTotalEarned(playerData.totalStats)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Total Faults</p>
                    <p className="text-2xl font-bold text-red-900">
                      {calculateTotalFaults(playerData.totalStats)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Net Score</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {calculateTotalEarned(playerData.totalStats) - calculateTotalFaults(playerData.totalStats)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Avg per Match</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {playerData.matchCount > 0 
                        ? ((calculateTotalEarned(playerData.totalStats) - calculateTotalFaults(playerData.totalStats)) / playerData.matchCount).toFixed(1)
                        : '0'
                      }
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* AI-Powered Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                AI-Powered Performance Insights
              </h3>
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Points Breakdown */}
            {performanceChartData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Points Breakdown
                </h3>
                <div className="h-64">
                  <Pie 
                    data={performanceChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}

            {/* Faults Breakdown */}
            {faultsChartData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Faults Breakdown
                </h3>
                <div className="h-64">
                  <Bar 
                    data={faultsChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Performance Trend */}
          {trendChartData && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
              <div className="h-64">
                <Line 
                  data={trendChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      }
                    }
                  }} 
                />
              </div>
            </div>
          )}

          {/* Detailed Match History */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detailed Match History</h3>
              <button
                onClick={() => setExpandedSection(expandedSection === 'history' ? '' : 'history')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                {expandedSection === 'history' ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Expand
                  </>
                )}
              </button>
            </div>
            
            {expandedSection === 'history' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Match
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teams
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Court
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Faults
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {playerData.matchPerformances.map((performance, index) => {
                      const points = calculateTotalEarned(performance.stats);
                      const faults = calculateTotalFaults(performance.stats);
                      const teamAName = teams[performance.match.teamA]?.teamName || 'Team A';
                      const teamBName = teams[performance.match.teamB]?.teamName || 'Team B';
                      return (
                        <tr key={performance.matchId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            Match {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {teamAName} vs {teamBName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(performance.match.startTime).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Court {performance.match.courtNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              +{points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              -{faults}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              performance.netScore >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {performance.netScore >= 0 ? '+' : ''}{performance.netScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedPlayerId && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Player Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a player from the list above to view detailed performance analysis and AI-powered insights.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerWiseAnalysis;