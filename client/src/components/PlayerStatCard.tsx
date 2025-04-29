import { useState, useEffect } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { updatePlayerStat, listenToPlayerStats, createEmptyPlayerStats } from '@/lib/firebase';

interface PlayerStatCardProps {
  player: Player;
  playerId: string;
  matchId: string;
}

const PlayerStatCard = ({ player, playerId, matchId }: PlayerStatCardProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [pendingStat, setPendingStat] = useState<{ statName: keyof PlayerStats, element: HTMLButtonElement | null } | null>(null);
  
  useEffect(() => {
    const unsubscribe = listenToPlayerStats(matchId, playerId, (playerStats) => {
      setStats(playerStats);
    });
    
    return () => unsubscribe();
  }, [matchId, playerId]);
  
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
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="font-semibold">{player.name}</h4>
      </div>
      <div className="p-4">
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
