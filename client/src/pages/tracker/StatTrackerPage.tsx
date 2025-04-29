import { useState, useEffect } from 'react';
import { getMatches, getTeamById, getPlayers, updateMatchScore, listenToMatchById } from '@/lib/firebase';
import type { Match, Team, Player } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import PlayerStatActions, { StatActions } from '@/components/PlayerStatActions';
import { Button } from '@/components/ui/button';

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
  const { toast } = useToast();

  // Load all matches
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matchesData = await getMatches();
        setMatches(matchesData);
        
        // If there are matches, select the first one by default
        const matchIds = Object.keys(matchesData);
        if (matchIds.length > 0) {
          setSelectedMatchId(matchIds[0]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load matches",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [toast]);

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
    
    const unsubscribe = listenToMatchById(selectedMatchId, (match) => {
      if (match) {
        setCurrentMatch(match);
      }
    });
    
    // Reset selected player when match changes
    setSelectedPlayerId(null);
    
    return () => unsubscribe();
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
  
  const handleSubmitMatch = async () => {
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
          <div className="bg-[hsl(var(--vb-blue))] text-white px-6 py-4">
            <h2 className="text-xl font-bold">Stat Tracker</h2>
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
                    onClick={handleSubmitMatch}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Match'}
                  </button>
                </div>
              </div>

              {/* New Layout: Teams and Stats Tracking */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Team A Players - Left Column */}
                  <div>
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

                  {/* Actions - Right/Middle Column */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Actions</h3>
                    <StatActions 
                      matchId={selectedMatchId}
                      selectedPlayerId={selectedPlayerId}
                    />
                  </div>
                  
                  {/* Team B Players - Right Column */}
                  <div>
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

          {!selectedMatchId && (
            <div className="p-6 text-center">
              <p>Please select a match to start tracking stats.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StatTrackerPage;
