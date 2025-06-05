import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { getMatches, getTeamById } from '@/lib/firebase';
import type { Match, Team } from '@shared/schema';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

// Component to display score for a single court
const CourtScoreCard = ({ courtNumber, match, teamA, teamB, isAllMatchesComplete }: { 
  courtNumber: number, 
  match: Match | null, 
  teamA: Team | null, 
  teamB: Team | null,
  isAllMatchesComplete?: boolean
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

  // Check if this is a completed match and all matches are done
  const showCompletionMessage = isAllMatchesComplete && match.status === 'completed';

  return (
    <div className="bg-[hsl(var(--vb-dark-gray))] text-white rounded-lg shadow-md overflow-hidden h-full">
      <div className="p-4 text-center">
        <h3 className="text-xl font-bold mb-2">Court {courtNumber}</h3>
        
        {showCompletionMessage ? (
          <div className="py-8">
            <div className="text-green-400 text-lg font-bold mb-4">
              All matches complete for today on this court
            </div>
            <div className="text-sm text-gray-400">
              Last match: {formatTime(match.startTime)}
            </div>
          </div>
        ) : (
          <>
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
              {match.currentSet && (
                <span className="ml-2 text-yellow-400">
                  • Set {match.currentSet}
                </span>
              )}
              {match.status === 'completed' && (
                <span className="ml-2 text-green-400">
                  • Complete
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const AllCourtsScoreboard = () => {
  const [matchesByCourtMap, setMatchesByCourtMap] = useState<Map<number, Match>>(new Map());
  const [teamDataMap, setTeamDataMap] = useState<Map<string, Team>>(new Map());
  const [courtCompletionStatus, setCourtCompletionStatus] = useState<Map<number, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load all matches and organize by court
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const allMatches = await getMatches();
        const courtMap = new Map<number, Match>();
        
        // Group matches by court number and find the earliest upcoming/active match for each court
        const matchesByCourtNumber = new Map<number, Match[]>();
        
        Object.values(allMatches).forEach(match => {
          if (!matchesByCourtNumber.has(match.courtNumber)) {
            matchesByCourtNumber.set(match.courtNumber, []);
          }
          matchesByCourtNumber.get(match.courtNumber)!.push(match);
        });
        
        // For each court, find the earliest match that is not completed
        const completionStatusMap = new Map<number, boolean>();
        
        matchesByCourtNumber.forEach((matches, courtNumber) => {
          // Sort matches by start time
          const sortedMatches = matches.sort((a, b) => 
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          
          // Find the first match that is not completed
          const activeMatch = sortedMatches.find(match => 
            match.status !== 'completed'
          );
          
          // Check if all matches for this court are completed
          const allCompleted = sortedMatches.every(match => match.status === 'completed');
          completionStatusMap.set(courtNumber, allCompleted);
          
          // If no active match found, use the latest completed match or first match
          const displayMatch = activeMatch || sortedMatches[sortedMatches.length - 1] || sortedMatches[0];
          
          if (displayMatch) {
            courtMap.set(courtNumber, displayMatch);
          }
        });
        
        setCourtCompletionStatus(completionStatusMap);
        
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
              isAllMatchesComplete={courtCompletionStatus.get(1) || false}
            />
            <CourtScoreCard 
              courtNumber={2} 
              match={matchesByCourtMap.get(2) || null}
              teamA={matchesByCourtMap.get(2) ? teamDataMap.get(matchesByCourtMap.get(2)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(2) ? teamDataMap.get(matchesByCourtMap.get(2)!.teamB) || null : null}
              isAllMatchesComplete={courtCompletionStatus.get(2) || false}
            />
            
            {/* Bottom row: Courts 3 & 4 */}
            <CourtScoreCard 
              courtNumber={3} 
              match={matchesByCourtMap.get(3) || null}
              teamA={matchesByCourtMap.get(3) ? teamDataMap.get(matchesByCourtMap.get(3)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(3) ? teamDataMap.get(matchesByCourtMap.get(3)!.teamB) || null : null}
              isAllMatchesComplete={courtCompletionStatus.get(3) || false}
            />
            <CourtScoreCard 
              courtNumber={4} 
              match={matchesByCourtMap.get(4) || null}
              teamA={matchesByCourtMap.get(4) ? teamDataMap.get(matchesByCourtMap.get(4)!.teamA) || null : null}
              teamB={matchesByCourtMap.get(4) ? teamDataMap.get(matchesByCourtMap.get(4)!.teamB) || null : null}
              isAllMatchesComplete={courtCompletionStatus.get(4) || false}
            />
          </div>
        )}


      </div>
    </section>
  );
};

export default AllCourtsScoreboard;