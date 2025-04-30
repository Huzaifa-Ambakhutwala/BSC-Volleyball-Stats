import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { getMatchById, getTeamById, getStatLogs, getMatchStats, getPlayers, type StatLog } from '@/lib/firebase';
import type { Match, Team, Player, PlayerStats, MatchStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, Calendar, Clock, ArrowLeft, Award, Activity } from 'lucide-react';

const MatchDetailsPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, Player>>({});
  const [statLogs, setStatLogs] = useState<StatLog[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to get emoji for stat type
  const getStatEmoji = (statName: keyof PlayerStats): string => {
    switch(statName) {
      case 'aces': return '🎯';
      case 'serveErrors': return '❌';
      case 'spikes': return '💥';
      case 'spikeErrors': return '🚫';
      case 'blocks': return '🧱';
      case 'digs': return '🔄';
      case 'tips': return '👆';
      case 'dumps': return '👇';
      case 'netTouches': return '🥅';
      case 'footFaults': return '👣';
      case 'reaches': return '🤚';
      case 'carries': return '🏐';
      default: return '❓';
    }
  };

  const getStatCategoryColor = (statName: keyof PlayerStats): string => {
    // All stats are now either earned points (green) or faults (red)
    switch(statName) {
      case 'aces':
      case 'spikes':
      case 'blocks':
      case 'digs':
      case 'tips':
      case 'dumps':
        return 'bg-green-600';
      case 'serveErrors':
      case 'spikeErrors':
      case 'netTouches':
      case 'footFaults':
      case 'reaches':
      case 'carries':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) return;
      
      setIsLoading(true);
      
      try {
        // Get match details
        const matchData = await getMatchById(matchId);
        if (!matchData) {
          toast({
            title: "Error",
            description: "Match not found",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        setMatch(matchData);
        
        // Get teams
        const [teamAData, teamBData] = await Promise.all([
          getTeamById(matchData.teamA),
          getTeamById(matchData.teamB)
        ]);
        
        setTeamA(teamAData);
        setTeamB(teamBData);
        
        // Get players
        const playersData = await getPlayers();
        setPlayersMap(playersData);
        
        // Get match statistics
        const matchStatsData = await getMatchStats(matchId);
        setMatchStats(matchStatsData);
        
        // Get stat logs
        const statLogsData = await getStatLogs(matchId);
        setStatLogs(statLogsData.sort((a, b) => b.timestamp - a.timestamp)); // Sort newest first
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching match data:", error);
        toast({
          title: "Error",
          description: "Failed to load match data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    fetchMatchData();
  }, [matchId, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[hsl(var(--vb-blue))]" />
          <p className="text-xl font-medium">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (!match || !teamA || !teamB) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-xl font-medium mb-4">Match not found</p>
          <Link to="/history" className="text-blue-600 hover:underline flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Match History
          </Link>
        </div>
      </div>
    );
  }

  // Format date and time
  const matchDate = new Date(match.startTime);
  const formattedDate = format(matchDate, 'MMMM d, yyyy');
  const formattedTime = format(matchDate, 'h:mm a');

  // Get team colors
  const teamAColor = teamA.teamColor || '#3B82F6'; // Default blue
  const teamBColor = teamB.teamColor || '#EF4444'; // Default red

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/history" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Match History
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">Match Details</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <Calendar className="w-5 h-5 mr-2" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-5 h-5 mr-2" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-amber-500" />
              <span>Game #{match.gameNumber}</span>
            </div>
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[hsl(var(--vb-blue))]" />
              <span>Court #{match.courtNumber}</span>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="flex flex-col md:flex-row items-center justify-between border rounded-lg overflow-hidden">
              <div 
                className="w-full md:w-5/12 p-4 flex flex-col items-center text-center"
                style={{ backgroundColor: teamAColor, color: parseInt(teamAColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
              >
                <h3 className="font-bold">{teamA.teamName}</h3>
                <div className="text-3xl font-bold mt-2">{match.scoreA}</div>
              </div>
              
              <div className="w-full md:w-2/12 py-2 flex items-center justify-center font-bold text-lg">
                VS
              </div>
              
              <div 
                className="w-full md:w-5/12 p-4 flex flex-col items-center text-center"
                style={{ backgroundColor: teamBColor, color: parseInt(teamBColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
              >
                <h3 className="font-bold">{teamB.teamName}</h3>
                <div className="text-3xl font-bold mt-2">{match.scoreB}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Team Stats Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Team A Stats */}
        <div 
          className="bg-white rounded-lg shadow-md overflow-hidden"
          style={{ borderTop: `5px solid ${teamAColor}` }}
        >
          <div 
            className="p-4"
            style={{ backgroundColor: teamAColor, color: parseInt(teamAColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
          >
            <h2 className="text-xl font-bold">{teamA.teamName} Stats</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teamA.players.map(playerId => {
                const player = playersMap[playerId];
                const playerStats = matchStats[playerId] || {};
                
                // Calculate total stats
                const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + (playerStats.blocks || 0) + (playerStats.digs || 0) + (playerStats.tips || 0) + (playerStats.dumps || 0);
                const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) + (playerStats.reaches || 0);
                
                const hasStats = totalEarnedPoints > 0 || totalFaults > 0;
                
                if (!player) return null;
                
                return (
                  <div key={playerId} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">{player.name}</h5>
                    
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
                          {Object.entries(playerStats).map(([key, value]) => {
                            if (value > 0) {
                              const statName = key as keyof PlayerStats;
                              return (
                                <div 
                                  key={key} 
                                  className={`flex items-center py-1 px-2 rounded text-white text-xs ${getStatCategoryColor(statName)}`}
                                  title={`${statName}: ${value}`}
                                >
                                  <span className="mr-1">{getStatEmoji(statName)}</span>
                                  <span className="capitalize">{key}: {value}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">No stats recorded</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Team B Stats */}
        <div 
          className="bg-white rounded-lg shadow-md overflow-hidden"
          style={{ borderTop: `5px solid ${teamBColor}` }}
        >
          <div 
            className="p-4"
            style={{ backgroundColor: teamBColor, color: parseInt(teamBColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white' }}
          >
            <h2 className="text-xl font-bold">{teamB.teamName} Stats</h2>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teamB.players.map(playerId => {
                const player = playersMap[playerId];
                const playerStats = matchStats[playerId] || {};
                
                // Calculate total stats
                const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + (playerStats.blocks || 0) + (playerStats.digs || 0) + (playerStats.tips || 0) + (playerStats.dumps || 0);
                const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) + (playerStats.reaches || 0);
                
                const hasStats = totalEarnedPoints > 0 || totalFaults > 0;
                
                if (!player) return null;
                
                return (
                  <div key={playerId} className="border border-gray-200 rounded-lg p-4">
                    <h5 className="font-semibold mb-2">{player.name}</h5>
                    
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
                          {Object.entries(playerStats).map(([key, value]) => {
                            if (value > 0) {
                              const statName = key as keyof PlayerStats;
                              return (
                                <div 
                                  key={key} 
                                  className={`flex items-center py-1 px-2 rounded text-white text-xs ${getStatCategoryColor(statName)}`}
                                  title={`${statName}: ${value}`}
                                >
                                  <span className="mr-1">{getStatEmoji(statName)}</span>
                                  <span className="capitalize">{key}: {value}</span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm">No stats recorded</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stat Log */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Stat Log</h2>
        
        {statLogs.length > 0 ? (
          <div className="space-y-4">
            {statLogs.map((log, index) => {
              const player = playersMap[log.playerId];
              const team = log.teamId === teamA.id ? teamA : teamB;
              const teamColor = log.teamId === teamA.id ? teamAColor : teamBColor;
              const textColor = parseInt(teamColor.replace('#', ''), 16) > 0xffffff / 2 ? 'black' : 'white';
              
              if (!player) return null;
              
              return (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span 
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold mr-2"
                        style={{ backgroundColor: teamColor, color: textColor }}
                      >
                        {team.teamName}
                      </span>
                      <span className="font-medium">{player.name}</span>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs text-white ${getStatCategoryColor(log.statName as keyof PlayerStats)}`}>
                          <span className="mr-1">{getStatEmoji(log.statName as keyof PlayerStats)}</span>
                          <span className="capitalize">{log.statName}</span>
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {format(new Date(log.timestamp), 'h:mm:ss a')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No stat logs recorded for this match</p>
        )}
      </div>
    </div>
  );
};

export default MatchDetailsPage;
