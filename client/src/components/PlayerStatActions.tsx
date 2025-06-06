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
import { calculateTotalPoints, calculateTotalFaults } from '@/lib/statCalculations';
import { getOptimizedTextStyle } from '@/lib/colorUtils';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, Award } from 'lucide-react';

interface PlayerStatActionsProps {
  player: Player;
  playerId: string;
  matchId: string;
  teamId?: string;
  teamColor?: string;
  isSelected: boolean;
  onSelect: () => void;
  currentSet?: number; // Which set to record stats for
}

// Note: Calculation functions moved to shared utility in /lib/statCalculations.ts

const PlayerStatActions = ({ player, playerId, matchId, teamId, teamColor: propTeamColor, isSelected, onSelect, currentSet = 1 }: PlayerStatActionsProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [fetchedTeamColor, setFetchedTeamColor] = useState<string | null>(null);

  // Use the prop team color if available, otherwise use the fetched one
  const teamColor = propTeamColor || fetchedTeamColor;

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

  // Load team color if teamId is provided and no prop color
  useEffect(() => {
    if (teamId && !propTeamColor) {
      getTeamById(teamId).then(team => {
        if (team && team.teamColor) {
          setFetchedTeamColor(team.teamColor);
        }
      });
    }
  }, [teamId, propTeamColor]);

  const totalPoints = calculateTotalPoints(stats);
  const totalFaults = calculateTotalFaults(stats);

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
      className={`w-full cursor-pointer rounded-lg p-3 transition-all duration-200 border-4 ${
        isSelected 
          ? 'shadow-2xl transform scale-105' 
          : 'hover:shadow-md border-2'
      }`}
      style={{
        ...(teamColor ? getOptimizedTextStyle(teamColor) : {}),
        backgroundColor: teamColor ? (getOptimizedTextStyle(teamColor).backgroundColor || teamColor) : '#f8f9fa',
        borderColor: isSelected ? '#FFD700' : teamColor || '#d1d5db',
        ...(isSelected && {
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        })
      }}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h4 className="font-bold text-lg tracking-wide">
            {player.jerseyNumber ? `${player.jerseyNumber} - ${player.jerseyName || ''}` : player.name}
          </h4>
          {player.jerseyNumber && player.jerseyName && (
            <p className={`text-xs -mt-1 ${teamColor ? getTextColor(teamColor) : 'text-gray-500'}`}>
              {player.name}
            </p>
          )}
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
  title?: string; // Add title prop for hover descriptions
}

const ActionButton = ({ label, onClick, className = "btn-neutral", disabled = false, title }: ActionButtonProps) => {
  const [isActive, setIsActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle button click with disabled state check
  const handleClick = () => {
    if (disabled) return;

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
      className={`${className} w-full text-center py-2 px-3 relative 
        ${isActive ? 'ring-2 ring-white ring-opacity-50' : ''} 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      disabled={isActive || disabled}
      title={title || label}
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

export interface StatActionsProps {
  matchId: string;
  selectedPlayerId: string | null;
  currentSet?: number;
  onStatEntered?: () => void;
}

export const StatActions = ({ matchId, selectedPlayerId, currentSet: propCurrentSet, onStatEntered }: StatActionsProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentSet, setCurrentSet] = useState<number>(1);
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

  const handleStatUpdate = async (statName: keyof PlayerStats, label: string, category: 'earned' | 'fault' | 'neutral' = 'earned') => {
    if (!selectedPlayerId || !matchId) return;

    // Set loading state
    setIsUpdating(true);

    // Block is now always an earned action

    try {
      // Update the stat with category to properly handle scoring, and include current set
      await updatePlayerStat(matchId, selectedPlayerId, statName, 1, category, currentSet);
      
      // Log the stat action to TrackerLogs
      try {
        const { logStatAction } = await import('@/lib/trackerLogger');
        const { get, ref, database } = await import('@/lib/firebase');
        
        // Get player name for logging
        const playerRef = ref(database, `players/${selectedPlayerId}`);
        const playerSnapshot = await get(playerRef);
        const player = playerSnapshot.val();
        
        if (player) {
          await logStatAction(
            label,
            'add',
            player.name,
            matchId,
            currentSet,
            selectedPlayerId
          );
        }
      } catch (logError) {
        console.error('Error logging stat action:', logError);
      }
      
      // Show success toast
      toast({
        title: "Stat Recorded",
        description: `${label} stat updated successfully (Set ${currentSet})`,
        variant: "default",
      });
      if (onStatEntered) onStatEntered();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stat",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
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
        <div className="bg-blue-600 text-white text-center py-2 rounded-lg font-semibold">
          Recording Stats for {setDisplay}
        </div>
      </div>

      {/* Set locked warning */}
      {isSetLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg mb-4 shadow-md">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-amber-600 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="font-bold text-lg text-amber-800">Set {currentSet} is Locked</span>
          </div>
          <p className="text-amber-700 ml-10">This set has been finalized and cannot be modified. To track stats for another set, please use the set switcher.</p>
        </div>
      )}

      {/* Earned Section */}
      <div className="mb-2 mt-4">
        <div className="text-lg font-bold text-left text-gray-700 border-l-4 border-green-500 pl-2 mb-2">Earned</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <ActionButton
            label="Ace"
            onClick={() => handleStatUpdate('aces', 'Ace', 'earned')}
            className="btn-success"
            disabled={isSetLocked}
            title="Service ace - ball served directly for a point"
          />
          <ActionButton
            label="Kill"
            onClick={() => handleStatUpdate('spikes', 'Kill', 'earned')}
            className="btn-success"
            disabled={isSetLocked}
            title="Attack kill - spike that results in a point"
          />
          <ActionButton
            label="Tip"
            onClick={() => handleStatUpdate('tips', 'Tip', 'earned')}
            className="btn-success"
            disabled={isSetLocked}
            title="Tip attack - soft attack that scores a point"
          />
          <ActionButton
            label="Dump"
            onClick={() => handleStatUpdate('dumps', 'Dump', 'earned')}
            className="btn-success"
            disabled={isSetLocked}
            title="Setter dump - setter attacks ball for a point"
          />
          <ActionButton
            label="Block"
            onClick={() => handleStatUpdate('blocks', 'Block', 'earned')}
            className="btn-success"
            disabled={isSetLocked}
            title="Block that wins the point directly"
          />
          <ActionButton
            label="Point"
            onClick={() => handleStatUpdate('points', 'Generic Point', 'earned')}
            className="btn-success"
            disabled={isSetLocked}
            title="Generic point - any other way to score a point"
          />
        </div>
      </div>



      {/* Fault Section */}
      <div className="mb-2 mt-4">
        <div className="text-lg font-bold text-left text-gray-700 border-l-4 border-red-500 pl-2 mb-2">Fault</div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <ActionButton
            label="Serve Error"
            onClick={() => handleStatUpdate('serveErrors', 'Serve Fault', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Service error - serve into net or out of bounds"
          />
          <ActionButton
            label="Spike Error"
            onClick={() => handleStatUpdate('spikeErrors', 'Spike Fault', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Attack error - spike into net or out of bounds"
          />
          <ActionButton
            label="Net Touch"
            onClick={() => handleStatUpdate('netTouches', 'Net Touch', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Net violation - player touches the net"
          />
          <ActionButton
            label="Foot Fault"
            onClick={() => handleStatUpdate('footFaults', 'Foot Fault', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Foot fault - stepping over the line when serving"
          />
          <ActionButton
            label="Reach"
            onClick={() => handleStatUpdate('reaches', 'Reach', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Reach violation - reaching over the net illegally"
          />
          <ActionButton
            label="Carry"
            onClick={() => handleStatUpdate('carries', 'Carry', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Ball handling error - lifting or carrying the ball"
          />
          <ActionButton
            label="Out of Bounds"
            onClick={() => handleStatUpdate('outOfBounds', 'Out of Bounds', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Ball hit out of bounds by this player"
          />
          <ActionButton
            label="Generic Fault"
            onClick={() => handleStatUpdate('faults', 'Generic Fault', 'fault')}
            className="btn-error"
            disabled={isSetLocked}
            title="Any other violation or fault not covered above"
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerStatActions;