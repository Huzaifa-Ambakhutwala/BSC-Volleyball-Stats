import React from 'react';

interface TeamPositionToggleProps {
  isSwapped: boolean;
  onToggle: () => void;
  teamAColor?: string;
  teamBColor?: string;
  teamAName?: string;
  teamBName?: string;
  disabled?: boolean;
}

const TeamPositionToggle: React.FC<TeamPositionToggleProps> = ({
  isSwapped,
  onToggle,
  teamAColor = '#3b82f6', // Default blue color
  teamBColor = '#ef4444', // Default red color
  teamAName = 'Team A',
  teamBName = 'Team B',
  disabled = false
}) => {
  // Extract hex colors without the # for use in tailwind's bg-[#color] format
  const teamAColorClass = teamAColor.startsWith('#') ? teamAColor : `#${teamAColor}`;
  const teamBColorClass = teamBColor.startsWith('#') ? teamBColor : `#${teamBColor}`;
  
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between bg-gray-50 rounded-md p-3">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: isSwapped ? teamBColorClass : teamAColorClass }}
          />
          <span className="text-sm font-medium">
            {isSwapped ? teamBName : teamAName}
          </span>
        </div>
        
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`px-3 py-1 text-xs border rounded ${
            disabled 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : 'border-blue-500 text-blue-600 hover:bg-blue-50'
          }`}
        >
          Swap Positions
        </button>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {isSwapped ? teamAName : teamBName}
          </span>
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: isSwapped ? teamAColorClass : teamBColorClass }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Left Side</span>
        <span>Right Side</span>
      </div>
    </div>
  );
};

export default TeamPositionToggle;