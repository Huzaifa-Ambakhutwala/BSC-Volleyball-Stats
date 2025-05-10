import { useState, useEffect } from 'react';
import { getPlayers, getMatches, getMatchStats } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import ScoreboardStatCard from '@/components/ScoreboardStatCard';
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

const AllPlayerStats = () => {
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersData, matchesData] = await Promise.all([
          getPlayers(),
          getMatches()
        ]);
        
        setPlayers(playersData);
        setMatches(matchesData);
        
        // Process players' stats across all matches
        await processAllPlayerStats(playersData, matchesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load player statistics",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  const processAllPlayerStats = async (
    playersData: Record<string, Player>, 
    matchesData: Record<string, Match>
  ) => {
    const playerStatsMap = new Map<string, {
      stats: PlayerStats, 
      matchCount: number
    }>();
    
    // Initialize empty stats for all players
    Object.keys(playersData).forEach(playerId => {
      playerStatsMap.set(playerId, {
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
    
    // For each match, get player stats and add to totals
    for (const matchId of Object.keys(matchesData)) {
      try {
        const matchStats = await getMatchStats(matchId);
        
        // Add stats for each player in this match
        Object.entries(matchStats).forEach(([playerId, stats]) => {
          const playerData = playerStatsMap.get(playerId);
          
          if (playerData) {
            const updatedStats = { ...playerData.stats };
            
            // Add all stats
            Object.keys(stats).forEach(key => {
              const statKey = key as keyof PlayerStats;
              updatedStats[statKey] += stats[statKey] || 0;
            });
            
            // Update player data with new stats and increment match count
            playerStatsMap.set(playerId, {
              stats: updatedStats,
              matchCount: playerData.matchCount + 1
            });
          }
        });
      } catch (error) {
        console.error(`Error fetching stats for match ${matchId}:`, error);
        // Continue with other matches even if one fails
      }
    }
    
    // Convert map to array for easier rendering
    const playersWithStatsArray = Array.from(playerStatsMap.entries()).map(([playerId, data]) => ({
      player: playersData[playerId],
      id: playerId,
      totalStats: data.stats,
      matchCount: data.matchCount
    }))
    // Filter out players with no matches
    .filter(item => item.matchCount > 0);
    
    setPlayersWithStats(playersWithStatsArray);
  };
  
  const calculateTotalEarnedPoints = (stats: PlayerStats): number => {
    return (
      stats.aces + 
      stats.spikes + 
      stats.blocks + 
      stats.tips + 
      stats.dumps +
      stats.digs
    );
  };
  
  const calculateTotalFaults = (stats: PlayerStats): number => {
    return (
      stats.serveErrors + 
      stats.spikeErrors + 
      stats.netTouches + 
      stats.footFaults + 
      stats.carries +
      stats.reaches +
      (stats.outOfBounds || 0) +
      (stats.faults || 0)
    );
  };
  
  // Calculate average stats per match
  const calculateAverageStats = (stats: PlayerStats, matchCount: number): Partial<PlayerStats> => {
    if (!matchCount || matchCount === 0) return stats;
    
    const avgStats: Partial<PlayerStats> = {};
    Object.entries(stats).forEach(([key, value]) => {
      if (typeof value === 'number') {
        avgStats[key as keyof PlayerStats] = Number((value / matchCount).toFixed(1));
      }
    });
    
    return avgStats;
  };
  
  // Prepare data for bar chart
  const prepareBarChartData = (stats: PlayerStats) => {
    return {
      labels: ['Aces', 'Spikes', 'Blocks', 'Tips', 'Digs', 'Errors'],
      datasets: [
        {
          label: 'Performance',
          data: [
            stats.aces || 0,
            stats.spikes || 0,
            stats.blocks || 0,
            stats.tips || 0,
            stats.digs || 0,
            calculateTotalFaults(stats)
          ],
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Prepare data for radar chart
  const prepareRadarChartData = (stats: PlayerStats) => {
    const totalPoints = calculateTotalEarnedPoints(stats);
    const totalFaults = calculateTotalFaults(stats);
    
    // Normalize values between 0-100 for better visualization
    const normalize = (value: number, max: number) => max ? Math.min(Math.round((value / max) * 100), 100) : 0;
    
    const maxStat = Math.max(
      stats.aces || 0,
      stats.spikes || 0, 
      stats.blocks || 0,
      stats.digs || 0,
      stats.tips || 0,
      totalFaults
    );
    
    return {
      labels: ['Serving', 'Attacking', 'Blocking', 'Defense', 'Ball Control', 'Consistency'],
      datasets: [
        {
          label: 'Skill Breakdown',
          data: [
            normalize(stats.aces || 0, maxStat),
            normalize(stats.spikes || 0, maxStat),
            normalize(stats.blocks || 0, maxStat),
            normalize(stats.digs || 0, maxStat),
            normalize((stats.tips || 0) + (stats.dumps || 0), maxStat),
            100 - normalize(totalFaults, totalPoints + totalFaults)
          ],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }
      ]
    };
  };
  
  // Sort players based on selected criteria
  const sortedPlayers = [...playersWithStats].sort((a, b) => {
    if (sortBy === 'totalEarned') {
      return calculateTotalEarnedPoints(b.totalStats) - calculateTotalEarnedPoints(a.totalStats);
    } else if (sortBy === 'totalFaults') {
      return calculateTotalFaults(b.totalStats) - calculateTotalFaults(a.totalStats);
    } else {
      // Sort by specific stat
      return (b.totalStats[sortBy] || 0) - (a.totalStats[sortBy] || 0);
    }
  });
  
  // Filter players by search query
  const filteredPlayers = sortedPlayers.filter(item => 
    item.player?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">Loading player statistics...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">All Player Statistics</h3>
      
      {/* Search and Sort Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search player name..."
            className="w-full px-4 py-2 border border-gray-300 rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select 
            className="px-4 py-2 border border-gray-300 rounded"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="totalEarned">Sort by Total Points</option>
            <option value="totalFaults">Sort by Total Faults</option>
            <option value="aces">Sort by Aces</option>
            <option value="spikes">Sort by Kills</option>
            <option value="blocks">Sort by Blocks</option>
            <option value="tips">Sort by Tips</option>
            <option value="digs">Sort by Digs</option>
            <option value="serveErrors">Sort by Serve Errors</option>
            <option value="spikeErrors">Sort by Spike Errors</option>
          </select>
        </div>
      </div>
      
      {filteredPlayers.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p>No player statistics found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map(item => {
            const isExpanded = expandedPlayers[item.id] || false;
            const totalEarnedPoints = calculateTotalEarnedPoints(item.totalStats);
            const totalFaults = calculateTotalFaults(item.totalStats);
            const avgStats = calculateAverageStats(item.totalStats, item.matchCount);
            
            return (
              <div 
                key={item.id} 
                className={`border border-gray-200 rounded-lg bg-white overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'shadow-lg' : ''}`}
              >
                {/* Card Header - Always visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50" 
                  onClick={() => toggleExpanded(item.id)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-lg flex items-center">
                      {item.player.name}
                      {totalEarnedPoints > 15 && <Trophy className="h-4 w-4 ml-1 text-yellow-500" />}
                    </h4>
                    <div className="flex items-center">
                      <div className="text-sm text-gray-500 mr-2">{item.matchCount} matches</div>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mb-3">
                    <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                      Points: {totalEarnedPoints}
                    </div>
                    <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                      Faults: {totalFaults}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Aces: <span className="font-semibold">{item.totalStats.aces}</span></div>
                    <div>Kills: <span className="font-semibold">{item.totalStats.spikes}</span></div>
                    <div>Blocks: <span className="font-semibold">{item.totalStats.blocks}</span></div>
                    <div>Tips: <span className="font-semibold">{item.totalStats.tips}</span></div>
                    <div>Digs: <span className="font-semibold">{item.totalStats.digs}</span></div>
                    <div>Errors: <span className="font-semibold">{totalFaults}</span></div>
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-gray-200 animate-in fade-in slide-in-from-top duration-300">
                    {/* Tabs for different expanded views */}
                    <div className="space-y-6">
                      {/* Average Performance Section */}
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h5 className="font-semibold mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1 text-blue-500" />
                          Per Match Average
                        </h5>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>Aces: <span className="font-semibold">{avgStats.aces}</span></div>
                          <div>Kills: <span className="font-semibold">{avgStats.spikes}</span></div>
                          <div>Blocks: <span className="font-semibold">{avgStats.blocks}</span></div>
                          <div>Tips: <span className="font-semibold">{avgStats.tips}</span></div>
                          <div>Digs: <span className="font-semibold">{avgStats.digs}</span></div>
                          <div>Errors: <span className="font-semibold">{avgStats.serveErrors && avgStats.spikeErrors ? 
                            (avgStats.serveErrors + avgStats.spikeErrors).toFixed(1) : 0}</span></div>
                        </div>
                      </div>
                      
                      {/* Performance Charts */}
                      <div>
                        <h5 className="font-semibold mb-3 flex items-center">
                          <BarChart className="w-4 h-4 mr-1 text-blue-500" />
                          Performance Breakdown
                        </h5>
                        
                        <div className="space-y-4">
                          {/* Bar Chart */}
                          <div className="h-[150px]">
                            <Bar 
                              data={prepareBarChartData(item.totalStats)} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    display: false
                                  }
                                }
                              }}
                            />
                          </div>
                          
                          {/* Radar Chart */}
                          <div className="h-[200px] mt-4">
                            <Radar 
                              data={prepareRadarChartData(item.totalStats)}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  r: {
                                    angleLines: {
                                      display: true
                                    },
                                    suggestedMin: 0,
                                    suggestedMax: 100
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllPlayerStats;