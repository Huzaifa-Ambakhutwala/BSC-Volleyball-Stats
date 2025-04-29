import { useState } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { updatePlayerStat } from '@/lib/firebase';

interface PlayerStatActionsProps {
  player: Player;
  playerId: string;
  matchId: string;
  isSelected: boolean;
  onSelect: () => void;
}

const PlayerStatActions = ({ player, playerId, matchId, isSelected, onSelect }: PlayerStatActionsProps) => {
  // A separate component for all the action buttons
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
      </div>
    </div>
  );
};

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

const ActionButton = ({ label, onClick, className = "btn-neutral" }: ActionButtonProps) => (
  <button 
    className={`${className} w-full text-center py-2 px-3`}
    onClick={onClick}
  >
    {label}
  </button>
);

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
  if (!selectedPlayerId) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
        Select a player to track stats
      </div>
    );
  }

  const handleStatUpdate = (statName: keyof PlayerStats) => {
    if (!selectedPlayerId || !matchId) return;
    
    updatePlayerStat(matchId, selectedPlayerId, statName, 1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <ActionCategory title="In-Rally" className="bg-gray-200 text-gray-800">
        <ActionButton 
          label="Dig" 
          onClick={() => handleStatUpdate('digs')} 
          className="btn-neutral"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks')} 
          className="btn-neutral"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikes')} 
          className="btn-neutral"
        />
      </ActionCategory>
      
      <ActionCategory title="Earned" className="bg-[hsl(var(--vb-success))] text-white">
        <ActionButton 
          label="Ace" 
          onClick={() => handleStatUpdate('aces')} 
          className="btn-success"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikes')} 
          className="btn-success"
        />
        <ActionButton 
          label="Tip" 
          onClick={() => handleStatUpdate('tips')} 
          className="btn-success"
        />
        <ActionButton 
          label="Dump" 
          onClick={() => handleStatUpdate('dumps')} 
          className="btn-success"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks')} 
          className="btn-success"
        />
      </ActionCategory>
      
      <ActionCategory title="Error" className="bg-[hsl(var(--vb-warning))] text-white">
        <ActionButton 
          label="Serve" 
          onClick={() => handleStatUpdate('serveErrors')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikeErrors')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Receive" 
          onClick={() => handleStatUpdate('digs')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Set" 
          onClick={() => handleStatUpdate('dumps')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Whose Ball?" 
          onClick={() => handleStatUpdate('digs')} 
          className="btn-warning"
        />
        <ActionButton 
          label="Block" 
          onClick={() => handleStatUpdate('blocks')} 
          className="btn-warning"
        />
      </ActionCategory>
      
      <ActionCategory title="Fault" className="bg-[hsl(var(--vb-error))] text-white">
        <ActionButton 
          label="Serve" 
          onClick={() => handleStatUpdate('serveErrors')} 
          className="btn-error"
        />
        <ActionButton 
          label="Spike" 
          onClick={() => handleStatUpdate('spikeErrors')} 
          className="btn-error"
        />
        <ActionButton 
          label="Net Touch" 
          onClick={() => handleStatUpdate('netTouches')} 
          className="btn-error"
        />
        <ActionButton 
          label="Foot Fault" 
          onClick={() => handleStatUpdate('footFaults')} 
          className="btn-error"
        />
        <ActionButton 
          label="Reach" 
          onClick={() => handleStatUpdate('reaches')} 
          className="btn-error"
        />
        <ActionButton 
          label="Carry" 
          onClick={() => handleStatUpdate('carries')} 
          className="btn-error"
        />
      </ActionCategory>
    </div>
  );
};

export default PlayerStatActions;