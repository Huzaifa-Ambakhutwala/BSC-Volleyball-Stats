import { useState, useEffect } from 'react';
import type { Player, PlayerStats, Team } from '@shared/schema';
import { updatePlayerStat, listenToPlayerStats, createEmptyPlayerStats, getTeamById } from '@/lib/firebase';

interface PlayerStatCardProps {
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

const PlayerStatCard = ({ player, playerId, matchId, teamId }: PlayerStatCardProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [teamColor, setTeamColor] = useState<string>('#3B82F6'); // Default blue
  const [pendingStat, setPendingStat] = useState<{ statName: keyof PlayerStats, element: HTMLButtonElement | null } | null>(null);
  
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
  
  const handleStatButtonClick = (statName: keyof PlayerStats, e: React.MouseEvent<HTMLButtonElement>) => {
    if (pendingStat && pendingStat.statName === statName) {
      // Confirm the stat and update
      updatePlayerStat(matchId, playerId, statName, 1);
      pendingStat.element?.classList.remove('ring-2', 'ring-white', 'ring-opacity-50');
      setPendingStat(null);
    } else {
      // First click, show pending state
      if (pendingStat) {
        pendingStat.element?.classList.remove('ring-2', 'ring-white', 'ring-opacity-50');
      }
      e.currentTarget.classList.add('ring-2', 'ring-white', 'ring-opacity-50');
      setPendingStat({ statName, element: e.currentTarget });
    }
  };
  
  // Calculate total stats
  const totalEarnedPoints = stats.aces + stats.spikes + stats.blocks;
  const totalFaults = stats.serveErrors + stats.spikeErrors + stats.netTouches + stats.footFaults + stats.carries;
  const totalNeutralPlays = stats.digs + stats.tips + stats.dumps + stats.reaches;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div 
        className="px-4 py-3 border-b border-gray-200 flex items-center justify-between"
        style={{ backgroundColor: teamColor, color: parseInt(teamColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
      >
        <h4 className="font-semibold">{player.name}</h4>
        <div className="flex space-x-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500 bg-opacity-90 text-white">{totalEarnedPoints}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 bg-opacity-90 text-white">{totalFaults}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-400 bg-opacity-90 text-white">{totalNeutralPlays}</span>
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
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="text-sm text-gray-600">Aces: <span className="font-semibold">{stats.aces}</span></div>
          <div className="text-sm text-gray-600">Blocks: <span className="font-semibold">{stats.blocks}</span></div>
          <div className="text-sm text-gray-600">Kills: <span className="font-semibold">{stats.spikes}</span></div>
          <div className="text-sm text-gray-600">Digs: <span className="font-semibold">{stats.digs}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Grey Action Buttons */}
          <button 
            className="btn-neutral"
            onClick={(e) => handleStatButtonClick('digs', e)}
          >
            Dig
          </button>
          <button 
            className="btn-neutral"
            onClick={(e) => handleStatButtonClick('dumps', e)}
          >
            Regular Serve
          </button>
          
          {/* Green Action Buttons */}
          <button 
            className="btn-success"
            onClick={(e) => handleStatButtonClick('aces', e)}
          >
            Ace
          </button>
          <button 
            className="btn-success"
            onClick={(e) => handleStatButtonClick('spikes', e)}
          >
            Kill
          </button>
          
          {/* Yellow Action Buttons */}
          <button 
            className="btn-warning"
            onClick={(e) => handleStatButtonClick('tips', e)}
          >
            Overpass
          </button>
          <button 
            className="btn-warning"
            onClick={(e) => handleStatButtonClick('netTouches', e)}
          >
            Net Violation
          </button>
          
          {/* Red Action Buttons */}
          <button 
            className="btn-error"
            onClick={(e) => handleStatButtonClick('footFaults', e)}
          >
            Foot Fault
          </button>
          <button 
            className="btn-error"
            onClick={(e) => handleStatButtonClick('serveErrors', e)}
          >
            Service Error
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatCard;
