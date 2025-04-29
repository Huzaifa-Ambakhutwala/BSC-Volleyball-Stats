import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { getMatches, getTeamById } from '@/lib/firebase';
import type { Match, Team } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Component to display score for a single court
const CourtScoreCard = ({ courtNumber, match, teamA, teamB }: { 
  courtNumber: number, 
  match: Match | null, 
  teamA: Team | null, 
  teamB: Team | null 
}) => {
  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  if (!match) {
    return (
      <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden h-full">
        <div className="p-4 text-center">
          <h3 className="text-xl font-bold mb-2">Court {courtNumber}</h3>
          <p className="text-lg">No matches scheduled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden h-full">
      <div className="p-4 text-center">
        <h3 className="text-xl font-bold mb-2">Court {courtNumber}</h3>
        <div className="flex justify-center items-center space-x-4">
          <div className="text-center">
            <div className="text-[hsl(var(--vb-blue))] font-bold text-sm md:text-lg truncate max-w-28">
              {teamA?.teamName || 'Team A'}
            </div>
            <div className="font-mono text-4xl md:text-5xl font-bold">{match.scoreA}</div>
          </div>
          <div className="text-xl md:text-2xl font-bold">vs</div>
          <div className="text-center">
            <div className="text-[hsl(var(--vb-yellow))] font-bold text-sm md:text-lg truncate max-w-28">
              {teamB?.teamName || 'Team B'}
            </div>
            <div className="font-mono text-4xl md:text-5xl font-bold">{match.scoreB}</div>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-400">
          {formatTime(match.startTime)}
        </div>
      </div>
    </div>
  );
};

const AllCourtsScoreboard = () => {
  const [matchesByCourtMap, setMatchesByCourtMap] = useState<Map<number, Match>>(new Map());
  const [teamDataMap, setTeamDataMap] = useState<Map<string, Team>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load all matches and organize by court
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const allMatches = await getMatches();
        const courtMap = new Map<number, Match>();
        
        // Group matches by court number and take the first (or current) match for each court
        Object.values(allMatches).forEach(match => {
          courtMap.set(match.courtNumber, match);
        });
        
        setMatchesByCourtMap(courtMap);
        
        // Load all team data for these matches
        const teamIds = new Set<string>();
        courtMap.forEach(match => {
          teamIds.add(match.teamA);
          teamIds.add(match.teamB);
        });
        
        const teamPromises = Array.from(teamIds).map(teamId => 
          getTeamById(teamId).then(team => ({ id: teamId, team }))
        );
        
        const teamData = await Promise.all(teamPromises);
        const teamMap = new Map<string, Team>();
        
        teamData.forEach(({ id, team }) => {
          if (team) {
            teamMap.set(id, team);
          }
        });
        
        setTeamDataMap(teamMap);
        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load matches",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    loadMatches();
    
    // We're not setting up real-time listeners here as this is a dashboard view
    // For a production app, you might want to add listeners for each court
    const refreshInterval = setInterval(loadMatches, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [toast]);

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Court selector */}
        <div className="mb-6">
          <h2 className="text-xl font-bold">All Courts Scoreboard</h2>
          <p className="text-gray-600">View all courts or select a specific court:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/scoreboard/all">
              <button className="btn-blue bg-blue-800">All Courts</button>
            </Link>
            <Link href="/scoreboard/1">
              <button className="btn-blue">Court 1</button>
            </Link>
            <Link href="/scoreboard/2">
              <button className="btn-blue">Court 2</button>
            </Link>
            <Link href="/scoreboard/3">
              <button className="btn-blue">Court 3</button>
            </Link>
            <Link href="/scoreboard/4">
              <button className="btn-blue">Court 4</button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading scoreboard data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top row: Courts 1 & 2 */}
            <CourtScoreCard 
              courtNumber={1} 
              match={matchesByCourtMap.get(1) || null}
              teamA={matchesByCourtMap.get(1) ? teamDataMap.get(matchesByCourtMap.get(1)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(1) ? teamDataMap.get(matchesByCourtMap.get(1)!.teamB) || null : null}
            />
            <CourtScoreCard 
              courtNumber={2} 
              match={matchesByCourtMap.get(2) || null}
              teamA={matchesByCourtMap.get(2) ? teamDataMap.get(matchesByCourtMap.get(2)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(2) ? teamDataMap.get(matchesByCourtMap.get(2)!.teamB) || null : null}
            />
            
            {/* Bottom row: Courts 3 & 4 */}
            <CourtScoreCard 
              courtNumber={3} 
              match={matchesByCourtMap.get(3) || null}
              teamA={matchesByCourtMap.get(3) ? teamDataMap.get(matchesByCourtMap.get(3)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(3) ? teamDataMap.get(matchesByCourtMap.get(3)!.teamB) || null : null}
            />
            <CourtScoreCard 
              courtNumber={4} 
              match={matchesByCourtMap.get(4) || null}
              teamA={matchesByCourtMap.get(4) ? teamDataMap.get(matchesByCourtMap.get(4)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(4) ? teamDataMap.get(matchesByCourtMap.get(4)!.teamB) || null : null}
            />
          </div>
        )}

        {/* Court Layout Diagram */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Court Layout</h3>
          <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden shadow-md bg-gray-800 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 800 450" 
              className="w-full h-full"
            >
              {/* Background */}
              <rect x="0" y="0" width="800" height="450" fill="#1F2937" />
              
              {/* Court 1 (Top Left) */}
              <rect x="50" y="50" width="300" height="150" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2"/>
              <line x1="200" y1="50" x2="200" y2="200" stroke="#fff" strokeWidth="2" strokeDasharray="5 3"/>
              <text x="200" y="125" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">1</text>
              
              {/* Court 2 (Top Right) */}
              <rect x="450" y="50" width="300" height="150" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2"/>
              <line x1="600" y1="50" x2="600" y2="200" stroke="#fff" strokeWidth="2" strokeDasharray="5 3"/>
              <text x="600" y="125" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">2</text>
              
              {/* Court 3 (Bottom Left) */}
              <rect x="50" y="250" width="300" height="150" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2"/>
              <line x1="200" y1="250" x2="200" y2="400" stroke="#fff" strokeWidth="2" strokeDasharray="5 3"/>
              <text x="200" y="325" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">3</text>
              
              {/* Court 4 (Bottom Right) */}
              <rect x="450" y="250" width="300" height="150" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2"/>
              <line x1="600" y1="250" x2="600" y2="400" stroke="#fff" strokeWidth="2" strokeDasharray="5 3"/>
              <text x="600" y="325" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold">4</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllCourtsScoreboard;