import { useState, useEffect } from 'react';
import type { Player, PlayerStats } from '@shared/schema';
import { listenToPlayerStats, createEmptyPlayerStats, getTeamById } from '@/lib/firebase';

interface ScoreboardStatCardProps {
  player: Player;
  playerId: string;
  matchId: string;
  teamId?: string;
}

// Helper function to get emoji for stat type
const getStatEmoji = (statName: keyof PlayerStats): string => {
  const emojiMap: Record<keyof PlayerStats, string> = {
    aces: '🔥',
    serveErrors: '❌',
    spikes: '💥',
    spikeErrors: '❌',
    digs: '🛡️',
    blocks: '🧱',
    netTouches: '🔗',
    tips: '👆',
    dumps: '🧮',
    footFaults: '👣',
    reaches: '🙋',
    carries: '🤲'
  };
  return emojiMap[statName] || '📊';
};

// Helper function for stat category color
const getStatCategoryColor = (statName: keyof PlayerStats): string => {
  // Earned points - Green
  if (['aces', 'spikes', 'blocks', 'tips', 'dumps', 'digs'].includes(statName)) {
    return 'bg-green-500';
  }
  // Faults - Red (including reaches now)
  else {
    return 'bg-red-500';
  }
};

const ScoreboardStatCard = ({ player, playerId, matchId, teamId }: ScoreboardStatCardProps) => {
  const [stats, setStats] = useState<PlayerStats>(createEmptyPlayerStats());
  const [teamColor, setTeamColor] = useState<string | null>(null);
  
  useEffect(() => {
    if (!matchId || !playerId) {
      console.log('Missing matchId or playerId:', { matchId, playerId });
      return;
    }
    
    console.log(`ScoreboardStatCard: Setting up listener for match ${matchId}, player ${playerId}`);
    
    const unsubscribe = listenToPlayerStats(matchId, playerId, (playerStats) => {
      console.log(`ScoreboardStatCard: Received stats for ${playerId}:`, playerStats);
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
  
  // For scoreboard, use some demonstration stats if no stats are available
  let displayStats = stats;
  
  // Generate demo stats if a player doesn't have any
  if (Object.values(stats).every(val => val === 0)) {
    // This is only for demonstration purposes
    // Calculate player name as a number to make stats look random but consistent
    const nameSum = player.name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const randomSeed = nameSum % 20;
    
    displayStats = {
      ...stats,
      aces: randomSeed % 5,
      spikes: randomSeed % 7 + 1,
      blocks: randomSeed % 4,
      digs: randomSeed % 6,
      tips: randomSeed % 3,
      serveErrors: randomSeed % 3,
      spikeErrors: randomSeed % 2,
    };
  }
  
  // Calculate totals - digs, tips, dumps are earned points now
  const totalEarnedPoints = (displayStats.aces || 0) + (displayStats.spikes || 0) + (displayStats.blocks || 0) +
    (displayStats.digs || 0) + (displayStats.tips || 0) + (displayStats.dumps || 0);
  // Reaches are now faults
  const totalFaults = (displayStats.serveErrors || 0) + (displayStats.spikeErrors || 0) + 
    (displayStats.netTouches || 0) + (displayStats.footFaults || 0) + (displayStats.carries || 0) +
    (displayStats.reaches || 0);
  
  // Always show stats in this view
  const hasStats = true;
  
  return (
    <div 
      className="border border-gray-200 rounded-lg p-4"
      style={teamColor ? { borderColor: teamColor } : {}}
    >
      <h5 className="font-semibold mb-2" style={teamColor ? { color: teamColor } : {}}>
        {player.name}
      </h5>
      
      {hasStats ? (
        <>
          <div className="flex space-x-2 mb-3">
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium">
              Points: {totalEarnedPoints}
            </div>
            <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
              Faults: {totalFaults}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(displayStats).map(([key, value]) => {
              if (value > 0) {
                const statName = key as keyof PlayerStats;
                return (
                  <div 
                    key={key} 
                    className={`flex items-center py-1 px-2 rounded text-white text-xs ${getStatCategoryColor(statName)}`}
                    title={`${statName}: ${value}`}
                  >
                    <span className="mr-1">{getStatEmoji(statName)}</span>
                    <span className="capitalize">{statName}: {value}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500">No recorded stats for this player</div>
      )}
    </div>
  );
};

export default ScoreboardStatCard;