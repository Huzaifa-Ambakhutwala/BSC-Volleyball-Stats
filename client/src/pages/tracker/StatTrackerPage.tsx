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
  isSetLocked,
  finalizeMatch,
  type StatLog
} from '@/lib/firebase';
import type { Match, Team, Player } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import PlayerStatActions, { StatActions } from '@/components/PlayerStatActions';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { LogOut, Clock, Trash2, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
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
  const [showFinalizeMatchDialog, setShowFinalizeMatchDialog] = useState(false);

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
    if (!currentMatch || !selectedMatchId) return;

    // First check if the set is locked 
    if (isSetLocked(currentMatch, setNumber)) {
      toast({
        title: `Set ${setNumber} Locked`,
        description: `This set is already finalized and cannot be modified.`,
        variant: "destructive",
      });
      return;
    }

    // Check if we're trying to access a future set that's not unlocked yet
    const currentMatchSet = currentMatch.currentSet || 1;
    if (setNumber > currentMatchSet) {
      toast({
        title: `Set ${setNumber} Not Available`,
        description: `You need to finalize set ${currentMatchSet} first before accessing set ${setNumber}.`,
        variant: "destructive",
      });
      return;
    }

    // If validation passes, change the set
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

    // Get the current set or default to 1
    const currentSetNumber = currentMatch.currentSet || 1;

    // Log current match state before advancing
    console.log('[AdvanceSet] Attempting to advance', {
      matchId: selectedMatchId,
      currentSetNumber,
      completedSets: currentMatch.completedSets,
      match: currentMatch
    });

    // Check if the current set is already locked
    if (currentMatch && isSetLocked(currentMatch, currentSetNumber)) {
      toast({
        title: "Set Already Locked",
        description: `Set ${currentSetNumber} has already been finalized and cannot be modified.`,
        variant: "destructive",
      });
      return;
    }

    // Only allow advancing if current set is 1 or 2
    if (currentSetNumber > 2) {
      toast({
        title: "Final Set",
        description: "Please use 'Submit Complete Match' to finalize the game",
        variant: "destructive",
      });
      return;
    }

    // Confirm with the user before finalizing
    if (!window.confirm(`Are you sure you want to finalize Set ${currentSetNumber}? This will lock the set and cannot be undone.`)) {
      return; // User cancelled
    }

    try {
      // Use the advanceToNextSet function
      const nextSet = await advanceToNextSet(selectedMatchId, currentSetNumber);
      console.log('[AdvanceSet] advanceToNextSet result:', nextSet);

      // Always reload match state after attempting to advance
      listenToMatchById(selectedMatchId, (updatedMatch) => {
        console.log('[AdvanceSet] Reloaded match after advancing:', updatedMatch);
        if (updatedMatch) {
          setCurrentMatch(updatedMatch);
        }
      });

      // If successful, move to the next set
      if (nextSet > currentSetNumber) {
        setCurrentSet(nextSet);

        toast({
          title: `Set ${currentSetNumber} Complete`,
          description: `Advanced to set ${nextSet}. Set ${currentSetNumber} is now locked.`,
        });

        // Reset player selection for the new set
        setSelectedPlayerId(null);

        // If this was set 2 and we're advancing to set 3 (final set),
        // Show a hint about finalizing the match
        // Only show toast based on the nextSet value
        if (nextSet === 2) {
          toast({
            title: "Set 2",
            description: "Advanced to Set 2. Complete this set to unlock the final set.",
          });
        } else if (nextSet === 3) {
          toast({
            title: "Final Set",
            description: "This is the final set. You'll be able to submit the match after completing this set.",
          });
        }
      } else {
        // Log error details for debugging
        console.error('[AdvanceSet] Failed to advance. Current match state:', {
          matchId: selectedMatchId,
          currentSetNumber,
          completedSets: currentMatch.completedSets,
          match: currentMatch
        });
        toast({
          title: "Error",
          description: "Failed to advance to next set. Please check your internet connection or contact an admin if this persists.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error advancing to next set:", error, {
        matchId: selectedMatchId,
        currentSetNumber,
        completedSets: currentMatch.completedSets,
        match: currentMatch
      });
      toast({
        title: "Error",
        description: "Failed to advance to the next set due to a system error. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // Handler for finalizing the entire match
  const handleFinalizeMatch = async () => {
    if (!currentMatch || !selectedMatchId) return;

    try {
      // Finalize the match
      const success = await finalizeMatch(selectedMatchId);

      if (success) {
        toast({
          title: "Match Completed",
          description: "The match has been successfully finalized and submitted.",
        });

        // Reset selection and redirect to match history
        setSelectedPlayerId(null);
        setLocation(`/history/${selectedMatchId}`);
      } else {
        toast({
          title: "Error",
          description: "Failed to finalize the match",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error finalizing match:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while finalizing the match",
        variant: "destructive",
      });
    }
  };

  // Open the finalize match dialog
  const openFinalizeMatchDialog = () => {
    setShowFinalizeMatchDialog(true);
  };

  // Handle confirm finalize match
  const handleConfirmFinalizeMatch = () => {
    setShowFinalizeMatchDialog(false);
    handleFinalizeMatch();
  };

  // Handle cancel finalize match
  const handleCancelFinalizeMatch = () => {
    setShowFinalizeMatchDialog(false);
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
              {/* Set Selection Controls - More prominent */}
              <div className="p-4 bg-gray-100 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col items-start space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-lg text-gray-800">Currently Tracking:</span>
                      <span className="bg-blue-600 text-white py-1 px-3 rounded-lg font-semibold">
                        Set {currentSet} of 3
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Set selection buttons with locked status indicators */}
                      {[1, 2, 3].map(setNum => {
                        // Determine if this set is locked
                        const isLocked = currentMatch && isSetLocked(currentMatch, setNum);
                        // Determine if this is the current set
                        const isCurrentSet = currentSet === setNum;
                        // Determine button style based on status
                        let buttonStyle = '';
                        let statusLabel = '';

                        if (isCurrentSet) {
                          // Current set styling
                          buttonStyle = 'bg-blue-600 text-white border-blue-600 font-bold';
                          statusLabel = 'Current';
                        } else if (isLocked) {
                          // Locked set styling
                          buttonStyle = 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed';
                          statusLabel = 'Locked';
                        } else {
                          // Available set styling
                          buttonStyle = 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
                          statusLabel = 'Available';
                        }

                        return (
                          <div key={setNum} className="flex flex-col items-center">
                            <button
                              className={`py-1 px-4 rounded-full border-2 ${buttonStyle} relative flex items-center`}
                              onClick={() => !isLocked && handleSetChange(setNum)}
                              disabled={isLocked}
                            >
                              {isLocked && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              )}
                              Set {setNum}
                            </button>
                            <span className={`text-xs mt-1 ${isCurrentSet ? 'text-blue-600 font-semibold' :
                              isLocked ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                              {statusLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit set/match buttons */}
                  <div className="flex flex-col space-y-2">
                    {/* Check if current match is completed */}
                    {currentMatch && currentMatch.status === 'completed' ? (
                      <div className="bg-gray-100 border border-gray-300 p-3 rounded-lg text-center">
                        <p className="text-gray-700 font-medium">Match submitted. Tracking disabled.</p>
                        <p className="text-gray-500 text-sm mt-1">No further changes can be made to this match.</p>
                      </div>
                    ) : (
                      <>
                        {/* Submit current set or match button */}
                        {currentMatch && isSetLocked(currentMatch, currentSet) ? (
                          <div className="bg-gray-100 border-l-4 border-amber-500 p-3 rounded-md shadow-sm">
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold text-gray-700">Set {currentSet} is locked</span>
                            </div>
                            <p className="text-sm text-gray-600 ml-7 mt-1">This set has been finalized and cannot be modified.</p>
                          </div>
                        ) : currentSet === 3 ? (
                          <button
                            className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md flex items-center justify-center font-bold"
                            onClick={openFinalizeMatchDialog}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Submit Complete Match</span>
                          </button>
                        ) : (
                          <button
                            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 px-6 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-md flex items-center justify-center font-bold"
                            onClick={handleAdvanceToNextSet}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            <span>Finalize Set {currentSet} & Advance to Set {currentSet + 1}</span>
                          </button>
                        )}

                        {/* Submit full match button - only show when all required sets are completed */}
                        {currentMatch && currentMatch.completedSets &&
                          ((currentMatch.completedSets.set1 && currentMatch.completedSets.set2) ||
                            (currentMatch.completedSets.set1 && currentMatch.completedSets.set3) ||
                            (currentMatch.completedSets.set2 && currentMatch.completedSets.set3)) && (
                            <button
                              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 font-semibold"
                              onClick={openFinalizeMatchDialog}
                            >
                              <span>Submit Full Match</span>
                            </button>
                          )}
                      </>
                    )}
                  </div>

                  {/* This submit button was replaced by the buttons above */}
                </div>

                {/* Set scores summary */}
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">Set Scores Summary</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className={`rounded-lg p-3 relative ${currentSet === 1
                      ? 'bg-blue-50 border-2 border-blue-400'
                      : (currentMatch.completedSets?.set1)
                        ? 'bg-green-50 border border-green-300'
                        : 'bg-white border border-gray-200'
                      }`}>
                      <div className="text-center font-semibold mb-2">Set 1</div>
                      <div className="flex justify-center items-center gap-2">
                        <span className="inline-block px-2 py-1 rounded bg-[hsl(var(--vb-blue))] text-white font-bold min-w-[30px] text-center">
                          {currentMatch.setScores?.set1?.scoreA || 0}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="inline-block px-2 py-1 rounded bg-[hsl(var(--vb-yellow))] text-white font-bold min-w-[30px] text-center">
                          {currentMatch.setScores?.set1?.scoreB || 0}
                        </span>
                      </div>

                      {/* Status indicators */}
                      {currentMatch.completedSets?.set1 ? (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : currentSet === 1 ? (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          Current
                        </div>
                      ) : null}

                      {/* Set lock status */}
                      {currentMatch.completedSets?.set1 && (
                        <div className="mt-2 text-xs text-center font-medium text-green-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Locked
                        </div>
                      )}
                    </div>

                    <div className={`rounded-lg p-3 relative ${currentSet === 2
                      ? 'bg-blue-50 border-2 border-blue-400'
                      : (currentMatch.completedSets?.set2)
                        ? 'bg-green-50 border border-green-300'
                        : (currentMatch.currentSet && currentMatch.currentSet > 1)
                          ? 'bg-white border border-gray-200'
                          : 'bg-gray-50 border border-gray-200 opacity-75'
                      }`}>
                      <div className="text-center font-semibold mb-2">Set 2</div>
                      <div className="flex justify-center items-center gap-2">
                        <span className="inline-block px-2 py-1 rounded bg-[hsl(var(--vb-blue))] text-white font-bold min-w-[30px] text-center">
                          {currentMatch.setScores?.set2?.scoreA || 0}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="inline-block px-2 py-1 rounded bg-[hsl(var(--vb-yellow))] text-white font-bold min-w-[30px] text-center">
                          {currentMatch.setScores?.set2?.scoreB || 0}
                        </span>
                      </div>

                      {/* Status indicators */}
                      {currentMatch.completedSets?.set2 ? (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : currentSet === 2 ? (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          Current
                        </div>
                      ) : null}

                      {/* Set lock status */}
                      {currentMatch.completedSets?.set2 && (
                        <div className="mt-2 text-xs text-center font-medium text-green-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Locked
                        </div>
                      )}

                      {/* Coming soon indicator for locked sets */}
                      {currentMatch.currentSet && currentMatch.currentSet < 2 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-30 rounded-lg">
                          <span className="text-sm text-gray-500 font-medium">Unlock after Set 1</span>
                        </div>
                      )}
                    </div>

                    <div className={`rounded-lg p-3 relative ${currentSet === 3
                      ? 'bg-blue-50 border-2 border-blue-400'
                      : (currentMatch.completedSets?.set3)
                        ? 'bg-green-50 border border-green-300'
                        : (currentMatch.currentSet && currentMatch.currentSet > 2)
                          ? 'bg-white border border-gray-200'
                          : 'bg-gray-50 border border-gray-200 opacity-75'
                      }`}>
                      <div className="text-center font-semibold mb-2">Set 3</div>
                      <div className="flex justify-center items-center gap-2">
                        <span className="inline-block px-2 py-1 rounded bg-[hsl(var(--vb-blue))] text-white font-bold min-w-[30px] text-center">
                          {currentMatch.setScores?.set3?.scoreA || 0}
                        </span>
                        <span className="text-gray-500">-</span>
                        <span className="inline-block px-2 py-1 rounded bg-[hsl(var(--vb-yellow))] text-white font-bold min-w-[30px] text-center">
                          {currentMatch.setScores?.set3?.scoreB || 0}
                        </span>
                      </div>

                      {/* Status indicators */}
                      {currentMatch.completedSets?.set3 ? (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : currentSet === 3 ? (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                          Current
                        </div>
                      ) : null}

                      {/* Set lock status */}
                      {currentMatch.completedSets?.set3 && (
                        <div className="mt-2 text-xs text-center font-medium text-green-600 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Locked
                        </div>
                      )}

                      {/* Coming soon indicator for locked sets */}
                      {currentMatch.currentSet && currentMatch.currentSet < 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-30 rounded-lg">
                          <span className="text-sm text-gray-500 font-medium">Unlock after Set 2</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Set Score Controls */}
              <div className="p-4 bg-white border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-4">
                    <span className="font-bold text-lg">
                      Set {currentSet} Score:
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-[hsl(var(--vb-blue))] font-bold text-3xl">
                        {currentMatch.setScores && currentMatch.setScores[`set${currentSet}` as keyof typeof currentMatch.setScores]
                          ? (currentMatch.setScores[`set${currentSet}` as keyof typeof currentMatch.setScores] as any).scoreA
                          : currentMatch.scoreA}
                      </span>
                      <span className="text-gray-500 text-xl">-</span>
                      <span className="text-[hsl(var(--vb-yellow))] font-bold text-3xl">
                        {currentMatch.setScores && currentMatch.setScores[`set${currentSet}` as keyof typeof currentMatch.setScores]
                          ? (currentMatch.setScores[`set${currentSet}` as keyof typeof currentMatch.setScores] as any).scoreB
                          : currentMatch.scoreB}
                      </span>
                    </div>
                  </div>
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
                    <StatActions
                      matchId={selectedMatchId}
                      selectedPlayerId={selectedPlayerId}
                      currentSet={currentSet}
                      onStatEntered={() => setSelectedPlayerId(null)}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Actions - Set {currentSet}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {statLogs.filter(log => log.set === currentSet).length} actions in current set
                  </span>
                </div>
              </div>

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
                      {statLogs
                        .filter(log => log.set === currentSet) // Only show logs for the current set
                        .map((log, index) => (
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
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.category === 'earned' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                  {statLogs.length > 0 ? (
                    <p className="text-gray-500">No actions recorded for Set {currentSet}.</p>
                  ) : (
                    <p className="text-gray-500">No stat actions recorded for this match yet.</p>
                  )}
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

      {/* Finalize Match Dialog */}
      <AlertDialog open={showFinalizeMatchDialog} onOpenChange={setShowFinalizeMatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
              Finalize Match
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to finalize this match? This will lock all sets and make the match permanently read-only. This action cannot be undone.

              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="font-medium">Match Summary:</div>
                <div className="mt-2 space-y-2">
                  {/* Set 1 */}
                  {currentMatch?.setScores?.set1 && (
                    <div className="text-sm flex items-center justify-between border-b pb-2">
                      <span className="font-medium">Set 1:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-blue-600">{currentMatch.setScores.set1.scoreA || 0}</span>
                        <span>-</span>
                        <span className="font-semibold text-amber-500">{currentMatch.setScores.set1.scoreB || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Set 2 */}
                  {currentMatch?.setScores?.set2 && (
                    <div className="text-sm flex items-center justify-between border-b pb-2">
                      <span className="font-medium">Set 2:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-blue-600">{currentMatch.setScores.set2.scoreA || 0}</span>
                        <span>-</span>
                        <span className="font-semibold text-amber-500">{currentMatch.setScores.set2.scoreB || 0}</span>
                      </div>
                    </div>
                  )}

                  {/* Set 3 */}
                  {currentMatch?.setScores?.set3 && (
                    <div className="text-sm flex items-center justify-between">
                      <span className="font-medium">Set 3:</span>
                      <div className="flex items-center space-x-1">
                        <span className="font-semibold text-blue-600">{currentMatch.setScores.set3.scoreA || 0}</span>
                        <span>-</span>
                        <span className="font-semibold text-amber-500">{currentMatch.setScores.set3.scoreB || 0}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Result */}
                <div className="mt-4 flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="font-medium">Final Result:</span>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500">{teamA?.teamName || 'Team A'}</div>
                      <div className="font-bold text-lg text-blue-600">{currentMatch?.scoreA || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500">{teamB?.teamName || 'Team B'}</div>
                      <div className="font-bold text-lg text-amber-500">{currentMatch?.scoreB || 0}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 text-amber-800 p-3 rounded-md text-sm">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p>Once a match is finalized, all sets are locked and no further changes can be made to the statistics. Make sure all data is accurate before proceeding.</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelFinalizeMatch}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmFinalizeMatch}
              className="bg-green-600 hover:bg-green-700"
            >
              Finalize Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default StatTrackerPage;