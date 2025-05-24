import React from 'react';
import type { Match, Team } from '@shared/schema';
import { format } from 'date-fns';

interface MatchCardButtonProps {
  match: Match;
  teamA: Team | null;
  teamB: Team | null;
  isSelected: boolean;
  onClick: () => void;
  onUnlockClick?: (matchId: string) => void;
}

const MatchCardButton: React.FC<MatchCardButtonProps> = ({
  match,
  teamA,
  teamB,
  isSelected,
  onClick,
  onUnlockClick
}) => {
  const startTime = new Date(match.startTime);
  const formattedTime = format(startTime, 'h:mm a');
  
  const isCompleted = match.status === 'completed';
  
  const handleClick = (e: React.MouseEvent) => {
    if (isCompleted && onUnlockClick) {
      e.stopPropagation();
      onUnlockClick(match.id);
      return;
    }
    
    onClick();
  };
  
  return (
    <button
      className={`relative flex flex-col p-3 rounded-lg shadow transition-all ${
        isSelected 
          ? 'ring-2 ring-offset-2 ring-[hsl(var(--vb-blue))]' 
          : ''
      } ${
        isCompleted 
          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
          : 'bg-white hover:bg-blue-50 border border-gray-200'
      }`}
      onClick={handleClick}
    >
      {/* Court and time info */}
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-medium">Court {match.courtNumber}</span>
        <span className="text-gray-500">{formattedTime}</span>
      </div>
      
      {/* Teams */}
      <div className="text-left">
        <div className="font-semibold" style={{ color: teamA?.teamColor || 'inherit' }}>
          {teamA?.teamName || 'Team A'}
        </div>
        <div className="text-xs text-gray-500 my-0.5">vs</div>
        <div className="font-semibold" style={{ color: teamB?.teamColor || 'inherit' }}>
          {teamB?.teamName || 'Team B'}
        </div>
      </div>
      
      {/* Status indicator */}
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-gray-200 text-xs px-1.5 py-0.5 rounded-full text-gray-700">
          Locked
        </div>
      )}
      
      {/* Unlock button for completed matches */}
      {isCompleted && onUnlockClick && (
        <div className="absolute -bottom-3 right-0 left-0 flex justify-center">
          <button
            className="bg-amber-500 text-white text-xs px-2 py-1 rounded shadow hover:bg-amber-600 transition"
            onClick={(e) => {
              e.stopPropagation();
              onUnlockClick(match.id);
            }}
          >
            Unlock
          </button>
        </div>
      )}
    </button>
  );
};

export default MatchCardButton;