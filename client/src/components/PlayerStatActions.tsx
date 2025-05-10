import { useState, useEffect } from 'react';
import type { Player, PlayerStats, Match } from '@shared/schema';
import { 
  updatePlayerStat, 
  listenToPlayerStats, 
  createEmptyPlayerStats, 
  getTeamById,
  listenToMatchById,
  isSetLocked as checkIsSetLocked
} from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Award } from 'lucide-react';

interface PlayerStatActionsProps {
  player: Player;
  playerId: string;
  matchId: string;
  teamId?: string;
  isSelected: boolean;
  onSelect: () => void;
  currentSet?: number; // Which set to record stats for
}

// Helper to calculate total points earned - includes all point-earning stats
const getTotalPointsContribution = (stats: PlayerStats): number => {
  const earned = stats.aces + stats.spikes + stats.blocks + stats.tips + 
    stats.dumps + (stats.points || 0);
  return earned;
};

// Helper to calculate total faults - includes all fault types
const getTotalFaults = (stats: PlayerStats): number => {
  return stats.serveErrors + stats.spikeErrors + stats.netTouches + 
    stats.footFaults + stats.carries + stats.reaches + 
    (stats.outOfBounds || 0) + (stats.faults || 0);
};

const PlayerStatActions = ({ player, playerId, matchId, teamId, isSelected, onSelect, currentSet = 1 }: PlayerStatActionsProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [teamColor, setTeamColor] = useState<string | null>(null);
  
  useEffect(() => {
    if (!matchId || !playerId) return;
    
    // Initialize with empty stats for the current set
    setStats(createEmptyPlayerStats(currentSet));
    
    const unsubscribe = listenToPlayerStats(matchId, playerId, (playerStats) => {
      // Check if stats are for the current set or if set info is missing
      const statsSet = playerStats.set || 1;
      if (statsSet === currentSet) {
        setStats(playerStats);
      } else {
        // If stats are for a different set, initialize with empty stats
        setStats(createEmptyPlayerStats(currentSet));
      }
    });
    
    return () => unsubscribe();
  }, [matchId, playerId, currentSet]);
  
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
  disabled?: boolean; // Add disabled prop
}

const ActionButton = ({ label, onClick, className = "btn-neutral", disabled = false }: ActionButtonProps) => {
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
  currentSet?: number;
}

export const StatActions = ({ matchId, selectedPlayerId, currentSet: propCurrentSet }: StatActionsProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [blockType, setBlockType] = useState<'point' | 'neutral'>('point');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isSetLocked, setIsSetLocked] = useState<boolean>(false);

  // Use prop current set if provided, otherwise get from match data
  // Check for match state and set locking
  useEffect(() => {
    // If we have a prop value for the current set, use that
    if (propCurrentSet !== undefined) {
      setCurrentSet(propCurrentSet);
    }
    
    // Always listen to the match for current state and set locking
    if (!matchId) return;
    
    const unsubscribe = listenToMatchById(matchId, (match: Match | null) => {
      setCurrentMatch(match);
      
      if (match) {
        // Check if the set is locked
        if (propCurrentSet !== undefined) {
          // For specific set provided through props
          setIsSetLocked(checkIsSetLocked(match, propCurrentSet));
        } else if (match.currentSet) {
          // For automatic set from match
          setCurrentSet(match.currentSet);
          setIsSetLocked(checkIsSetLocked(match, match.currentSet));
        }
        
        // If match is completed, disable all actions
        if (match.status === 'completed') {
          setIsSetLocked(true);
        }
      }
    });
    
    return () => unsubscribe();
  }, [matchId, propCurrentSet]);

  if (!selectedPlayerId) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        Select a player to track stats
      </div>
    );
  }
  
  // Display which set is being tracked
  const setDisplay = currentSet ? `Set ${currentSet}` : "Unknown Set";

  const handleStatUpdate = (statName: keyof PlayerStats, label: string, category: 'earned' | 'fault' | 'neutral' = 'earned') => {
    if (!selectedPlayerId || !matchId) return;
    
    // Set loading state
    setIsUpdating(true);
    
    // Special handling for blocks based on selected type
    if (statName === 'blocks' && blockType === 'neutral') {
      statName = 'neutralBlocks' as keyof PlayerStats;
      label = 'Neutral Block';
      category = 'neutral'; // Change to neutral category - counted but doesn't affect score
    }
    
    // Update the stat with category to properly handle scoring, and include current set
    updatePlayerStat(matchId, selectedPlayerId, statName, 1, category, currentSet)
      .then(() => {
        // Show success toast
        toast({
          title: "Stat Recorded",
          description: `${label} stat updated successfully (Set ${currentSet})`,
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
      
      {/* Set indicator banner */}
      <div className="mb-4">
        <div className="bg-blue-600 text-white text-center py-2 rounded-t-lg font-semibold">
          Recording Stats for {setDisplay}
        </div>
        
        <div className="border border-gray-200 border-t-0 rounded-b-lg p-3 bg-gray-50 flex flex-col">
          <span className="text-sm text-gray-600 mb-2 text-center">Change Current Set</span>
          <div className="flex justify-center space-x-3">
            {[1, 2, 3].map((setNum) => (
              <button
                key={setNum}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentSet === setNum 
                  ? 'bg-[hsl(var(--vb-blue))] text-white border-2 border-blue-700 shadow-md'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                }`}
                onClick={() => setCurrentSet(setNum)}
              >
                {setNum}
              </button>
            ))}
          </div>
        </div>
      </div>
      
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
          label="Point" 
          onClick={() => handleStatUpdate('points', 'Generic Point', 'earned')} 
          className="btn-success"
        />
        <ActionButton 
          label="Dig" 
          onClick={() => handleStatUpdate('digs', 'Dig', 'earned')} 
          className="btn-success"
        />
      </ActionCategory>
      
      {/* Block tracking with more specific options */}
      <div className="mb-4">
        <h4 className="bg-[hsl(var(--vb-success))] text-white text-center font-semibold py-2 rounded-t-lg">Block</h4>
        <div className="border border-t-0 border-gray-200 p-3 rounded-b-lg">
          <div className="grid grid-cols-1 gap-2 mb-2">
            <div className="flex justify-center space-x-2">
              <button
                className={`px-3 py-1 rounded-md ${
                  blockType === 'point'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setBlockType('point')}
              >
                Point Block
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  blockType === 'neutral'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setBlockType('neutral')}
              >
                Neutral Block
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <ActionButton 
              label={blockType === 'point' ? "Block (Point)" : "Block (Touch Only)"}
              onClick={() => handleStatUpdate('blocks', blockType === 'point' ? 'Block Point' : 'Neutral Block', 'earned')} 
              className={blockType === 'point' ? "btn-success" : "bg-blue-500 text-white hover:bg-blue-600"}
            />
          </div>
        </div>
      </div>
      
      <ActionCategory title="Fault" className="bg-[hsl(var(--vb-error))] text-white">
        <ActionButton 
          label="Serve Error" 
          onClick={() => handleStatUpdate('serveErrors', 'Serve Fault', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Spike Error" 
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
        <ActionButton 
          label="Out of Bounds" 
          onClick={() => handleStatUpdate('outOfBounds', 'Out of Bounds', 'fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Generic Fault" 
          onClick={() => handleStatUpdate('faults', 'Generic Fault', 'fault')} 
          className="btn-error"
        />
      </ActionCategory>
    </div>
  );
};

export default PlayerStatActions;