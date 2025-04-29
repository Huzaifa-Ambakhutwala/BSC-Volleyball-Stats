import { useState, useEffect } from 'react';
import { getTeams, createMatch, initializeMatchStats } from '@/lib/firebase';
import type { Team } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const CreateSchedule = () => {
  const [courtNumber, setCourtNumber] = useState<number>(1);
  const [teamA, setTeamA] = useState<string>('');
  const [teamB, setTeamB] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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
        setIsLoading(false);
      }
    };

    loadTeams();
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

  if (isLoading) {
    return <div className="text-center py-4">Loading teams...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Schedule Match</h3>
      <div className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="courtNumber" className="block text-sm font-medium text-gray-700 mb-1">Court Number</label>
          <select 
            id="courtNumber" 
            name="courtNumber" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
            value={courtNumber}
            onChange={(e) => setCourtNumber(parseInt(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div>
          <label htmlFor="teamA" className="block text-sm font-medium text-gray-700 mb-1">Team A</label>
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
          <label htmlFor="teamB" className="block text-sm font-medium text-gray-700 mb-1">Team B</label>
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
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
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
          className="bg-[hsl(var(--vb-blue))] text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Scheduling...' : 'Schedule Match'}
        </button>
      </div>
    </div>
  );
};

export default CreateSchedule;
