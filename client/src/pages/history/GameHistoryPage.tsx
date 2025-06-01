import { useState, useEffect } from 'react';
import { getMatches, getTeamById, getStatLogs, type StatLog } from '@/lib/firebase';
import type { Match, Team } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

const GameHistoryPage = () => {
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [teamsMap, setTeamsMap] = useState<Record<string, Team>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load all completed matches
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matchesData = await getMatches();
        setMatches(matchesData);
        
        // Load teams for all matches
        const teamIds = new Set<string>();
        Object.values(matchesData).forEach(match => {
          teamIds.add(match.teamA);
          teamIds.add(match.teamB);
          if (match.trackerTeam) {
            teamIds.add(match.trackerTeam);
          }
        });
        
        const teamPromises = Array.from(teamIds).map(async (teamId) => {
          const team = await getTeamById(teamId);
          return [teamId, team];
        });
        
        const teamsMapData = Object.fromEntries(
          (await Promise.all(teamPromises))
            .filter(([_, team]) => team !== null)
            .map(([id, team]) => [id, team])
        );
        
        setTeamsMap(teamsMapData);
        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load match history",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    loadMatches();
  }, [toast]);

  if (isLoading) {
    return (
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p>Loading match history...</p>
          </div>
        </div>
      </section>
    );
  }

  // Check if there are any matches
  const hasMatches = Object.keys(matches).length > 0;

  return (
    <section className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-[hsl(var(--vb-blue))] text-white px-6 py-4">
            <h2 className="text-xl font-bold">Game History</h2>
          </div>
          
          {hasMatches ? (
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(matches)
                  .sort((a, b) => new Date(b[1].startTime).getTime() - new Date(a[1].startTime).getTime())
                  .map(([matchId, match]) => {
                    const teamA = teamsMap[match.teamA];
                    const teamB = teamsMap[match.teamB];
                    const matchDate = new Date(match.startTime);
                    
                    // Apply team colors to the match card
                    const teamAColor = teamA?.teamColor || '#3B82F6';
                    const teamBColor = teamB?.teamColor || '#EAB308';
                    
                    return (
                      <div 
                        key={matchId} 
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Left section with game details */}
                          <div className="p-4 md:w-3/4">
                            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-2">
                              <Calendar className="w-4 h-4" />
                              <span>{format(matchDate, 'MMMM d, yyyy')}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{format(matchDate, 'h:mm a')}</span>
                              <div className="flex items-center ml-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 17H2a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h20a3 3 0 0 0-3 3v5a3 3 0 0 0 3 3z"></path>
                                  <path d="M2 17v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"></path>
                                  <path d="M2 9v6"></path>
                                  <path d="M22 9v6"></path>
                                </svg>
                                <span className="ml-1">Court {match.courtNumber}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center">
                                  {teamA?.teamColor && (
                                    <div 
                                      className="w-3 h-3 rounded-full mr-2" 
                                      style={{ backgroundColor: teamAColor }}
                                    />
                                  )}
                                  <h3 className="font-semibold truncate">{teamA?.teamName || 'Team A'}</h3>
                                </div>
                              </div>
                              
                              <div className="flex items-center font-bold text-xl">
                                <span style={{ color: teamAColor }}>{match.scoreA}</span>
                                <span className="mx-1 text-gray-400">-</span>
                                <span style={{ color: teamBColor }}>{match.scoreB}</span>
                              </div>
                              
                              <div className="flex-1 overflow-hidden text-right">
                                <div className="flex items-center justify-end">
                                  <h3 className="font-semibold truncate">{teamB?.teamName || 'Team B'}</h3>
                                  {teamB?.teamColor && (
                                    <div 
                                      className="w-3 h-3 rounded-full ml-2" 
                                      style={{ backgroundColor: teamBColor }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              Tracked by: {teamsMap[match.trackerTeam]?.teamName || 'Unknown Team'}
                            </div>
                          </div>
                          
                          {/* Right section with view details button */}
                          <div 
                            className="p-4 bg-gray-50 flex items-center justify-center md:w-1/4 border-t md:border-t-0 md:border-l border-gray-200"
                          >
                            <Link to={`/history/${matchId}`} className="text-[hsl(var(--vb-blue))] font-medium hover:underline flex items-center">
                              View Details
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No completed matches found.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GameHistoryPage;