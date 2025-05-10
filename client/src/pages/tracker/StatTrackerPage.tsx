import { useState, useEffect, useContext } from 'react';
import { 
  getTeamById, 
  getPlayers, 
  updateMatchScore, 
  listenToMatchById, 
  logoutStatTracker, 
  listenToMatchesForTracker, 
  getMatchesForTracker,
  listenToStatLogs, 
  deleteStatLog,
  getTrackerUser,
  advanceToNextSet,
  type StatLog 
} from '@/lib/firebase';
import type { Match, Team, Player } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import PlayerStatActions, { StatActions } from '@/components/PlayerStatActions';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { LogOut, Clock, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { TrackerUserContext } from '@/App';
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
  const [currentSet, setCurrentSet] = useState<number>(1); // Default to set 1
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { trackerUser, setTrackerUser } = useContext(TrackerUserContext);
  
  // Add fallback to localStorage if context is not available
  useEffect(() => {
    if (!trackerUser) {
      console.log("[StatTrackerPage] No tracker user in context, attempting to get from localStorage");
      const localUser = getTrackerUser();
      if (localUser) {
        console.log("[StatTrackerPage] Found user in localStorage:", localUser);
        setTrackerUser(localUser);
      } else {
        console.log("[StatTrackerPage] No user found in localStorage either, redirecting to login");
        setLocation('/tracker/login');
      }
    } else {
      console.log("[StatTrackerPage] Using tracker user from context:", trackerUser);
    }
  }, [trackerUser, setTrackerUser, setLocation]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Logout handler
  const handleLogout = () => {
    logoutStatTracker();
    setTrackerUser(null);
    setLocation('/tracker/login');
  };

  // Load assigned matches
  useEffect(() => {
    // Use trackerUser from context or get it directly from localStorage
    const currentUser = trackerUser || getTrackerUser();
    
    if (!currentUser) {
      console.log("No tracker user found in context or localStorage, cannot load matches");
      setIsLoading(false);
      return;
    }
    
    console.log("[StatTrackerPage] Loading matches for team ID:", currentUser.teamId);
    console.log("[StatTrackerPage] IMPORTANT - Team data:", currentUser);
    
    // Set loading to true to show loading state
    setIsLoading(true);
    
    // Force direct match lookup first to ensure we have matches
    getMatchesForTracker(currentUser.teamId).then((directMatches: Record<string, Match>) => {
      console.log("[StatTrackerPage] Direct database check found matches:", directMatches);
      
      // Immediately update matches if found
      if (Object.keys(directMatches).length > 0) {
        console.log("[StatTrackerPage] Setting matches from direct lookup");
        setMatches(directMatches);
        
        // Auto-select first match if none selected
        if (!selectedMatchId) {
          const firstMatchId = Object.keys(directMatches)[0];
          console.log("[StatTrackerPage] Auto-selecting first match:", firstMatchId);
          setSelectedMatchId(firstMatchId);
        }
      } else {
        console.log("[StatTrackerPage] Warning: No matches found directly in database for team", currentUser.teamId);
        
        // Check for potential issues
        console.log("[StatTrackerPage] DEBUG - Team ID Type:", typeof currentUser.teamId);
        console.log("[StatTrackerPage] DEBUG - Team ID Value:", currentUser.teamId);
      }
    }).catch((err: Error) => {
      console.error("[StatTrackerPage] Error in direct match check:", err);
    });
    
    // Set up real-time listener for ongoing updates
    const unsubscribe = listenToMatchesForTracker(currentUser.teamId, (matchesData) => {
      console.log("[StatTrackerPage] Received matches data from real-time listener:", matchesData);
      
      if (Object.keys(matchesData).length === 0) {
        console.log("[StatTrackerPage] Warning: No matches from real-time listener");
        // Still update state to empty if nothing found
        setMatches({});
        setIsLoading(false);
        
        // Alert the user if no matches found
        toast({
          title: "No Matches Found",
          description: "Your team isn't assigned to track any matches. Please verify the match assignments with the administrator.",
          variant: "destructive",
        });
        return;
      }
      
      // Update matches with real-time data
      setMatches(matchesData);
      
      // Select first match if none selected
      const matchIds = Object.keys(matchesData);
      if (matchIds.length > 0 && !selectedMatchId) {
        console.log("[StatTrackerPage] Setting first match as selected:", matchIds[0]);
        setSelectedMatchId(matchIds[0]);
      }
      
      // Loading complete
      setIsLoading(false);
    });
      
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.log("[StatTrackerPage] Timeout reached, stopping loading state");
        
        if (Object.keys(matches).length === 0) {
          toast({
            title: "No Matches Found",
            description: "No matches are assigned to your team for tracking. Please contact the administrator.",
            variant: "destructive",
          });
        }
      }
    }, 5000); // 5 second timeout
      
    return () => {
      console.log("[StatTrackerPage] Cleaning up match listener");
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [toast, trackerUser, selectedMatchId]);

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
      console.log(`[StatTrackerPage] Received ${logs.length} stat logs for match ID: ${selectedMatchId}`);
      if (logs.length > 0) {
        console.log(`[StatTrackerPage] First log:`, logs[0]);
      }
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
      // Get current set
      const setNum = currentMatch.currentSet || currentSet;
      
      // Get current scores for the specific set
      let currentSetScoreA = currentMatch.scoreA;
      let currentSetScoreB = currentMatch.scoreB;
      
      // Use set-specific scores if available
      if (currentMatch.setScores) {
        const setKey = `set${setNum}` as keyof typeof currentMatch.setScores;
        const setScore = currentMatch.setScores[setKey];
        if (setScore) {
          currentSetScoreA = setScore.scoreA;
          currentSetScoreB = setScore.scoreB;
        }
      }
      
      // Calculate new scores
      let newScoreA = currentSetScoreA;
      let newScoreB = currentSetScoreB;
      
      if (team === 'A') {
        newScoreA = Math.max(0, currentSetScoreA + increment);
      } else {
        newScoreB = Math.max(0, currentSetScoreB + increment);
      }
      
      // Update score for the current set
      await updateMatchScore(selectedMatchId, newScoreA, newScoreB, setNum);
      
      console.log(`[SCORE_UPDATE] Updated Set ${setNum} score to ${newScoreA}-${newScoreB}`);
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
  
  // Handler for changing the current set
  const handleSetChange = (setNumber: number) => {
    if (setNumber >= 1 && setNumber <= 3) {
      setCurrentSet(setNumber);
      
      // If the match has a currentSet field, update it
      if (currentMatch && selectedMatchId) {
        // Get the current scores
        const scoreA = currentMatch.scoreA || 0;
        const scoreB = currentMatch.scoreB || 0;
        
        // Update the match score and set number
        updateMatchScore(selectedMatchId, scoreA, scoreB, setNumber);
        console.log(`[StatTrackerPage] Changed to set ${setNumber}`);
      }
      
      toast({
        title: `Set ${setNumber}`,
        description: `Now tracking stats for set ${setNumber}`,
      });
    }
  };
  
  // Handler for advancing to the next set
  const handleAdvanceToNextSet = async () => {
    if (!currentMatch || !selectedMatchId) return;
    
    try {
      // Get the current set or default to 1
      const currentSetNumber = currentMatch.currentSet || 1;
      
      // Only allow advancing if current set is 1 or 2
      if (currentSetNumber < 1 || currentSetNumber > 2) {
        toast({
          title: "Cannot Advance",
          description: `Set ${currentSetNumber} is the final set`,
          variant: "destructive",
        });
        return;
      }
      
      // Use the advanceToNextSet function
      const nextSet = await advanceToNextSet(selectedMatchId, currentSetNumber);
      setCurrentSet(nextSet);
      
      toast({
        title: `Set ${currentSetNumber} Complete`,
        description: `Advanced to set ${nextSet}`,
      });
    } catch (error) {
      console.error("Error advancing to next set:", error);
      toast({
        title: "Error",
        description: "Failed to advance to the next set",
        variant: "destructive",
      });
    }
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
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading match data...</p>
            <p className="text-sm text-gray-500 mt-2">
              {Object.keys(matches).length > 0 ? 
                "Matches available but still loading details..." :
                "Waiting for assigned matches..."}
            </p>
          </div>
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
              
              {/* Set Selection Controls */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-lg">Current Set:</span>
                    <div className="flex items-center space-x-2">
                      {/* Set selection buttons */}
                      <button 
                        className={`py-1 px-3 rounded-full border ${currentSet === 1 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        onClick={() => handleSetChange(1)}
                      >
                        Set 1
                      </button>
                      <button 
                        className={`py-1 px-3 rounded-full border ${currentSet === 2 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        onClick={() => handleSetChange(2)}
                      >
                        Set 2
                      </button>
                      <button 
                        className={`py-1 px-3 rounded-full border ${currentSet === 3 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                        onClick={() => handleSetChange(3)}
                      >
                        Set 3
                      </button>
                    </div>
                  </div>
                  
                  {/* Set scores if available */}
                  {currentMatch.setScores && (
                    <div className="flex items-center gap-3">
                      {currentMatch.setScores.set1 && (
                        <div className="text-sm">
                          <span className="font-semibold">Set 1:</span> {currentMatch.setScores.set1.scoreA}-{currentMatch.setScores.set1.scoreB}
                        </div>
                      )}
                      {currentMatch.setScores.set2 && (
                        <div className="text-sm">
                          <span className="font-semibold">Set 2:</span> {currentMatch.setScores.set2.scoreA}-{currentMatch.setScores.set2.scoreB}
                        </div>
                      )}
                      {currentMatch.setScores.set3 && (
                        <div className="text-sm">
                          <span className="font-semibold">Set 3:</span> {currentMatch.setScores.set3.scoreA}-{currentMatch.setScores.set3.scoreB}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Advance set button */}
                  <button 
                    className="bg-amber-500 text-white py-1 px-4 rounded-md hover:bg-amber-600 transition flex items-center space-x-2"
                    onClick={handleAdvanceToNextSet}
                    disabled={currentSet >= 3}
                  >
                    <span>Complete Set {currentSet}</span>
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
                              teamId={teamA.id}
                              isSelected={selectedPlayerId === playerId}
                              onSelect={() => handlePlayerSelect(playerId)}
                              currentSet={currentSet}
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Actions</h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold">Set:</span>
                        <div className="flex space-x-1">
                          {[1, 2, 3].map((setNum) => (
                            <button 
                              key={setNum}
                              onClick={() => handleSetChange(setNum)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                currentSet === setNum 
                                  ? 'bg-[hsl(var(--vb-blue))] text-white' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {setNum}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <StatActions 
                      matchId={selectedMatchId}
                      selectedPlayerId={selectedPlayerId}
                      currentSet={currentSet}
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
                              teamId={teamB.id}
                              isSelected={selectedPlayerId === playerId}
                              onSelect={() => handlePlayerSelect(playerId)}
                              currentSet={currentSet}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set</th>
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
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-center">
                            {log.set ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Set {log.set}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
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
                <div className="mt-1 text-sm flex items-center justify-between">
                  <span>{teamA?.teamName || 'Team A'}:</span> 
                  <span className="font-semibold">{currentMatch?.scoreA || 0}</span>
                </div>
                <div className="text-sm flex items-center justify-between">
                  <span>{teamB?.teamName || 'Team B'}:</span> 
                  <span className="font-semibold">{currentMatch?.scoreB || 0}</span>
                </div>
                
                {/* Set information */}
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <div className="font-medium text-sm">Sets Played:</div>
                  <div className="flex space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${currentSet >= 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      Set 1
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${currentSet >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      Set 2
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${currentSet >= 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                      Set 3
                    </span>
                  </div>
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
