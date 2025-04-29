import { useState, useEffect } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { updatePlayerStat, listenToPlayerStats, createEmptyPlayerStats } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface PlayerStatActionsProps {
  player: Player;
  playerId: string;
  matchId: string;
  isSelected: boolean;
  onSelect: () => void;
}

const PlayerStatActions = ({ player, playerId, matchId, isSelected, onSelect }: PlayerStatActionsProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  
  useEffect(() => {
    if (!matchId || !playerId) return;
    
    const unsubscribe = listenToPlayerStats(matchId, playerId, (playerStats) => {
      setStats(playerStats);
    });
    
    return () => unsubscribe();
  }, [matchId, playerId]);
  
  // Display some key stats alongside the player's name
  return (
    <div 
      className={`w-full cursor-pointer rounded-lg p-3 transition-colors ${
        isSelected 
          ? 'bg-blue-100 border-2 border-[hsl(var(--vb-blue))]' 
          : 'bg-white border border-gray-200 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="text-center">
        <h4 className="font-semibold text-[hsl(var(--vb-blue))]">{player.name}</h4>
        <div className="mt-1 flex justify-center space-x-2 text-xs text-gray-500">
          <span title="Aces">A: {stats.aces}</span>
          <span title="Blocks">B: {stats.blocks}</span>
          <span title="Kills">K: {stats.spikes}</span>
          <span title="Digs">D: {stats.digs}</span>
        </div>
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

  const handleStatUpdate = (statName: keyof PlayerStats, label: string) => {
    if (!selectedPlayerId || !matchId) return;
    
    // Set loading state
    setIsUpdating(true);
    
    // Update the stat
    updatePlayerStat(matchId, selectedPlayerId, statName, 1)
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
      
      <ActionCategory title="In-Rally" className="bg-gray-200 text-gray-800">
        <ActionButton 
          label="Dig" 
          onClick={() => handleStatUpdate('digs', 'Dig')} 
          className="btn-neutral"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks', 'Block')} 
          className="btn-neutral"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikes', 'Spike')} 
          className="btn-neutral"
        />
      </ActionCategory>
      
      <ActionCategory title="Earned" className="bg-[hsl(var(--vb-success))] text-white">
        <ActionButton 
          label="Ace" 
          onClick={() => handleStatUpdate('aces', 'Ace')} 
          className="btn-success"
        />
        <ActionButton 
          label="Kill" 
          onClick={() => handleStatUpdate('spikes', 'Kill')} 
          className="btn-success"
        />
        <ActionButton 
          label="Tip" 
          onClick={() => handleStatUpdate('tips', 'Tip')} 
          className="btn-success"
        />
        <ActionButton 
          label="Dump" 
          onClick={() => handleStatUpdate('dumps', 'Dump')} 
          className="btn-success"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks', 'Block')} 
          className="btn-success"
        />
      </ActionCategory>
      
      <ActionCategory title="Error" className="bg-[hsl(var(--vb-warning))] text-white">
        <ActionButton 
          label="Serve" 
          onClick={() => handleStatUpdate('serveErrors', 'Serve Error')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikeErrors', 'Spike Error')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Receive" 
          onClick={() => handleStatUpdate('digs', 'Receive Error')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Set" 
          onClick={() => handleStatUpdate('dumps', 'Set Error')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Whose Ball?" 
          onClick={() => handleStatUpdate('digs', 'Coverage Error')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks', 'Block Error')} 
          className="btn-warning"
        />
      </ActionCategory>
      
      <ActionCategory title="Fault" className="bg-[hsl(var(--vb-error))] text-white">
        <ActionButton 
          label="Serve" 
          onClick={() => handleStatUpdate('serveErrors', 'Serve Fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikeErrors', 'Spike Fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Net Touch" 
          onClick={() => handleStatUpdate('netTouches', 'Net Touch')} 
          className="btn-error"
        />
        <ActionButton 
          label="Foot Fault" 
          onClick={() => handleStatUpdate('footFaults', 'Foot Fault')} 
          className="btn-error"
        />
        <ActionButton 
          label="Reach" 
          onClick={() => handleStatUpdate('reaches', 'Reach')} 
          className="btn-error"
        />
        <ActionButton 
          label="Carry" 
          onClick={() => handleStatUpdate('carries', 'Carry')} 
          className="btn-error"
        />
      </ActionCategory>
    </div>
  );
};

export default PlayerStatActions;