import { useState, useEffect } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { 
  listenToPlayerStats, 
  createEmptyPlayerStats, 
  getTeamById, 
  listenToStatLogs,
  type StatLog 
} from '@/lib/firebase';

interface ScoreboardPlayerCardProps {
  player: Player;
  playerId: string;
  matchId: string;
  teamId?: string;
  stats?: PlayerStats; // Allow passing stats directly
  currentSet?: number; // Which set to display stats for
}

// Helper function to get emoji for stat type
const getStatEmoji = (statName: keyof PlayerStats): string => {
  const emojiMap: Partial<Record<keyof PlayerStats, string>> = {
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
    carries: '🤲',
    points: '⭐',
    outOfBounds: '🚫',
    faults: '⛔',
    neutralBlocks: '🧱'
  };
  return emojiMap[statName] || '📊';
};

// Helper function for stat category color
const getStatCategoryColor = (statName: keyof PlayerStats): string => {
  // Earned points - Green
  if (['aces', 'spikes', 'blocks', 'tips', 'dumps', 'digs', 'points'].includes(statName)) {
    return 'bg-green-500';
  }
  // Neutral - Blue
  else if (['neutralBlocks'].includes(statName)) {
    return 'bg-blue-500';
  }
  // Faults - Red
  else if (['serveErrors', 'spikeErrors', 'netTouches', 'footFaults', 'reaches', 'carries', 'outOfBounds', 'faults'].includes(statName)) {
    return 'bg-red-500';
  }
  // Other stats - Gray (set number, etc.)
  else {
    return 'bg-gray-500';
  }
};

// Helper function to calculate stats from logs
const calculateStatsFromLogs = (logs: StatLog[], playerId: string, setNumber?: number): PlayerStats => {
  // Initialize empty stats with proper set number
  const calculatedStats = createEmptyPlayerStats(setNumber);
  
  // Filter logs for this player and optionally for specific set
  logs
    .filter(log => log.playerId === playerId)
    .filter(log => setNumber ? log.set === setNumber : true) // Only include logs from specific set if setNumber provided
    .forEach(log => {
      const statName = log.statName as keyof PlayerStats;
      calculatedStats[statName] = (calculatedStats[statName] || 0) + log.value;
    });
  
  return calculatedStats;
};

const ScoreboardPlayerCard = ({ player, playerId, matchId, teamId, stats: propStats, currentSet }: ScoreboardPlayerCardProps) => {
  const [statsFromAPI, setStatsFromAPI] = useState<PlayerStats>(createEmptyPlayerStats());
  const [statsFromLogs, setStatsFromLogs] = useState<PlayerStats>(createEmptyPlayerStats());
  const [teamColor, setTeamColor] = useState<string>('#3B82F6'); // Default blue
  const [isLoading, setIsLoading] = useState(true);
  
  // Use props stats if provided, otherwise use best available calculated stats
  const stats = propStats || statsFromLogs || statsFromAPI;
  
  // Set up listener for stat logs - this is the most reliable source
  useEffect(() => {
    if (!matchId) return;
    
    console.log(`[ScoreboardCard] Setting up stat logs listener for player ${playerId} in match ${matchId}`);
    setIsLoading(true);
    
    const unsubscribe = listenToStatLogs(matchId, (logs) => {
      if (logs.length > 0) {
        const playerLogs = logs.filter(log => log.playerId === playerId);
        console.log(`[ScoreboardCard] Found ${playerLogs.length} logs for player ${playerId}`);
        
        // Calculate stats from logs, filtering by current set if specified
        const calculated = calculateStatsFromLogs(logs, playerId, currentSet);
        setStatsFromLogs(calculated);
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [matchId, playerId, currentSet]);
  
  // Fallback to direct stats API
  useEffect(() => {
    if (propStats || !matchId || !playerId) return; // Skip if stats provided as props
    
    console.log(`[ScoreboardCard] Setting up player stats API listener as fallback (set: ${currentSet || 'all'})`);
    
    // Initialize with empty stats for the current set
    if (currentSet) {
      setStatsFromAPI(createEmptyPlayerStats(currentSet));
    }
    
    const unsubscribe = listenToPlayerStats(matchId, playerId, (playerStats) => {
      console.log(`[ScoreboardCard] Received direct stats for player ${playerId}:`, playerStats);
      
      // If currentSet is specified, only show stats for that set
      if (currentSet) {
        const statsSet = playerStats.set || 1;
        if (statsSet === currentSet) {
          setStatsFromAPI(playerStats);
        }
      } else {
        // If no currentSet specified, show all stats
        setStatsFromAPI(playerStats);
      }
    });
    
    return () => unsubscribe();
  }, [matchId, playerId, propStats, currentSet]);
  
  // Load team color if teamId is provided
  useEffect(() => {
    if (teamId) {
      getTeamById(teamId).then(team => {
        if (team && team.teamColor) {
          setTeamColor(team.teamColor);
        }
      });
    }
  }, [teamId]);
  
  // Calculate total stats - only count earned points and faults, no neutral
  const totalEarnedPoints = (stats.aces || 0) + (stats.spikes || 0) + (stats.blocks || 0) + 
    (stats.tips || 0) + (stats.dumps || 0) + (stats.digs || 0) + (stats.points || 0);
  const totalFaults = (stats.serveErrors || 0) + (stats.spikeErrors || 0) + 
    (stats.netTouches || 0) + (stats.footFaults || 0) + (stats.carries || 0) + 
    (stats.reaches || 0) + (stats.outOfBounds || 0) + (stats.faults || 0);
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div 
        className="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
        style={{ backgroundColor: teamColor, color: parseInt(teamColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
      >
        <div className="flex items-center">
          <h4 className="font-semibold">{player.name}</h4>
          {currentSet && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-700 bg-opacity-25 text-white">
              Set {currentSet}
            </span>
          )}
        </div>
        <div className="flex space-x-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 bg-opacity-90 text-white">+{totalEarnedPoints}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 bg-opacity-90 text-white">-{totalFaults}</span>
        </div>
      </div>
      <div className="p-4">
        {isLoading ? (
          // Loading state
          <div className="flex flex-col items-center justify-center py-4">
            <div className="h-4 w-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-500">Loading stats...</p>
          </div>
        ) : totalEarnedPoints === 0 && totalFaults === 0 ? (
          // No stats state
          <div className="text-center py-3">
            <p className="text-sm text-gray-500">No stats recorded yet</p>
          </div>
        ) : (
          // Stats display
          <>
            {/* Stat circles display */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(stats).map(([key, value]) => {
                if (value > 0) {
                  const statName = key as keyof PlayerStats;
                  return (
                    <div 
                      key={key} 
                      className={`flex items-center justify-center rounded-full w-8 h-8 text-white ${getStatCategoryColor(statName)}`}
                      title={`${statName}: ${value}`}
                    >
                      <span className="text-xs">{getStatEmoji(statName)}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            
            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-gray-600">Aces: <span className="font-semibold">{stats.aces || 0}</span></div>
              <div className="text-sm text-gray-600">Blocks: <span className="font-semibold">{stats.blocks || 0}</span></div>
              <div className="text-sm text-gray-600">Kills: <span className="font-semibold">{stats.spikes || 0}</span></div>
              <div className="text-sm text-gray-600">Digs: <span className="font-semibold">{stats.digs || 0}</span></div>
              <div className="text-sm text-gray-600">Tips: <span className="font-semibold">{stats.tips || 0}</span></div>
              <div className="text-sm text-gray-600">Errors: <span className="font-semibold">{totalFaults}</span></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScoreboardPlayerCard;