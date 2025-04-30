import { useState, useEffect } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { updatePlayerStat, listenToPlayerStats, createEmptyPlayerStats, getTeamById } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Award } from 'lucide-react';

interface PlayerStatActionsProps {
  player: Player;
  playerId: string;
  matchId: string;
  teamId?: string;
  isSelected: boolean;
  onSelect: () => void;
}

// Helper to calculate total points earned
const getTotalPointsContribution = (stats: PlayerStats): number => {
  const earned = stats.aces + stats.spikes + stats.blocks;
  return earned;
};

// Helper to calculate total faults
const getTotalFaults = (stats: PlayerStats): number => {
  return stats.serveErrors + stats.spikeErrors + stats.netTouches + stats.footFaults + stats.carries;
};

const PlayerStatActions = ({ player, playerId, matchId, teamId, isSelected, onSelect }: PlayerStatActionsProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [teamColor, setTeamColor] = useState<string | null>(null);
  
  useEffect(() => {
    if (!matchId || !playerId) return;
    
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
  
  const totalPoints = getTotalPointsContribution(stats);
  const totalFaults = getTotalFaults(stats);
  
  // Get text color based on background color
  const getTextColor = (hexColor: string): string => {
    const color = hexColor.replace('#', '');
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'text-black' : 'text-white';
  };
  
  return (
    <div 
      className={`w-full cursor-pointer rounded-lg p-2 transition-colors ${
        isSelected 
          ? 'border-2 border-[hsl(var(--vb-blue))]' 
          : 'border border-gray-200 hover:bg-gray-50'
      }`}
      style={teamColor && !isSelected ? { backgroundColor: teamColor + '30' } : {}} 
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {teamColor && (
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: teamColor }}
            />
          )}
          <h4 
            className={`font-semibold text-sm ${teamColor && !isSelected ? getTextColor(teamColor) : 'text-[hsl(var(--vb-blue))]'}`}
            style={isSelected && teamColor ? { color: teamColor } : {}}
          >
            {player.name}
          </h4>
        </div>
        
        {/* Show points and faults if player has stats */}
        {(totalPoints > 0 || totalFaults > 0) && (
          <div className="flex items-center space-x-1">
            {totalPoints > 0 && (
              <span className="text-xs font-semibold text-green-600">
                +{totalPoints}
              </span>
            )}
            {totalFaults > 0 && (
              <span className="text-xs font-semibold text-red-600 ml-1">
                -{totalFaults}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

const ActionButton = ({ label, onClick, className = "btn-neutral" }: ActionButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const handleClick = () => {
    setIsActive(true);
    
    // Call the provided onClick handler
    onClick();
    
    // Show success indicator
    setShowSuccess(true);
    
    // Reset after a delay
    setTimeout(() => {
      setIsActive(false);
      setShowSuccess(false);
    }, 1000);
  };
  
  return (
    <button 
      className={`${className} w-full text-center py-2 px-3 relative ${isActive ? 'ring-2 ring-white ring-opacity-50' : ''}`}
      onClick={handleClick}
      disabled={isActive}
    >
      {showSuccess && (
        <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded">
          <CheckCircle2 className="h-5 w-5 text-white" />
        </span>
      )}
      {label}
    </button>
  );
};

interface ActionCategoryProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

const ActionCategory = ({ title, className = "bg-gray-100", children }: ActionCategoryProps) => (
  <div className="mb-4">
    <h4 className={`${className} text-center font-semibold py-2 rounded-t-lg`}>{title}</h4>
    <div className="grid grid-cols-3 gap-2 border border-t-0 border-gray-200 p-3 rounded-b-lg">
      {children}
    </div>
  </div>
);

interface StatActionsProps {
  matchId: string;
  selectedPlayerId: string | null;
}

export const StatActions = ({ matchId, selectedPlayerId }: StatActionsProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!selectedPlayerId) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        Select a player to track stats
      </div>
    );
  }

  const handleStatUpdate = (statName: keyof PlayerStats, label: string, category: 'earned' | 'fault' = 'earned') => {
    if (!selectedPlayerId || !matchId) return;
    
    // Set loading state
    setIsUpdating(true);
    
    // Update the stat with category to properly handle scoring
    updatePlayerStat(matchId, selectedPlayerId, statName, 1, category)
      .then(() => {
        // Show success toast
        toast({
          title: "Stat Recorded",
          description: `${label} stat updated successfully`,
          variant: "default",
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: "Failed to update stat",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsUpdating(false);
      });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
      {isUpdating && (
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      
      <ActionCategory title="Earned" className="bg-[hsl(var(--vb-success))] text-white">
        <ActionButton 
          label="Ace" 
          onClick={() => handleStatUpdate('aces', 'Ace', 'earned')} 
          className="btn-success"
        />
        <ActionButton 
          label="Kill" 
          onClick={() => handleStatUpdate('spikes', 'Kill', 'earned')} 
          className="btn-success"
        />
        <ActionButton 
          label="Tip" 
          onClick={() => handleStatUpdate('tips', 'Tip', 'earned')} 
          className="btn-success"
        />
        <ActionButton 
          label="Dump" 
          onClick={() => handleStatUpdate('dumps', 'Dump', 'earned')} 
          className="btn-success"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks', 'Block', 'earned')} 
          className="btn-success"
        />
        <ActionButton 
          label="Dig" 
          onClick={() => handleStatUpdate('digs', 'Dig', 'earned')} 
          className="btn-success"
        />
      </ActionCategory>
      
      <ActionCategory title="Fault" className="bg-[hsl(var(--vb-error))] text-white">
        <ActionButton 
          label="Serve" 
          onClick={() => handleStatUpdate('serveErrors', 'Serve Fault', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikeErrors', 'Spike Fault', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Net Touch" 
          onClick={() => handleStatUpdate('netTouches', 'Net Touch', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Foot Fault" 
          onClick={() => handleStatUpdate('footFaults', 'Foot Fault', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Reach" 
          onClick={() => handleStatUpdate('reaches', 'Reach', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Carry" 
          onClick={() => handleStatUpdate('carries', 'Carry', 'fault')} 
          className="btn-error"
        />
      </ActionCategory>
    </div>
  );
};

export default PlayerStatActions;