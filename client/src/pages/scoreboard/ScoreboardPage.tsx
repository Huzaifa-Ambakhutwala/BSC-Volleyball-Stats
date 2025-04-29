import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { listenToMatchesByCourtNumber, getTeamById } from '@/lib/firebase';
import type { Match, Team } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const ScoreboardPage = () => {
  const { courtId } = useParams<{ courtId: string }>();
  const courtNumber = parseInt(courtId || '1');
  
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
          <div className="mt-3 flex space-x-2">
            <Link href="/scoreboard/1">
              <a className={`btn-blue ${courtNumber === 1 ? 'bg-blue-800' : ''}`}>Court 1</a>
            </Link>
            <Link href="/scoreboard/2">
              <a className={`btn-blue ${courtNumber === 2 ? 'bg-blue-800' : ''}`}>Court 2</a>
            </Link>
            <Link href="/scoreboard/3">
              <a className={`btn-blue ${courtNumber === 3 ? 'bg-blue-800' : ''}`}>Court 3</a>
            </Link>
            <Link href="/scoreboard/4">
              <a className={`btn-blue ${courtNumber === 4 ? 'bg-blue-800' : ''}`}>Court 4</a>
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
        )}

        {/* Court Images */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Court Layout</h3>
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-md bg-gray-800 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 800 450" 
              className="w-full h-full"
            >
              {/* Volleyball court SVG */}
              <rect x="50" y="50" width="700" height="350" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="4"/>
              <line x1="400" y1="50" x2="400" y2="400" stroke="#fff" strokeWidth="4" strokeDasharray="10 5"/>
              <circle cx="400" cy="225" r="50" stroke="#fff" strokeWidth="2" fill="none"/>
              <rect x="50" y="175" width="50" height="100" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2"/>
              <rect x="700" y="175" width="50" height="100" fill="#F59E0B" fillOpacity="0.2" stroke="#F59E0B" strokeWidth="2"/>
              <text x="400" y="225" textAnchor="middle" fill="#fff" fontSize="48" fontWeight="bold">
                {courtNumber}
              </text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScoreboardPage;
