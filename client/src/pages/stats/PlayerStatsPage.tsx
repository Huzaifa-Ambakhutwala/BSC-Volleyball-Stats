import { useState, useEffect } from 'react';
import { getPlayers, getMatches, getMatchStats } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import SimpleStatCard from '@/components/SimpleStatCard';
import { ChevronDown, ChevronUp, Award, BarChart, Activity, TrendingUp, Trophy } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, ArcElement } from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type PlayerWithTotalStats = {
  player: Player;
  id: string;
  totalStats: PlayerStats;
  matchCount: number;
  winCount?: number;
  lossCount?: number;
};

const PlayerStatsPage = () => {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [playersWithStats, setPlayersWithStats] = useState<PlayerWithTotalStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<keyof PlayerStats | 'totalEarned' | 'totalFaults'>('totalEarned');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({});
  
  // Helper function to toggle expanded state for a player
  const toggleExpanded = (playerId: string) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };

  // Helper function to calculate total earned points
  const calculateTotalEarned = (stats: PlayerStats): number => {
    return (stats.aces || 0) + (stats.spikes || 0) + (stats.blocks || 0) + 
           (stats.tips || 0) + (stats.dumps || 0) + (stats.digs || 0) + (stats.points || 0);
  };

  // Helper function to calculate total faults
  const calculateTotalFaults = (stats: PlayerStats): number => {
    return (stats.serveErrors || 0) + (stats.spikeErrors || 0) + (stats.netTouches || 0) + 
           (stats.footFaults || 0) + (stats.reaches || 0) + (stats.carries || 0) + 
           (stats.outOfBounds || 0) + (stats.faults || 0);
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('[PLAYER_STATS] Loading players and matches...');
        
        const [playersData, matchesData] = await Promise.all([
          getPlayers(),
          getMatches()
        ]);

        console.log('[PLAYER_STATS] Loaded', Object.keys(playersData).length, 'players');
        console.log('[PLAYER_STATS] Loaded', Object.keys(matchesData).length, 'matches');

        setPlayers(playersData);
        setMatches(matchesData);

        // Calculate stats for each player
        const playersWithStatsData: PlayerWithTotalStats[] = [];

        for (const [playerId, player] of Object.entries(playersData)) {
          console.log(`[PLAYER_STATS] Processing player: ${player.name} (${playerId})`);
          
          // Initialize totals
          const totalStats: PlayerStats = {
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
          };

          let matchCount = 0;

          // Go through all matches and aggregate stats for this player
          for (const [matchId, match] of Object.entries(matchesData)) {
            try {
              const matchStats = await getMatchStats(matchId);
              
              if (matchStats[playerId]) {
                console.log(`[PLAYER_STATS] Found stats for ${player.name} in match ${matchId}`);
                matchCount++;
                
                const playerMatchStats = matchStats[playerId];
                
                // Add up all the stats
                Object.keys(totalStats).forEach(statKey => {
                  const key = statKey as keyof PlayerStats;
                  if (typeof playerMatchStats[key] === 'number') {
                    (totalStats[key] as number) += (playerMatchStats[key] as number) || 0;
                  }
                });
              }
            } catch (error) {
              console.error(`[PLAYER_STATS] Error loading stats for match ${matchId}:`, error);
            }
          }

          console.log(`[PLAYER_STATS] ${player.name} total stats:`, totalStats);
          console.log(`[PLAYER_STATS] ${player.name} played in ${matchCount} matches`);

          playersWithStatsData.push({
            player,
            id: playerId,
            totalStats,
            matchCount
          });
        }

        console.log('[PLAYER_STATS] Finished processing all players');
        setPlayersWithStats(playersWithStatsData);
        
      } catch (error) {
        console.error('[PLAYER_STATS] Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load player statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Filter and sort players
  const filteredAndSortedPlayers = playersWithStats
    .filter(playerData => 
      playerData.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (playerData.player.jerseyName && playerData.player.jerseyName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'totalEarned') {
        return calculateTotalEarned(b.totalStats) - calculateTotalEarned(a.totalStats);
      } else if (sortBy === 'totalFaults') {
        return calculateTotalFaults(b.totalStats) - calculateTotalFaults(a.totalStats);
      } else {
        const aValue = a.totalStats[sortBy] || 0;
        const bValue = b.totalStats[sortBy] || 0;
        return (bValue as number) - (aValue as number);
      }
    });

  // Chart data for top performers
  const topPerformers = filteredAndSortedPlayers.slice(0, 10);
  const chartData = {
    labels: topPerformers.map(p => p.player.name),
    datasets: [
      {
        label: 'Total Earned Points',
        data: topPerformers.map(p => calculateTotalEarned(p.totalStats)),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Faults',
        data: topPerformers.map(p => calculateTotalFaults(p.totalStats)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 Players - Earned Points vs Faults',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Player Statistics</h1>
        <p className="text-gray-600">View comprehensive statistics for all players across all matches</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading player statistics...</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as keyof PlayerStats | 'totalEarned' | 'totalFaults')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="totalEarned">Total Earned Points</option>
              <option value="totalFaults">Total Faults</option>
              <option value="aces">Aces</option>
              <option value="spikes">Spikes</option>
              <option value="blocks">Blocks</option>
              <option value="tips">Tips</option>
              <option value="dumps">Dumps</option>
              <option value="digs">Digs</option>
              <option value="serveErrors">Serve Errors</option>
              <option value="spikeErrors">Spike Errors</option>
              <option value="netTouches">Net Touches</option>
            </select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredAndSortedPlayers.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BarChart className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-900">{Object.keys(matches).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Points/Player</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredAndSortedPlayers.length > 0 
                      ? Math.round(filteredAndSortedPlayers.reduce((sum, p) => sum + calculateTotalEarned(p.totalStats), 0) / filteredAndSortedPlayers.length)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Players</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredAndSortedPlayers.filter(p => p.matchCount > 0).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <Bar data={chartData} options={chartOptions} />
          </div>

          {/* Players List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Player Statistics</h2>
              <p className="text-sm text-gray-600">
                Showing {filteredAndSortedPlayers.length} players sorted by {sortBy}
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredAndSortedPlayers.map((playerData) => {
                const totalEarned = calculateTotalEarned(playerData.totalStats);
                const totalFaults = calculateTotalFaults(playerData.totalStats);
                const isExpanded = expandedPlayers[playerData.id];

                return (
                  <div key={playerData.id} className="p-6">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpanded(playerData.id)}>
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-lg">
                              {playerData.player.jerseyNumber || '#'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{playerData.player.name}</h3>
                          <p className="text-sm text-gray-500">
                            {playerData.player.jerseyName || 'No jersey name'} • {playerData.matchCount} matches
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Points: {totalEarned}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Faults: {totalFaults}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Net Score: {totalEarned - totalFaults}
                          </p>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pl-16">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          <SimpleStatCard
                            title="Aces"
                            value={playerData.totalStats.aces || 0}
                            bgColor="bg-green-500"
                            emoji="🔥"
                          />
                          <SimpleStatCard
                            title="Spikes"
                            value={playerData.totalStats.spikes || 0}
                            bgColor="bg-green-500"
                            emoji="💥"
                          />
                          <SimpleStatCard
                            title="Blocks"
                            value={playerData.totalStats.blocks || 0}
                            bgColor="bg-green-500"
                            emoji="🧱"
                          />
                          <SimpleStatCard
                            title="Tips"
                            value={playerData.totalStats.tips || 0}
                            bgColor="bg-green-500"
                            emoji="👆"
                          />
                          <SimpleStatCard
                            title="Dumps"
                            value={playerData.totalStats.dumps || 0}
                            bgColor="bg-green-500"
                            emoji="🧮"
                          />
                          <SimpleStatCard
                            title="Digs"
                            value={playerData.totalStats.digs || 0}
                            bgColor="bg-blue-500"
                            emoji="🛡️"
                          />
                          <SimpleStatCard
                            title="Serve Errors"
                            value={playerData.totalStats.serveErrors || 0}
                            bgColor="bg-red-500"
                            emoji="❌"
                          />
                          <SimpleStatCard
                            title="Spike Errors"
                            value={playerData.totalStats.spikeErrors || 0}
                            bgColor="bg-red-500"
                            emoji="❌"
                          />
                          <SimpleStatCard
                            title="Net Touches"
                            value={playerData.totalStats.netTouches || 0}
                            bgColor="bg-red-500"
                            emoji="🔗"
                          />
                          <SimpleStatCard
                            title="Foot Faults"
                            value={playerData.totalStats.footFaults || 0}
                            bgColor="bg-red-500"
                            emoji="👣"
                          />
                          <SimpleStatCard
                            title="Reaches"
                            value={playerData.totalStats.reaches || 0}
                            bgColor="bg-red-500"
                            emoji="🙋"
                          />
                          <SimpleStatCard
                            title="Carries"
                            value={playerData.totalStats.carries || 0}
                            bgColor="bg-red-500"
                            emoji="🤲"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlayerStatsPage;