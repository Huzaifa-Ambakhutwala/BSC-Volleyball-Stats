import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { listenToMatchesByCourtNumber, getTeamById, getPlayers, listenToMatchStats } from '@/lib/firebase';
import type { Match, Team, Player, PlayerStats, MatchStats } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ScoreboardStatCard from '@/components/ScoreboardStatCard';
import { Loader2 } from 'lucide-react';

const ScoreboardPage = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const courtNumber = parseInt(courtId || '1');
  
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allPlayers, setAllPlayers] = useState<Record<string, Player>>({});
  const [playerStats, setPlayerStats] = useState<MatchStats>({});
  const { toast } = useToast();

  // Listen for matches on the specified court
  useEffect(() => {
    const unsubscribe = listenToMatchesByCourtNumber(courtNumber, (matchesByCourtNumber) => {
      setMatches(matchesByCourtNumber);
      
      // Get the first match (or the one that's currently happening)
      const matchEntries = Object.entries(matchesByCourtNumber);
      if (matchEntries.length > 0) {
        const [, firstMatch] = matchEntries[0];
        setCurrentMatch(firstMatch);
      } else {
        setCurrentMatch(null);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [courtNumber]);

  // Fetch team data when current match changes
  useEffect(() => {
    if (!currentMatch) {
      setTeamA(null);
      setTeamB(null);
      return;
    }
    
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
          description: "Failed to load team information",
          variant: "destructive",
        });
      }
    };
    
    loadTeams();
  }, [currentMatch, toast]);

  // Load all players data
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const players = await getPlayers();
        setAllPlayers(players);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load player information",
          variant: "destructive",
        });
      }
    };
    
    loadPlayers();
  }, [toast]);

  // Filter players for each team
  useEffect(() => {
    if (!teamA || !teamB || !allPlayers || Object.keys(allPlayers).length === 0) {
      setPlayersA([]);
      setPlayersB([]);
      return;
    }

    const teamAPlayers = teamA.players
      .map(playerId => allPlayers[playerId])
      .filter(Boolean);
      
    const teamBPlayers = teamB.players
      .map(playerId => allPlayers[playerId])
      .filter(Boolean);

    setPlayersA(teamAPlayers);
    setPlayersB(teamBPlayers);
  }, [teamA, teamB, allPlayers]);
  
  // Listen for player stats when current match changes
  useEffect(() => {
    if (!currentMatch || !currentMatch.id) {
      // Clear player stats if no match is selected
      setPlayerStats({});
      return;
    }
    
    console.log(`[ScoreboardPage] Setting up stat listener for match ID: ${currentMatch.id}`);
    
    // Listen for all player stats at once using listenToMatchStats
    // This gets all player stats for the entire match in one go
    const unsubscribe = listenToMatchStats(currentMatch.id, (stats) => {
      console.log(`[ScoreboardPage] Received match stats:`, stats);
      
      // Debug output to help diagnose if stats are being received
      if (Object.keys(stats).length === 0) {
        console.log(`[ScoreboardPage] WARNING: No player stats received for match ${currentMatch.id}`);
      } else {
        console.log(`[ScoreboardPage] SUCCESS: Received stats for ${Object.keys(stats).length} players`);
        // Log each player's stats that we received
        Object.entries(stats).forEach(([playerId, playerStats]) => {
          console.log(`Player ${playerId} stats:`, playerStats);
        });
      }
      
      setPlayerStats(stats);
    });
    
    return () => {
      console.log(`[ScoreboardPage] Removing stat listener for match ID: ${currentMatch.id}`);
      unsubscribe();
    };
  }, [currentMatch]);

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Court selector */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">Scoreboard Display</h2>
          <p className="text-gray-600">Select a court to view:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/scoreboard/all">
              <button className="btn-blue">All Courts</button>
            </Link>
            <Link href="/scoreboard/1">
              <button className={`btn-blue ${courtNumber === 1 ? 'bg-blue-800' : ''}`}>Court 1</button>
            </Link>
            <Link href="/scoreboard/2">
              <button className={`btn-blue ${courtNumber === 2 ? 'bg-blue-800' : ''}`}>Court 2</button>
            </Link>
            <Link href="/scoreboard/3">
              <button className={`btn-blue ${courtNumber === 3 ? 'bg-blue-800' : ''}`}>Court 3</button>
            </Link>
            <Link href="/scoreboard/4">
              <button className={`btn-blue ${courtNumber === 4 ? 'bg-blue-800' : ''}`}>Court 4</button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading scoreboard data...</div>
        ) : !currentMatch ? (
          <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-6">Court {courtNumber}</h3>
              <p className="text-xl">No matches scheduled for this court</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden">
              <div className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-6">Court {courtNumber}</h3>
                <div className="flex justify-center items-center space-x-8">
                  <div className="text-center">
                    <div className="text-[hsl(var(--vb-blue))] font-bold text-3xl mb-2">
                      {teamA?.teamName || 'Team A'}
                    </div>
                    <div className="font-mono text-7xl font-bold">{currentMatch.scoreA}</div>
                  </div>
                  <div className="text-4xl font-bold">vs</div>
                  <div className="text-center">
                    <div className="text-[hsl(var(--vb-yellow))] font-bold text-3xl mb-2">
                      {teamB?.teamName || 'Team B'}
                    </div>
                    <div className="font-mono text-7xl font-bold">{currentMatch.scoreB}</div>
                  </div>
                </div>
                <div className="mt-8 text-lg text-gray-400">
                  Start Time: {formatTime(currentMatch.startTime)}
                </div>
              </div>
            </div>
            
            {/* Player Stats Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Player Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team A Players */}
                <div>
                  <h4 className="text-lg font-bold mb-3" style={{color: teamA?.teamColor}}>
                    {teamA?.teamName || 'Team A'} Players
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {playersA.map(player => (
                      <div key={player.id} className="w-full">
                        {/* Read-only player card for scoreboard with stats */}
                        <ScoreboardStatCard 
                          player={player}
                          playerId={player.id}
                          matchId={currentMatch.id}
                          teamId={teamA?.id}
                          stats={playerStats[player.id]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Team B Players */}
                <div>
                  <h4 className="text-lg font-bold mb-3" style={{color: teamB?.teamColor}}>
                    {teamB?.teamName || 'Team B'} Players
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {playersB.map(player => (
                      <div key={player.id} className="w-full">
                        <ScoreboardStatCard 
                          player={player}
                          playerId={player.id}
                          matchId={currentMatch.id}
                          teamId={teamB?.id}
                          stats={playerStats[player.id]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </section>
  );
};

export default ScoreboardPage;
