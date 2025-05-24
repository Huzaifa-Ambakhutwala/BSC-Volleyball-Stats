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
      className={`relative flex flex-col p-4 rounded-xl shadow-md transition-all w-64 ${
        isSelected 
          ? 'ring-2 ring-offset-1 ring-[hsl(var(--vb-blue))]' 
          : ''
      } ${
        isCompleted 
          ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' 
          : 'bg-white hover:bg-blue-50 border border-gray-200'
      }`}
      onClick={handleClick}
    >
      {/* Status indicator - positioned at top right */}
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-gray-200 text-xs px-2 py-1 rounded text-gray-700 font-medium">
          Locked
        </div>
      )}
      
      {/* Court info */}
      <div className="text-left mb-2">
        <div className="font-medium text-gray-700">Court {match.courtNumber}</div>
        <div className="text-xs text-gray-500">{formattedTime}</div>
      </div>
      
      {/* Teams - with more spacing */}
      <div className="text-left mb-3 mt-2">
        <div className="font-semibold text-md mb-1" style={{ color: teamA?.teamColor || 'inherit' }}>
          {teamA?.teamName || match.teamA || 'Team A'}
        </div>
        <div className="text-xs text-gray-400 my-1">vs</div>
        <div className="font-semibold text-md mt-1" style={{ color: teamB?.teamColor || 'inherit' }}>
          {teamB?.teamName || match.teamB || 'Team B'}
        </div>
      </div>
      
      {/* Unlock button for completed matches - fixed at bottom with spacing */}
      {isCompleted && onUnlockClick && (
        <div className="mt-2">
          <button
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1 rounded w-full transition"
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