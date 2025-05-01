import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { getTeamById, getMatches, getTeams } from '@/lib/firebase';
import type { Match, Team } from '@shared/schema';

export default function TeamMatchesDebug() {
  const { teamId } = useParams<{ teamId: string }>();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [matches, setMatches] = useState<{ [key: string]: Match }>({});
  const [teams, setTeams] = useState<{ [key: string]: Team }>({});
  const [teamMatches, setTeamMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        // Get team details
        const teamData = await getTeamById(teamId);
        setTeam(teamData);

        // Get all matches
        const allMatches = await getMatches();
        setMatches(allMatches);

        // Get all teams for reference
        const allTeams = await getTeams();
        setTeams(allTeams);

        // Filter matches where this team is assigned as the tracker
        const relevantMatches: Match[] = [];
        Object.entries(allMatches).forEach(([matchId, match]) => {
          // Create normalized strings for comparison
          const trackerTeamId = String(match.trackerTeam).trim();
          const currentTeamId = String(teamId).trim();
          
          // Check for direct match
          if (trackerTeamId === currentTeamId) {
            relevantMatches.push({
              ...match,
              id: matchId
            });
          } else if (
            // Check for loose match
            match.trackerTeam && 
            teamId && 
            (trackerTeamId.includes(currentTeamId) || currentTeamId.includes(trackerTeamId))
          ) {
            relevantMatches.push({
              ...match,
              id: matchId,
              _matchType: 'loose' // Added flag for debugging
            });
          }
        });

        setTeamMatches(relevantMatches);
        setLoading(false);
      } catch (error) {
        console.error('Error loading debug data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, [teamId]);

  // Special debug info
  const getTrackerInfo = (match: Match) => {
    const matchTrackerTeam = String(match.trackerTeam || '').trim();
    const currentTeamId = String(teamId || '').trim();
    const isExactMatch = matchTrackerTeam === currentTeamId;
    const isPartialMatch = 
      matchTrackerTeam.includes(currentTeamId) || 
      currentTeamId.includes(matchTrackerTeam);
    
    return {
      matchTrackerTeam,
      currentTeamId,
      isExactMatch,
      isPartialMatch
    };
  };

  if (loading) {
    return <div className="p-6">Loading match data...</div>;
  }

  if (!teamId) {
    return <div className="p-6">No team ID provided</div>;
  }

  if (!team) {
    return <div className="p-6">Team not found: {teamId}</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">Team Match Debug</h1>
        
        <div className="mb-4 p-3 bg-gray-100 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Team Information</h2>
          <div>
            <p><strong>Team ID:</strong> {teamId}</p>
            <p><strong>Team Name:</strong> {team.teamName}</p>
            <p><strong>Team Color:</strong> {team.teamColor || 'None'}</p>
            <p><strong>Players:</strong> {team.players?.length || 0}</p>
          </div>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">
            Matches This Team Is Assigned To Track ({teamMatches.length})
          </h2>
          
          {teamMatches.length === 0 ? (
            <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
              <p className="font-semibold">No matches found for this team</p>
              <p className="text-sm mt-1">This team is not assigned to track any matches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMatches.map(match => {
                const teamA = teams[match.teamA];
                const teamB = teams[match.teamB];
                const debug = getTrackerInfo(match);
                
                return (
                  <div key={match.id} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <div>
                        <span className="font-semibold">Match ID:</span> {match.id}
                      </div>
                      <div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Court {match.courtNumber}
                        </span>
                        <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          Game {match.gameNumber}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div><strong>Teams:</strong> {teamA?.teamName || 'Unknown'} vs {teamB?.teamName || 'Unknown'}</div>
                      <div><strong>Score:</strong> {match.scoreA} - {match.scoreB}</div>
                      <div><strong>Start Time:</strong> {match.startTime}</div>
                    </div>
                    
                    <div className="mt-3 text-xs p-2 bg-gray-200 rounded">
                      <div><strong>Debug Info:</strong></div>
                      <div>Match Tracker Team: {debug.matchTrackerTeam}</div>
                      <div>Current Team ID: {debug.currentTeamId}</div>
                      <div>Is Exact Match: {debug.isExactMatch ? 'Yes' : 'No'}</div>
                      <div>Is Partial Match: {debug.isPartialMatch ? 'Yes' : 'No'}</div>
                      <div>Match Type: {(match as any)._matchType || 'exact'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">All Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(teams).map(([id, team]) => (
              <div 
                key={id} 
                className={`p-2 border rounded ${id === teamId ? 'bg-blue-50 border-blue-300' : 'bg-gray-50'}`}
              >
                <div><strong>ID:</strong> {id}</div>
                <div><strong>Name:</strong> {team.teamName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Total Matches in System: {Object.keys(matches).length}</p>
        <p>Total Teams in System: {Object.keys(teams).length}</p>
      </div>
    </div>
  );
}