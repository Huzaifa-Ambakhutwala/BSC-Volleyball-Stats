import { useState, useEffect } from 'react';
import { getPlayers, createTeam } from '@/lib/firebase';
import type { Player } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const CreateTeams = () => {
  const [teamName, setTeamName] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const playersData = await getPlayers();
        setPlayers(playersData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load players",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, [toast]);

  const handleSubmit = async () => {
    if (!teamName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a team name",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlayers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one player",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createTeam(teamName, selectedPlayers);
      
      toast({
        title: "Success",
        description: `Team "${teamName}" created successfully`,
      });
      
      // Reset form
      setTeamName('');
      setSelectedPlayers([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayerSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSelectedPlayers(selectedOptions);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading players...</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Create Team</h3>
      <div className="space-y-4 max-w-lg">
        <div>
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
          <input 
            type="text" 
            id="teamName" 
            name="teamName" 
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="players" className="block text-sm font-medium text-gray-700 mb-1">Select Players</label>
          <select 
            multiple 
            id="players" 
            name="players" 
            className="w-full h-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
            value={selectedPlayers}
            onChange={handlePlayerSelection}
          >
            {Object.entries(players).map(([id, player]) => (
              <option key={id} value={id}>{player.name}</option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple players</p>
        </div>
        <button 
          className="bg-[hsl(var(--vb-blue))] text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Team...' : 'Create Team'}
        </button>
      </div>
    </div>
  );
};

export default CreateTeams;
