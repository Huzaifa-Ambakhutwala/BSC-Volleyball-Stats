import { useState, useEffect } from 'react';
import { 
  getTeams, 
  createMatch, 
  getMatches, 
  updateMatch,
  deleteMatch,
  initializeMatchStats,
  listenToTeams,
  listenToMatches
} from '@/lib/firebase';
import type { Team, Match } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Calendar, Clock, Trophy, PlusCircle, Pencil, Trash2, Save, X, Loader2, Users, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CreateSchedule = () => {
  const [gameNumber, setGameNumber] = useState<number>(1);
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [trackerTeam, setTrackerTeam] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const { canEdit, canDelete } = useAdminPermissions();
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editGameNumber, setEditGameNumber] = useState<number>(1);
  const [editCourtNumber, setEditCourtNumber] = useState<number>(1);
  const [editTeamA, setEditTeamA] = useState<string>('');
  const [editTeamB, setEditTeamB] = useState<string>('');
  const [editTrackerTeam, setEditTrackerTeam] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const { toast } = useToast();

  // Load teams - use a listener to keep data in sync
  useEffect(() => {
    setIsLoadingTeams(true);

    // Set up listener for teams collection
    const unsubscribe = listenToTeams((teamsData) => {
      console.log('Teams data updated:', teamsData);
      setTeams(teamsData);
      setIsLoadingTeams(false);
    });

    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Load matches - use a listener to keep data in sync
  useEffect(() => {
    setIsLoadingMatches(true);

    // Set up listener for matches collection
    const unsubscribe = listenToMatches((matchesData) => {
      console.log('Matches data updated:', matchesData);
      setMatches(matchesData);
      setIsLoadingMatches(false);
    });

    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    if (!teamA || !teamB || !trackerTeam) {
      toast({
        title: "Error",
        description: "Please select all teams (Team A, Team B, and Tracker Team)",
        variant: "destructive",
      });
      return;
    }

    if (teamA === teamB || teamA === trackerTeam || teamB === trackerTeam) {
      toast({
        title: "Error",
        description: "Team A, Team B, and Tracker Team must all be different",
        variant: "destructive",
      });
      return;
    }

    if (!startTime) {
      toast({
        title: "Error",
        description: "Please select a start time",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const matchId = await createMatch({
        gameNumber,
        courtNumber,
        teamA,
        teamB,
        trackerTeam,
        startTime
      });

      // Initialize stats for this match
      if (matchId) {
        await initializeMatchStats(matchId);
      }

      toast({
        title: "Success",
        description: `Game #${gameNumber} scheduled on Court ${courtNumber}`,
      });

      // Reset form
      setGameNumber(prev => prev + 1); // Increment game number
      setTeamA('');
      setTeamB('');
      setTrackerTeam('');
      setStartTime('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule match",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (match: Match) => {
    setEditingMatchId(match.id);
    // Set default values for new fields if they don't exist in the match object
    setEditGameNumber(match.gameNumber || 1);
    setEditCourtNumber(match.courtNumber);
    setEditTeamA(match.teamA);
    setEditTeamB(match.teamB);
    setEditTrackerTeam(match.trackerTeam || '');
    setEditStartTime(match.startTime);
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setEditGameNumber(1);
    setEditCourtNumber(1);
    setEditTeamA('');
    setEditTeamB('');
    setEditTrackerTeam('');
    setEditStartTime('');
  };

  const handleSaveEdit = async () => {
    if (!editingMatchId || !editTeamA || !editTeamB || !editTrackerTeam || !editStartTime) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (editTeamA === editTeamB || editTeamA === editTrackerTeam || editTeamB === editTrackerTeam) {
      toast({
        title: "Error",
        description: "Team A, Team B, and Tracker Team must all be different",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateMatch(editingMatchId, {
        gameNumber: editGameNumber,
        courtNumber: editCourtNumber,
        teamA: editTeamA,
        teamB: editTeamB,
        trackerTeam: editTrackerTeam,
        startTime: editStartTime
      });

      toast({
        title: "Success",
        description: "Match updated successfully",
      });

      // Reset edit mode
      setEditingMatchId(null);
      setEditGameNumber(1);
      setEditCourtNumber(1);
      setEditTeamA('');
      setEditTeamB('');
      setEditTrackerTeam('');
      setEditStartTime('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (matchId: string) => {
    if (isDeleting) return;

    if (!confirm("Are you sure you want to delete this match? This will also delete all related stats and cannot be undone.")) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteMatch(matchId);

      toast({
        title: "Success",
        description: "Match deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoadingTeams || isLoadingMatches) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p>Loading data...</p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return dateStr;
    }
  };

  // Sort matches by date
  const sortedMatches = Object.entries(matches)
    .map(([id, match]) => ({...match, id}))
    .sort((a, b) => {
      try {
        return parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime();
      } catch (error) {
        return 0;
      }
    });

  return (
    <div className="space-y-8">
      {/* Match Management Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Match Schedule</h3>

        {/* Matches List */}
        <div className="border rounded-md overflow-hidden mb-8">
          <div className="bg-gray-100 px-4 py-2 font-medium grid grid-cols-7">
            <div>Game #</div>
            <div>Court</div>
            <div>Team A</div>
            <div>Team B</div>
            <div>Tracker Team</div>
            <div>Start Time</div>
            <div className="text-center">Actions</div>
          </div>

          {sortedMatches.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No matches scheduled yet
            </div>
          ) : (
            <div className="divide-y">
              {sortedMatches.map(match => (
                <div key={match.id} className="px-4 py-3">
                  {editingMatchId === match.id ? (
                    // Edit mode
                    <div className="grid grid-cols-7 gap-2">
                      <div>
                        <input 
                          type="number" 
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={editGameNumber}
                          onChange={(e) => setEditGameNumber(parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={editCourtNumber}
                          onChange={(e) => setEditCourtNumber(parseInt(e.target.value))}
                        >
                          <option value={1}>Court 1</option>
                          <option value={2}>Court 2</option>
                          <option value={3}>Court 3</option>
                          <option value={4}>Court 4</option>
                        </select>
                      </div>
                      <div>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={editTeamA}
                          onChange={(e) => setEditTeamA(e.target.value)}
                        >
                          <option value="">Select Team A</option>
                          {Object.entries(teams).map(([id, team]) => (
                            <option key={id} value={id}>{team.teamName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={editTeamB}
                          onChange={(e) => setEditTeamB(e.target.value)}
                        >
                          <option value="">Select Team B</option>
                          {Object.entries(teams).map(([id, team]) => (
                            <option key={id} value={id}>{team.teamName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select 
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={editTrackerTeam}
                          onChange={(e) => setEditTrackerTeam(e.target.value)}
                        >
                          <option value="">Select Tracker Team</option>
                          {Object.entries(teams).map(([id, team]) => (
                            <option key={id} value={id}>{team.teamName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input 
                          type="datetime-local" 
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                          value={editStartTime}
                          onChange={(e) => setEditStartTime(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-center space-x-1">
                        <button 
                          className="text-green-500 p-1 hover:bg-green-50 rounded" 
                          onClick={handleSaveEdit}
                          title="Save"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Save className="h-5 w-5" />
                          )}
                        </button>
                        <button 
                          className="text-gray-500 p-1 hover:bg-gray-100 rounded" 
                          onClick={handleCancelEdit}
                          title="Cancel"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <div className="grid grid-cols-7 gap-2">
                      <div className="flex items-center">
                        <span className="bg-gray-200 text-gray-800 text-xs py-1 px-2 rounded-full">
                          #{match.gameNumber || '?'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-[hsl(var(--vb-blue))] text-white text-xs py-1 px-2 rounded-full">
                          Court {match.courtNumber}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {match.scoreA} - {match.scoreB}
                        </span>
                      </div>
                      <div className="font-medium text-sm">
                        {teams[match.teamA]?.teamName || 'Unknown Team'}
                      </div>
                      <div className="font-medium text-sm">
                        {teams[match.teamB]?.teamName || 'Unknown Team'}
                      </div>
                      <div className="font-medium text-sm text-gray-600">
                        {teams[match.trackerTeam]?.teamName || 'Not assigned'}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        {formatDate(match.startTime)}
                      </div>
                      <div className="flex justify-center space-x-1">
                        {canEdit && (
                          <button 
                            className="text-blue-500 p-1 hover:bg-blue-50 rounded" 
                            onClick={() => handleEditClick(match)}
                            title="Edit"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="text-red-500 p-1 hover:bg-red-50 rounded" 
                            onClick={() => handleDeleteClick(match.id)}
                            title="Delete"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Match Form */}
      {canEdit && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PlusCircle className="h-5 w-5 mr-2" />
            Schedule New Match
          </h3>
        <div className="space-y-4 max-w-lg border rounded-md p-4 bg-gray-50">
          <div>
            <label htmlFor="gameNumber" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Hash className="h-4 w-4 mr-1" />
              Game Number
            </label>
            <input 
              type="number" 
              id="gameNumber" 
              name="gameNumber" 
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={gameNumber}
              onChange={(e) => setGameNumber(parseInt(e.target.value) || 1)}
            />
          </div>
          <div>
            <label htmlFor="courtNumber" className="block text-sm font-medium text-gray-700 mb-1">Court Number</label>
            <select 
              id="courtNumber" 
              name="courtNumber" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={courtNumber}
              onChange={(e) => setCourtNumber(parseInt(e.target.value))}
            >
              <option value={1}>Court 1</option>
              <option value={2}>Court 2</option>
              <option value={3}>Court 3</option>
              <option value={4}>Court 4</option>
            </select>
          </div>
          <div>
            <label htmlFor="teamA" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Trophy className="h-4 w-4 mr-1" />
              Team A
            </label>
            <select 
              id="teamA" 
              name="teamA" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
            >
              <option value="">Select Team A</option>
              {Object.entries(teams)
                .filter(([id]) => id !== teamB && id !== trackerTeam)
                .map(([id, team]) => (
                  <option key={id} value={id}>{team.teamName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="teamB" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Trophy className="h-4 w-4 mr-1" />
              Team B
            </label>
            <select 
              id="teamB" 
              name="teamB" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
            >
              <option value="">Select Team B</option>
              {Object.entries(teams)
                .filter(([id]) => id !== teamA && id !== trackerTeam)
                .map(([id, team]) => (
                  <option key={id} value={id}>{team.teamName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="trackerTeam" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Tracker Team
            </label>
            <select 
              id="trackerTeam" 
              name="trackerTeam" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={trackerTeam}
              onChange={(e) => setTrackerTeam(e.target.value)}
            >
              <option value="">Select Tracker Team</option>
              {Object.entries(teams)
                .filter(([id]) => id !== teamA && id !== teamB)
                .map(([id, team]) => (
                  <option key={id} value={id}>{team.teamName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Start Time
            </label>
            <input 
              type="datetime-local" 
              id="startTime" 
              name="startTime" 
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <button 
            className="bg-[hsl(var(--vb-blue))] text-white py-2 px-6 rounded-md hover:bg-blue-700 transition flex items-center justify-center"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Scheduling...' : 'Schedule Match'}
          </button>
        </div>
        </div>
      )}
    </div>
  );
};

export default CreateSchedule;