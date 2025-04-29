import { useState } from 'react';
import { addPlayer } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const AddPlayers = () => {
  const [playersText, setPlayersText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!playersText.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one player name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Split by commas or newlines
      const playerNames = playersText
        .split(/[,\n]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (playerNames.length === 0) {
        throw new Error("No valid player names found");
      }

      // Add each player to Firebase
      const promises = playerNames.map(name => addPlayer(name));
      await Promise.all(promises);

      toast({
        title: "Success",
        description: `Added ${playerNames.length} players to the database`,
      });
      
      // Clear the input
      setPlayersText('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add players",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Bulk Add Players</h3>
      <p className="text-gray-600 mb-4">Enter player names separated by commas or new lines.</p>
      <div className="space-y-4">
        <textarea 
          className="w-full h-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]" 
          placeholder="John Doe, Jane Smith, Mike Johnson..."
          value={playersText}
          onChange={(e) => setPlayersText(e.target.value)}
        ></textarea>
        <button 
          className="bg-[hsl(var(--vb-blue))] text-white py-2 px-6 rounded-md hover:bg-blue-700 transition"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding Players...' : 'Add Players'}
        </button>
      </div>
    </div>
  );
};

export default AddPlayers;
