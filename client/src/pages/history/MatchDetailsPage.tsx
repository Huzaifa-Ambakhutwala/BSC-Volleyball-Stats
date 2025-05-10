import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { getMatchById, getTeamById, getStatLogs, getMatchStats, getPlayers, type StatLog, createEmptyPlayerStats } from '@/lib/firebase';
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
  const [currentSet, setCurrentSet] = useState<number | null>(null); // null means show all sets
  const { toast } = useToast();

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

  useEffect(() => {
    if (!matchId) return;

    const loadMatchDetails = async () => {
      try {
        // Load match data
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
        
        // Load teams
        const [teamAData, teamBData] = await Promise.all([
          getTeamById(matchData.teamA),
          getTeamById(matchData.teamB)
        ]);
        
        setTeamA(teamAData);
        setTeamB(teamBData);
        
        // Load all players
        const playersData = await getPlayers();
        setPlayersMap(playersData);
        
        // Load stat logs
        const logs = await getStatLogs(matchId);
        setStatLogs(logs);
        
        // Load match stats
        const stats = await getMatchStats(matchId);
        setMatchStats(stats);
        
        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load match details",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    loadMatchDetails();
  }, [matchId, toast]);

  if (isLoading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading match details...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!match) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500 mb-4">Match not found</p>
            <Link to="/history" className="text-[hsl(var(--vb-blue))] font-medium hover:underline flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to History
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const matchDate = new Date(match.startTime);
  const teamAColor = teamA?.teamColor || '#3B82F6';
  const teamBColor = teamB?.teamColor || '#EAB308';
  
  // Calculate team player stats
  const teamAPlayers = teamA?.players || [];
  const teamBPlayers = teamB?.players || [];
  
  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="mb-4">
          <Link to="/history" className="text-[hsl(var(--vb-blue))] font-medium hover:underline flex items-center inline-flex">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Match History
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-[hsl(var(--vb-blue))] text-white px-6 py-4">
            <h2 className="text-xl font-bold">Match Details</h2>
          </div>
          
          {/* Match Summary */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{format(matchDate, 'MMMM d, yyyy')}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{format(matchDate, 'h:mm a')}</span>
                <div className="flex items-center ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h20a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3z"></path>
                    <path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"></path>
                    <path d="M2 9v6"></path>
                    <path d="M22 9v6"></path>
                  </svg>
                  <span className="ml-1">Court {match.courtNumber}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Team A */}
              <div className="text-center">
                <div 
                  className="w-full h-1 mb-3 rounded-full"
                  style={{ backgroundColor: teamAColor }}
                ></div>
                <div className="flex items-center justify-center mb-2">
                  {teamA?.teamColor && (
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: teamAColor }}
                    />
                  )}
                  <h3 className="text-xl font-bold">{teamA?.teamName || 'Team A'}</h3>
                </div>
                <div className="text-4xl font-bold" style={{ color: teamAColor }}>
                  {match.scoreA}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {teamAPlayers.length} Players
                </div>
              </div>
              
              {/* VS */}
              <div className="text-center">
                <div className="text-xl font-bold text-gray-400">vs</div>
              </div>
              
              {/* Team B */}
              <div className="text-center">
                <div 
                  className="w-full h-1 mb-3 rounded-full"
                  style={{ backgroundColor: teamBColor }}
                ></div>
                <div className="flex items-center justify-center mb-2">
                  {teamB?.teamColor && (
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: teamBColor }}
                    />
                  )}
                  <h3 className="text-xl font-bold">{teamB?.teamName || 'Team B'}</h3>
                </div>
                <div className="text-4xl font-bold" style={{ color: teamBColor }}>
                  {match.scoreB}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {teamBPlayers.length} Players
                </div>
              </div>
            </div>
          </div>
          
          {/* Player Stats */}
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Player Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team A Stats */}
              <div>
                <h4 
                  className="text-md font-semibold mb-3 pb-2 border-b"
                  style={{ color: teamAColor, borderColor: teamAColor }}
                >
                  {teamA?.teamName || 'Team A'}
                </h4>
                <div className="space-y-4">
                  {teamAPlayers.map(playerId => {
                    const player = playersMap[playerId];
                    const playerStats = matchStats[playerId] || {};
                    
                    if (!player) return null;
                    
                    // Calculate totals - digs, tips, dumps are earned points now
                    const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + (playerStats.blocks || 0) +
                      (playerStats.digs || 0) + (playerStats.tips || 0) + (playerStats.dumps || 0);
                    // Reaches are now faults
                    const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + 
                      (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) +
                      (playerStats.reaches || 0);
                    
                    const hasStats = totalEarnedPoints > 0 || totalFaults > 0;
                    
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
                  })}
                </div>
              </div>
              
              {/* Team B Stats */}
              <div>
                <h4 
                  className="text-md font-semibold mb-3 pb-2 border-b"
                  style={{ color: teamBColor, borderColor: teamBColor }}
                >
                  {teamB?.teamName || 'Team B'}
                </h4>
                <div className="space-y-4">
                  {teamBPlayers.map(playerId => {
                    const player = playersMap[playerId];
                    const playerStats = matchStats[playerId] || {};
                    
                    if (!player) return null;
                    
                    // Calculate totals - digs, tips, dumps are earned points now
                    const totalEarnedPoints = (playerStats.aces || 0) + (playerStats.spikes || 0) + (playerStats.blocks || 0) +
                      (playerStats.digs || 0) + (playerStats.tips || 0) + (playerStats.dumps || 0);
                    // Reaches are now faults
                    const totalFaults = (playerStats.serveErrors || 0) + (playerStats.spikeErrors || 0) + 
                      (playerStats.netTouches || 0) + (playerStats.footFaults || 0) + (playerStats.carries || 0) +
                      (playerStats.reaches || 0);
                    
                    const hasStats = totalEarnedPoints > 0 || totalFaults > 0;
                    
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
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Stat Logs */}
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Match Timeline
            </h3>
            
            {statLogs.length > 0 ? (
              <div className="space-y-3">
                {statLogs.slice().reverse().map((log, index) => {
                  const logPlayer = playersMap[log.playerId];
                  const logTeam = log.teamId === match.teamA ? teamA : teamB;
                  const statColor = log.category === 'earned' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
                  
                  if (!logPlayer || !logTeam) return null;
                  
                  return (
                    <div key={log.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50">
                      <div className="mr-2 flex-shrink-0">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: logTeam.teamColor }}
                        ></div>
                      </div>
                      <div className="flex-grow">
                        <span className="font-medium">{logPlayer.name}</span> 
                        <span className="text-gray-600 px-1">•</span>
                        <span className={`text-sm px-1.5 py-0.5 rounded ${statColor}`}>{log.statName}</span>
                        <span className="text-gray-500 ml-2 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No stat logs recorded for this match
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MatchDetailsPage;