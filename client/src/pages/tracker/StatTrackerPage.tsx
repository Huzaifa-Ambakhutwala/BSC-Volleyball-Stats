import { useState, useEffect } from 'react';
import { getTeamById, getPlayers, updateMatchScore, listenToMatchById, getTrackerUser, logoutStatTracker, getMatchesForTracker, listenToMatchesForTracker, getStatLogs, listenToStatLogs, deleteStatLog, type StatLog } from '@/lib/firebase';
import type { Match, Team, Player } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import PlayerStatActions, { StatActions } from '@/components/PlayerStatActions';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { LogOut, Clock, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const StatTrackerPage = () => {
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, Player>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statLogs, setStatLogs] = useState<StatLog[]>([]);
  const [isDeletingLog, setIsDeletingLog] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [trackerUser] = useState(() => getTrackerUser());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Logout handler
  const handleLogout = () => {
    logoutStatTracker();
    setLocation('/tracker/login');
  };

  // Load assigned matches
  useEffect(() => {
    if (!trackerUser) return;
    
    const loadMatches = async () => {
      try {
        // Listen for matches assigned to this tracker team
        const unsubscribe = listenToMatchesForTracker(trackerUser.teamId, (matchesData) => {
          setMatches(matchesData);
          
          // If there are matches, select the first one by default
          const matchIds = Object.keys(matchesData);
          if (matchIds.length > 0 && !selectedMatchId) {
            setSelectedMatchId(matchIds[0]);
          }
          
          setIsLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load assigned matches",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [toast, trackerUser]);

  // Load all players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const playersData = await getPlayers();
        setPlayersMap(playersData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load players",
          variant: "destructive",
        });
      }
    };

    loadPlayers();
  }, [toast]);

  // Listen for updates to the selected match
  useEffect(() => {
    if (!selectedMatchId) return;
    
    const matchUnsubscribe = listenToMatchById(selectedMatchId, (match) => {
      if (match) {
        setCurrentMatch(match);
      }
    });
    
    // Listen for stat logs for this match
    const logsUnsubscribe = listenToStatLogs(selectedMatchId, (logs) => {
      setStatLogs(logs);
    });
    
    // Reset selected player when match changes
    setSelectedPlayerId(null);
    
    return () => {
      matchUnsubscribe();
      logsUnsubscribe();
    };
  }, [selectedMatchId]);

  // Load teams when match changes
  useEffect(() => {
    if (!currentMatch) return;
    
    const loadTeams = async () => {
      try {
        const [teamAData, teamBData] = await Promise.all([
          getTeamById(currentMatch.teamA),
          getTeamById(currentMatch.teamB)
        ]);
        
        setTeamA(teamAData);
        setTeamB(teamBData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load teams",
          variant: "destructive",
        });
      }
    };
    
    loadTeams();
  }, [currentMatch, toast]);

  const handleMatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMatchId(e.target.value);
  };

  const handleScoreUpdate = async (team: 'A' | 'B', increment: 1 | -1) => {
    if (!currentMatch || !selectedMatchId) return;
    
    try {
      let newScoreA = currentMatch.scoreA;
      let newScoreB = currentMatch.scoreB;
      
      if (team === 'A') {
        newScoreA = Math.max(0, currentMatch.scoreA + increment);
      } else {
        newScoreB = Math.max(0, currentMatch.scoreB + increment);
      }
      
      await updateMatchScore(selectedMatchId, newScoreA, newScoreB);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
    }
  };

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId === selectedPlayerId ? null : playerId);
  };
  
  const openSubmitDialog = () => {
    setShowConfirmDialog(true);
  };
  
  const handleConfirmSubmit = async () => {
    setShowConfirmDialog(false);
    if (!currentMatch || !selectedMatchId) return;
    
    setIsSubmitting(true);
    try {
      // Here you would update the match status in your database
      // await updateMatchStatus(selectedMatchId, 'completed');
      
      toast({
        title: "Match Complete",
        description: "Match data has been saved successfully",
      });
      
      // Reset selection and navigation as needed
      setSelectedPlayerId(null);
      
      // After successful submission, redirect to the match details page
      setLocation(`/history/${selectedMatchId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete the match",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
  };

  // Handler for deleting logs
  const handleDeleteLog = async (logId: string) => {
    if (!selectedMatchId || isDeletingLog) return;
    
    setIsDeletingLog(true);
    try {
      const success = await deleteStatLog(selectedMatchId, logId);
      
      if (success) {
        toast({
          title: "Success",
          description: "Stat log deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the stat log",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeletingLog(false);
    }
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">Loading match data...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-[hsl(var(--vb-blue))] text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Stat Tracker</h2>
            <div className="flex items-center">
              {trackerUser && (
                <div className="mr-4 text-sm">
                  Logged in as: <span className="font-semibold">{trackerUser.teamName}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-white text-[hsl(var(--vb-blue))] rounded-md hover:bg-gray-100 transition flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Match Selection */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Select Match</h3>
            <div className="max-w-md">
              <select 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                value={selectedMatchId}
                onChange={handleMatchChange}
              >
                <option value="">Select a match</option>
                {Object.entries(matches).map(([id, match]) => {
                  const startTime = new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  // Get team names instead of IDs
                  let teamAName = "Team A";
                  let teamBName = "Team B";
                  
                  try {
                    // Try to find the team names in the cache
                    const teamAObj = Object.values(matches).find(m => m.teamA === match.teamA);
                    const teamBObj = Object.values(matches).find(m => m.teamB === match.teamB);
                    
                    if (teamA && teamA.id === match.teamA) {
                      teamAName = teamA.teamName;
                    }
                    
                    if (teamB && teamB.id === match.teamB) {
                      teamBName = teamB.teamName;
                    }
                  } catch (error) {
                    // Fallback to IDs if names can't be found
                    teamAName = `Team ${match.teamA}`;
                    teamBName = `Team ${match.teamB}`;
                  }
                  
                  return (
                    <option key={id} value={id}>
                      Court {match.courtNumber}: {teamAName} vs {teamBName} ({startTime})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {currentMatch && (
            <>
              {/* Score Controls */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-lg">Score:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[hsl(var(--vb-blue))] font-bold text-xl">{currentMatch.scoreA}</span>
                      <span className="text-gray-500">-</span>
                      <span className="text-[hsl(var(--vb-yellow))] font-bold text-xl">{currentMatch.scoreB}</span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-[hsl(var(--vb-blue))] font-semibold mb-1">
                        {teamA?.teamName || 'Team A'}
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          className="bg-red-500 text-white w-8 h-8 rounded-md hover:bg-red-600 transition flex items-center justify-center"
                          onClick={() => handleScoreUpdate('A', -1)}
                        >
                          -
                        </button>
                        <button 
                          className="bg-[hsl(var(--vb-blue))] text-white w-8 h-8 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
                          onClick={() => handleScoreUpdate('A', 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-sm text-[hsl(var(--vb-yellow))] font-semibold mb-1">
                        {teamB?.teamName || 'Team B'}
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          className="bg-red-500 text-white w-8 h-8 rounded-md hover:bg-red-600 transition flex items-center justify-center"
                          onClick={() => handleScoreUpdate('B', -1)}
                        >
                          -
                        </button>
                        <button 
                          className="bg-[hsl(var(--vb-yellow))] text-white w-8 h-8 rounded-md hover:bg-amber-600 transition flex items-center justify-center"
                          onClick={() => handleScoreUpdate('B', 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
                    onClick={openSubmitDialog}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Match'}
                  </button>
                </div>
              </div>

              {/* Revised Layout: Team A (left), Actions (middle), Team B (right) */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Team A Players - Left Column */}
                  <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--vb-blue))]">
                      {teamA?.teamName || 'Team A'}
                    </h3>
                    {teamA ? (
                      <div className="space-y-2">
                        {teamA.players.map(playerId => {
                          const player = playersMap[playerId];
                          return player ? (
                            <PlayerStatActions 
                              key={playerId} 
                              player={player} 
                              playerId={playerId} 
                              matchId={selectedMatchId}
                              isSelected={selectedPlayerId === playerId}
                              onSelect={() => handlePlayerSelect(playerId)}
                            />
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center">Loading team members...</div>
                    )}
                  </div>

                  {/* Actions - Middle Column */}
                  <div className="lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-4 text-center">Actions</h3>
                    <StatActions 
                      matchId={selectedMatchId}
                      selectedPlayerId={selectedPlayerId}
                    />
                  </div>
                  
                  {/* Team B Players - Right Column */}
                  <div className="lg:col-span-1">
                    <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--vb-yellow))]">
                      {teamB?.teamName || 'Team B'}
                    </h3>
                    {teamB ? (
                      <div className="space-y-2">
                        {teamB.players.map(playerId => {
                          const player = playersMap[playerId];
                          return player ? (
                            <PlayerStatActions 
                              key={playerId} 
                              player={player} 
                              playerId={playerId} 
                              matchId={selectedMatchId}
                              isSelected={selectedPlayerId === playerId}
                              onSelect={() => handlePlayerSelect(playerId)}
                            />
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center">Loading team members...</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Stat Logs Section */}
          {currentMatch && selectedMatchId && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Actions</h3>
              
              {statLogs.length > 0 ? (
                <div className="overflow-auto max-h-[300px] border border-gray-200 rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {statLogs.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-gray-400" />
                              {format(new Date(log.timestamp), 'HH:mm:ss')}
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.playerName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {log.teamName}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            <span className="capitalize">{log.statName}</span> (+{log.value})
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.category === 'earned' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {log.category}
                            </span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                            {/* Only show delete button for the most recent log (first in the array) */}
                            {index === 0 && (
                              <button
                                onClick={() => handleDeleteLog(log.id)}
                                disabled={isDeletingLog}
                                className="text-red-500 hover:text-red-700 focus:outline-none disabled:opacity-50"
                                title="Delete this log entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center border border-gray-200 rounded-md">
                  <p className="text-gray-500">No stat actions recorded yet.</p>
                </div>
              )}
            </div>
          )}

          {!selectedMatchId && (
            <div className="p-6 text-center">
              <p>Please select a match to start tracking stats.</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
              Confirm Match Submission
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this match? This will finalize the current statistics and make them available in the match history.
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="font-medium">Match Summary:</div>
                <div className="mt-1 text-sm">
                  {teamA?.teamName || 'Team A'}: <span className="font-semibold">{currentMatch?.scoreA || 0}</span>
                </div>
                <div className="text-sm">
                  {teamB?.teamName || 'Team B'}: <span className="font-semibold">{currentMatch?.scoreB || 0}</span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelSubmit}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Yes, Submit Match'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StatTrackerPage;
