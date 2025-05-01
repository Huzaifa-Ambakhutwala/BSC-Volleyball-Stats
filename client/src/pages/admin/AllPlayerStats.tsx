import { useState, useEffect } from 'react';
import { getPlayers, getMatches, getMatchStats } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import ScoreboardStatCard from '@/components/ScoreboardStatCard';

type PlayerWithTotalStats = {
  player: Player;
  id: string;
  totalStats: PlayerStats;
  matchCount: number;
};

const AllPlayerStats = () => {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [playersWithStats, setPlayersWithStats] = useState<PlayerWithTotalStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<keyof PlayerStats | 'totalEarned' | 'totalFaults'>('totalEarned');
  const [searchQuery, setSearchQuery] = useState('');

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
          carries: 0
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
      stats.reaches
    );
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
          {filteredPlayers.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg bg-white p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{item.player.name}</h4>
                <div className="text-sm text-gray-500">{item.matchCount} matches</div>
              </div>
              
              <div className="flex space-x-2 mb-3">
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
                  Points: {calculateTotalEarnedPoints(item.totalStats)}
                </div>
                <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                  Faults: {calculateTotalFaults(item.totalStats)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Aces: <span className="font-semibold">{item.totalStats.aces}</span></div>
                <div>Kills: <span className="font-semibold">{item.totalStats.spikes}</span></div>
                <div>Blocks: <span className="font-semibold">{item.totalStats.blocks}</span></div>
                <div>Tips: <span className="font-semibold">{item.totalStats.tips}</span></div>
                <div>Digs: <span className="font-semibold">{item.totalStats.digs}</span></div>
                <div>Errors: <span className="font-semibold">{calculateTotalFaults(item.totalStats)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPlayerStats;