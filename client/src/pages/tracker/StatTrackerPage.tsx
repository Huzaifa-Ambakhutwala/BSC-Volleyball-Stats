import { useState, useEffect } from 'react';
import { getMatches, getTeamById, getPlayers, updateMatchScore, listenToMatchById } from '@/lib/firebase';
import type { Match, Team, Player } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import PlayerStatCard from '@/components/PlayerStatCard';

const StatTrackerPage = () => {
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, Player>>({});
  const [isLoading, setIsLoading] = useState(true);
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

  const handleScoreUpdate = async (team: 'A' | 'B') => {
    if (!currentMatch || !selectedMatchId) return;
    
    try {
      const newScoreA = team === 'A' ? currentMatch.scoreA + 1 : currentMatch.scoreA;
      const newScoreB = team === 'B' ? currentMatch.scoreB + 1 : currentMatch.scoreB;
      
      await updateMatchScore(selectedMatchId, newScoreA, newScoreB);
      
      toast({
        title: "Score Updated",
        description: `Team ${team} score increased`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update score",
        variant: "destructive",
      });
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
                  return (
                    <option key={id} value={id}>
                      Court {match.courtNumber}: Teams {match.teamA} vs {match.teamB} ({startTime})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {currentMatch && (
            <>
              {/* Score Controls */}
              <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-lg">Score:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-[hsl(var(--vb-blue))] font-bold text-xl">{currentMatch.scoreA}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-[hsl(var(--vb-yellow))] font-bold text-xl">{currentMatch.scoreB}</span>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button 
                    className="bg-[hsl(var(--vb-blue))] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                    onClick={() => handleScoreUpdate('A')}
                  >
                    +1 Team A
                  </button>
                  <button 
                    className="bg-[hsl(var(--vb-yellow))] text-white py-2 px-4 rounded-md hover:bg-amber-600 transition"
                    onClick={() => handleScoreUpdate('B')}
                  >
                    +1 Team B
                  </button>
                </div>
              </div>

              {/* Teams and Stats Tracking */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team A */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--vb-blue))]">
                      Team A: {teamA?.teamName || 'Loading...'}
                    </h3>
                    {teamA ? (
                      <div className="space-y-6">
                        {teamA.players.map(playerId => {
                          const player = playersMap[playerId];
                          return player ? (
                            <PlayerStatCard 
                              key={playerId} 
                              player={player} 
                              playerId={playerId} 
                              matchId={selectedMatchId} 
                            />
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <div className="py-4 text-center">Loading team members...</div>
                    )}
                  </div>

                  {/* Team B */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-[hsl(var(--vb-yellow))]">
                      Team B: {teamB?.teamName || 'Loading...'}
                    </h3>
                    {teamB ? (
                      <div className="space-y-6">
                        {teamB.players.map(playerId => {
                          const player = playersMap[playerId];
                          return player ? (
                            <PlayerStatCard 
                              key={playerId} 
                              player={player} 
                              playerId={playerId} 
                              matchId={selectedMatchId} 
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
