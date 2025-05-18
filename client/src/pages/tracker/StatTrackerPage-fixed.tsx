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
import TeamPositionToggle from '@/components/TeamPositionToggle';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalizeMatchDialog, setShowFinalizeMatchDialog] = useState(false);
  const [swapTeamPositions, setSwapTeamPositions] = useState(false);

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

  // Logout handler
  const handleLogout = () => {
    logoutStatTracker();
    setTrackerUser(null);
    setLocation('/tracker/login');
  };

  // Load assigned matches
  useEffect(() => {
    // Similar to your existing implementation
    const currentUser = trackerUser || getTrackerUser();
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Your existing match loading logic...
    getMatchesForTracker(currentUser.teamId).then((directMatches: Record<string, Match>) => {
      // Existing implementation
      if (Object.keys(directMatches).length > 0) {
        setMatches(directMatches);
        if (!selectedMatchId) {
          const firstMatchId = Object.keys(directMatches)[0];
          setSelectedMatchId(firstMatchId);
        }
      }
    }).catch((err: Error) => {
      console.error("[StatTrackerPage] Error in direct match check:", err);
    });

    // Set up real-time listener for ongoing updates
    const unsubscribe = listenToMatchesForTracker(currentUser.teamId, (matchesData) => {
      // Existing implementation
      setMatches(matchesData);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [toast, trackerUser, selectedMatchId]);

  // Other effects and handlers...
  
  // Handler for toggling team positions
  const handleToggleTeamPositions = () => {
    setSwapTeamPositions(prev => !prev);
  };

  if (isLoading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading match data...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Match</h3>
                <div className="max-w-md">
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                  >
                    <option value="">Select a match</option>
                    {Object.entries(matches).map(([id, match]) => (
                      <option key={id} value={id}>
                        Game {match.gameNumber} - Court {match.courtNumber} 
                        ({teamA?.teamName || 'Team A'} vs {teamB?.teamName || 'Team B'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {currentMatch && teamA && teamB && (
                <div className="w-full max-w-md">
                  <TeamPositionToggle
                    isSwapped={swapTeamPositions}
                    onToggle={handleToggleTeamPositions}
                    teamAColor={teamA.teamColor}
                    teamBColor={teamB.teamColor}
                    teamAName={teamA.teamName}
                    teamBName={teamB.teamName}
                    disabled={!selectedMatchId || isSetLocked(currentMatch, currentMatch.currentSet || 1)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Rest of your component with team positions now based on swapTeamPositions state */}
          {selectedMatchId && currentMatch && (
            <div className="p-6">
              <div className="flex flex-col space-y-6">
                {/* Set Selection */}
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-semibold mb-2">Current Set: {currentMatch.currentSet || 1}</h3>
                  <div className="flex space-x-2">
                    {/* Your set buttons */}
                  </div>
                </div>

                {/* Player Selection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team A players (left or right based on swapTeamPositions) */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg" style={{
                      color: !swapTeamPositions && teamA?.teamColor ? teamA.teamColor : 
                             swapTeamPositions && teamB?.teamColor ? teamB.teamColor : undefined
                    }}>
                      {!swapTeamPositions ? teamA?.teamName || 'Team A' : teamB?.teamName || 'Team B'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Map players with team colors based on swapTeamPositions */}
                      {(!swapTeamPositions ? teamA?.players : teamB?.players)?.map((playerId) => {
                        const player = playersMap[playerId];
                        if (!player) return null;
                        
                        const isLocked = currentMatch && isSetLocked(currentMatch, currentSet);
                        const currentTeam = !swapTeamPositions ? teamA : teamB;
                        const teamColor = currentTeam?.teamColor || '#3b82f6'; // Default blue
                        
                        return (
                          <button
                            key={playerId}
                            className={`p-3 rounded-md text-sm font-medium transition ${
                              selectedPlayerId === playerId
                                ? 'bg-[hsl(var(--vb-blue))] text-white'
                                : 'hover:bg-blue-50'
                            }`}
                            style={{
                              backgroundColor: selectedPlayerId === playerId ? undefined : 
                                             `${teamColor}20`, // 20% opacity
                              borderColor: teamColor,
                              borderWidth: '1px',
                              color: selectedPlayerId === playerId ? undefined : teamColor
                            }}
                            onClick={() => !isLocked && setSelectedPlayerId(selectedPlayerId === playerId ? null : playerId)}
                            disabled={isLocked}
                          >
                            {player.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team B players (right or left based on swapTeamPositions) */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg" style={{
                      color: !swapTeamPositions && teamB?.teamColor ? teamB.teamColor : 
                             swapTeamPositions && teamA?.teamColor ? teamA.teamColor : undefined
                    }}>
                      {!swapTeamPositions ? teamB?.teamName || 'Team B' : teamA?.teamName || 'Team A'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Same logic for Team B/A */}
                      {(!swapTeamPositions ? teamB?.players : teamA?.players)?.map((playerId) => {
                        const player = playersMap[playerId];
                        if (!player) return null;
                        
                        const isLocked = currentMatch && isSetLocked(currentMatch, currentSet);
                        const currentTeam = !swapTeamPositions ? teamB : teamA;
                        const teamColor = currentTeam?.teamColor || '#ef4444'; // Default red
                        
                        return (
                          <button
                            key={playerId}
                            className={`p-3 rounded-md text-sm font-medium transition ${
                              selectedPlayerId === playerId
                                ? 'bg-[hsl(var(--vb-blue))] text-white'
                                : 'hover:bg-blue-50'
                            }`}
                            style={{
                              backgroundColor: selectedPlayerId === playerId ? undefined : 
                                             `${teamColor}20`, // 20% opacity
                              borderColor: teamColor,
                              borderWidth: '1px',
                              color: selectedPlayerId === playerId ? undefined : teamColor
                            }}
                            onClick={() => !isLocked && setSelectedPlayerId(selectedPlayerId === playerId ? null : playerId)}
                            disabled={isLocked}
                          >
                            {player.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Stat Actions */}
                {selectedPlayerId && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <StatActions 
                      matchId={selectedMatchId} 
                      selectedPlayerId={selectedPlayerId}
                      currentSet={currentSet}
                    />
                  </div>
                )}
                
                {/* Other components */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatTrackerPage;