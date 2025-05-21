import { useState, useEffect, useRef } from 'react';
import { addPlayer, getPlayers, updatePlayer, deletePlayer, listenToPlayers } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Save, X, Loader2, PlusCircle, Upload, FileType } from 'lucide-react';
import type { Player } from '@shared/schema';

const AddPlayers = () => {
  const [playersText, setPlayersText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playersList, setPlayersList] = useState<Record<string, Player>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editJerseyNumber, setEditJerseyNumber] = useState<number>(0);
  const [editJerseyName, setEditJerseyName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load existing players
  // Load players - use a listener to keep data in sync
  useEffect(() => {
    setIsLoading(true);
    
    // Set up listener for players collection
    const unsubscribe = listenToPlayers((playersData) => {
      console.log('Players data updated:', playersData);
      setPlayersList(playersData);
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

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

      // Add each player
      for (const name of playerNames) {
        await addPlayer(name);
        // No need to update local state - Firebase listener will handle it
      }

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

  const handleEditClick = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPlayerName(player.name);
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditPlayerName('');
  };

  const handleSaveEdit = async () => {
    if (!editingPlayerId || !editPlayerName.trim()) return;

    try {
      // Update player in database
      await updatePlayer(editingPlayerId, editPlayerName);
      
      // No need to update local state - Firebase listener will handle it
      
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
      
      // Exit edit mode
      setEditingPlayerId(null);
      setEditPlayerName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update player",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = async (playerId: string) => {
    if (isDeleting) return;
    
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Delete from database
      await deletePlayer(playerId);
      
      // No need to update local state - Firebase listener will handle it
      
      toast({
        title: "Success",
        description: "Player deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Add single player form handler
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newJerseyNumber, setNewJerseyNumber] = useState<number | string>('');
  const [newJerseyName, setNewJerseyName] = useState('');
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  
  const handleAddSinglePlayer = async () => {
    if (!newPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!newJerseyNumber) {
      toast({
        title: "Error",
        description: "Jersey number is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!newJerseyName.trim()) {
      toast({
        title: "Error",
        description: "Jersey name is required",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingSingle(true);
    
    try {
      const jerseyNum = typeof newJerseyNumber === 'string' ? parseInt(newJerseyNumber) : newJerseyNumber;
      await addPlayer(newPlayerName, jerseyNum, newJerseyName);
      
      // No need to update local state - Firebase listener will handle it
      
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      
      // Clear form
      setNewPlayerName('');
      setNewJerseyNumber('');
      setNewJerseyName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive",
      });
    } finally {
      setIsAddingSingle(false);
    }
  };
  
  // CSV Upload handler
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCSV(true);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').filter(row => row.trim());
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const row of rows) {
          try {
            // Format: jersey number, jersey name, full name
            const [jerseyNumber, jerseyName, playerName] = row.split(',').map(item => item.trim());
            
            if (!jerseyNumber || !jerseyName || !playerName) {
              console.error('Missing data in row:', row);
              errorCount++;
              continue;
            }
            
            const jerseyNum = parseInt(jerseyNumber);
            if (isNaN(jerseyNum)) {
              console.error('Invalid jersey number:', jerseyNumber);
              errorCount++;
              continue;
            }
            
            await addPlayer(playerName, jerseyNum, jerseyName);
            successCount++;
          } catch (rowError) {
            console.error('Error processing row:', row, rowError);
            errorCount++;
          }
        }
        
        toast({
          title: "CSV Import Complete",
          description: `Successfully added ${successCount} players. ${errorCount > 0 ? `Failed to add ${errorCount} players.` : ''}`,
          variant: errorCount > 0 ? "destructive" : "default",
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process CSV file",
          variant: "destructive",
        });
      } finally {
        setIsUploadingCSV(false);
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      });
      setIsUploadingCSV(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Player Management Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Players Management</h3>
        
        {/* Single Player Add Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="md:col-span-1">
            <input
              type="number"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              placeholder="Jersey #"
              value={newJerseyNumber}
              onChange={(e) => setNewJerseyNumber(e.target.value ? parseInt(e.target.value) : '')}
              min="0"
            />
          </div>
          <div className="md:col-span-1">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              placeholder="Jersey Name"
              value={newJerseyName}
              onChange={(e) => setNewJerseyName(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              placeholder="Full Player Name"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
            />
          </div>
          <div className="md:col-span-1 flex">
            <button
              className="bg-[hsl(var(--vb-blue))] text-white py-2 px-4 rounded-md hover:bg-blue-700 transition flex items-center"
              onClick={handleAddSinglePlayer}
              disabled={isAddingSingle}
            >
              {isAddingSingle ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Add Player
            </button>
            <div className="ml-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleCSVUpload}
                disabled={isUploadingCSV}
              />
              <button
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition flex items-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCSV}
                title="Upload CSV"
              >
                {isUploadingCSV ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Players List */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 font-medium flex">
            <div className="flex-grow">Player Name</div>
            <div className="w-24 text-center">Actions</div>
          </div>
          
          {isLoading ? (
            <div className="px-4 py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p>Loading players...</p>
            </div>
          ) : Object.keys(playersList).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No players added yet
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(playersList).map(([playerId, player]) => (
                <div key={playerId} className="px-4 py-3 flex items-center">
                  {editingPlayerId === playerId ? (
                    // Edit mode
                    <div className="flex-grow flex space-x-2">
                      <input
                        type="text"
                        className="flex-grow px-3 py-1 border border-gray-300 rounded-md"
                        value={editPlayerName}
                        onChange={(e) => setEditPlayerName(e.target.value)}
                      />
                      <button 
                        className="text-green-500 p-1 hover:bg-green-50 rounded" 
                        onClick={handleSaveEdit}
                        title="Save"
                      >
                        <Save className="h-5 w-5" />
                      </button>
                      <button 
                        className="text-gray-500 p-1 hover:bg-gray-100 rounded" 
                        onClick={handleCancelEdit}
                        title="Cancel"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex-grow">{player.name}</div>
                      <div className="w-24 flex justify-end space-x-1">
                        <button 
                          className="text-blue-500 p-1 hover:bg-blue-50 rounded" 
                          onClick={() => handleEditClick({ ...player, id: playerId })}
                          title="Edit"
                        >
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-red-500 p-1 hover:bg-red-50 rounded" 
                          onClick={() => handleDeleteClick(playerId)}
                          title="Delete"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bulk Add Players Section */}
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
            className="bg-[hsl(var(--vb-blue))] text-white py-2 px-6 rounded-md hover:bg-blue-700 transition flex items-center"
            onClick={handleSubmit}
            disabled={isSubmitting || !playersText.trim()}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Adding Players...' : 'Add Players'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlayers;
