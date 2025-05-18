import React from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TeamToggleSwitchProps {
  isSwapped: boolean;
  onChange: (isSwapped: boolean) => void;
  teamA?: { name: string; color?: string };
  teamB?: { name: string; color?: string };
}

const TeamToggleSwitch: React.FC<TeamToggleSwitchProps> = ({
  isSwapped,
  onChange,
  teamA,
  teamB
}) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between space-x-2 p-2 rounded-md bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 rounded-full ${teamA?.color ? `bg-[${teamA.color}]` : 'bg-blue-500'}`}></div>
          <span className="text-sm font-medium">
            {isSwapped ? (teamB?.name || 'Team B') : (teamA?.name || 'Team A')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="team-position-toggle" className="text-xs text-gray-500">
            Swap Positions
          </Label>
          <Switch
            id="team-position-toggle"
            checked={isSwapped}
            onCheckedChange={onChange}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {isSwapped ? (teamA?.name || 'Team A') : (teamB?.name || 'Team B')}
          </span>
          <div className={`w-4 h-4 rounded-full ${teamB?.color ? `bg-[${teamB.color}]` : 'bg-red-500'}`}></div>
        </div>
      </div>
      
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">Left Side</span>
        <span className="text-gray-500">Right Side</span>
      </div>
    </div>
  );
};

export default TeamToggleSwitch;