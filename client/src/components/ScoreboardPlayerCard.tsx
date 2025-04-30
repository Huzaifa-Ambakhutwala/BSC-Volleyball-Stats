import { useState, useEffect } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { listenToPlayerStats, createEmptyPlayerStats, getTeamById } from '@/lib/firebase';

interface ScoreboardPlayerCardProps {
  player: Player;
  playerId: string;
  matchId: string;
  teamId?: string;
}

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
  // Faults - Red
  else {
    return 'bg-red-500';
  }
};

const ScoreboardPlayerCard = ({ player, playerId, matchId, teamId }: ScoreboardPlayerCardProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [teamColor, setTeamColor] = useState<string>('#3B82F6'); // Default blue
  
  useEffect(() => {
    const unsubscribe = listenToPlayerStats(matchId, playerId, (playerStats) => {
      setStats(playerStats);
    });
    
    return () => unsubscribe();
  }, [matchId, playerId]);
  
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
  const totalEarnedPoints = stats.aces + stats.spikes + stats.blocks + stats.tips + stats.dumps;
  const totalFaults = stats.serveErrors + stats.spikeErrors + stats.netTouches + stats.footFaults + stats.carries;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div 
        className="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
        style={{ backgroundColor: teamColor, color: parseInt(teamColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
      >
        <h4 className="font-semibold">{player.name}</h4>
        <div className="flex space-x-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 bg-opacity-90 text-white">+{totalEarnedPoints}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 bg-opacity-90 text-white">-{totalFaults}</span>
        </div>
      </div>
      <div className="p-4">
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
          <div className="text-sm text-gray-600">Aces: <span className="font-semibold">{stats.aces}</span></div>
          <div className="text-sm text-gray-600">Blocks: <span className="font-semibold">{stats.blocks}</span></div>
          <div className="text-sm text-gray-600">Kills: <span className="font-semibold">{stats.spikes}</span></div>
          <div className="text-sm text-gray-600">Digs: <span className="font-semibold">{stats.digs}</span></div>
          <div className="text-sm text-gray-600">Tips: <span className="font-semibold">{stats.tips}</span></div>
          <div className="text-sm text-gray-600">Errors: <span className="font-semibold">{totalFaults}</span></div>
        </div>
      </div>
    </div>
  );
};

export default ScoreboardPlayerCard;