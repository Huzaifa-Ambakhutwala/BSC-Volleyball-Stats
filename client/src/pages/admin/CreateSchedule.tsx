import { useState, useEffect } from 'react';
import { 
  getTeams, 
  createMatch, 
  getMatches, 
  updateMatch,
  deleteMatch,
  initializeMatchStats 
} from '@/lib/firebase';
import type { Team, Match } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Trophy, PlusCircle, Pencil, Trash2, Save, X, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const CreateSchedule = () => {
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [isLoadingTeams, setIsLoadingTeams] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editCourtNumber, setEditCourtNumber] = useState<number>(1);
  const [editTeamA, setEditTeamA] = useState<string>('');
  const [editTeamB, setEditTeamB] = useState<string>('');
  const [editStartTime, setEditStartTime] = useState<string>('');
  const { toast } = useToast();

  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsData = await getTeams();
        setTeams(teamsData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load teams",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTeams(false);
      }
    };

    loadTeams();
  }, [toast]);

  // Load matches
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const matchesData = await getMatches();
        setMatches(matchesData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load matches",
          variant: "destructive",
        });
      } finally {
        setIsLoadingMatches(false);
      }
    };

    loadMatches();
  }, [toast]);

  const handleSubmit = async () => {
    if (!teamA || !teamB) {
      toast({
        title: "Error",
        description: "Please select both teams",
        variant: "destructive",
      });
      return;
    }

    if (teamA === teamB) {
      toast({
        title: "Error",
        description: "Team A and Team B cannot be the same team",
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
        courtNumber,
        teamA,
        teamB,
        startTime
      });
      
      // Initialize stats for this match
      if (matchId) {
        await initializeMatchStats(matchId);
        
        // Update local state
        setMatches(prev => ({
          ...prev,
          [matchId]: {
            id: matchId,
            courtNumber,
            teamA,
            teamB,
            startTime,
            scoreA: 0,
            scoreB: 0
          }
        }));
      }
      
      toast({
        title: "Success",
        description: `Match scheduled on Court ${courtNumber}`,
      });
      
      // Reset form
      setTeamA('');
      setTeamB('');
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
    setEditCourtNumber(match.courtNumber);
    setEditTeamA(match.teamA);
    setEditTeamB(match.teamB);
    setEditStartTime(match.startTime);
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setEditCourtNumber(1);
    setEditTeamA('');
    setEditTeamB('');
    setEditStartTime('');
  };

  const handleSaveEdit = async () => {
    if (!editingMatchId || !editTeamA || !editTeamB || !editStartTime) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (editTeamA === editTeamB) {
      toast({
        title: "Error",
        description: "Team A and Team B cannot be the same team",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateMatch(editingMatchId, {
        courtNumber: editCourtNumber,
        teamA: editTeamA,
        teamB: editTeamB,
        startTime: editStartTime
      });
      
      // Update local state
      setMatches(prev => ({
        ...prev,
        [editingMatchId]: {
          ...prev[editingMatchId],
          courtNumber: editCourtNumber,
          teamA: editTeamA,
          teamB: editTeamB,
          startTime: editStartTime
        }
      }));
      
      toast({
        title: "Success",
        description: "Match updated successfully",
      });
      
      // Reset edit mode
      setEditingMatchId(null);
      setEditCourtNumber(1);
      setEditTeamA('');
      setEditTeamB('');
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
      
      // Update local state
      setMatches(prev => {
        const updated = { ...prev };
        delete updated[matchId];
        return updated;
      });
      
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
  const sortedMatches = Object.values(matches).sort((a, b) => {
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
          <div className="bg-gray-100 px-4 py-2 font-medium grid grid-cols-5">
            <div>Court</div>
            <div>Team A</div>
            <div>Team B</div>
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
                    <div className="grid grid-cols-5 gap-2">
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
                    <div className="grid grid-cols-5 gap-2">
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
                      <div className="text-sm text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-gray-400" />
                        {formatDate(match.startTime)}
                      </div>
                      <div className="flex justify-center space-x-1">
                        <button 
                          className="text-blue-500 p-1 hover:bg-blue-50 rounded" 
                          onClick={() => handleEditClick(match)}
                          title="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-500 p-1 hover:bg-red-50 rounded" 
                          onClick={() => handleDeleteClick(match.id)}
                          title="Delete"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <PlusCircle className="h-5 w-5 mr-2" />
          Schedule New Match
        </h3>
        <div className="space-y-4 max-w-lg border rounded-md p-4 bg-gray-50">
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
              {Object.entries(teams).map(([id, team]) => (
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
              {Object.entries(teams).map(([id, team]) => (
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
    </div>
  );
};

export default CreateSchedule;
