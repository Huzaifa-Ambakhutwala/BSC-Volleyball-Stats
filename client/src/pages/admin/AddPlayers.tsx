import { useState, useEffect, useRef } from 'react';
import { addPlayer, getPlayers, updatePlayer, deletePlayer, listenToPlayers } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
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
  const { canEdit, canDelete } = useAdminPermissions();

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
        description: "Please enter player data in the required format",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Split by newlines
      const playerLines = playersText
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (playerLines.length === 0) {
        throw new Error("No valid player data found");
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each line (format: jersey number, jersey name, full player name)
      for (const line of playerLines) {
        try {
          // Try to split by comma
          const parts = line.split(',').map(part => part.trim());
          
          if (parts.length < 3) {
            console.error('Invalid player format. Expected: jerseyNumber, jerseyName, fullName', line);
            errorCount++;
            continue;
          }
          
          const [jerseyNumberStr, jerseyName, playerName] = parts;
          const jerseyNumber = parseInt(jerseyNumberStr);
          
          if (isNaN(jerseyNumber)) {
            console.error('Invalid jersey number:', jerseyNumberStr);
            errorCount++;
            continue;
          }
          
          if (!jerseyName || !playerName) {
            console.error('Missing jersey name or player name:', line);
            errorCount++;
            continue;
          }
          
          await addPlayer(playerName, jerseyNumber, jerseyName);
          successCount++;
        } catch (lineError) {
          console.error('Error processing player line:', line, lineError);
          errorCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Added ${successCount} players to the database. ${errorCount > 0 ? `Failed to add ${errorCount} players.` : ''}`,
        variant: errorCount > 0 ? "destructive" : "default",
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
    
    // Set jersey information from player data
    setEditJerseyNumber(player.jerseyNumber || 0);
    setEditJerseyName(player.jerseyName || '');
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
    setEditPlayerName('');
    setEditJerseyNumber(0);
    setEditJerseyName('');
  };

  const handleSaveEdit = async () => {
    if (!editingPlayerId || !editPlayerName.trim()) {
      toast({
        title: "Error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }

    if (editJerseyName.trim() === '') {
      toast({
        title: "Error",
        description: "Jersey name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update player in database with all fields
      await updatePlayer(
        editingPlayerId, 
        editPlayerName, 
        editJerseyNumber, 
        editJerseyName
      );
      
      // No need to update local state - Firebase listener will handle it
      
      toast({
        title: "Success",
        description: "Player updated successfully",
      });
      
      // Exit edit mode
      setEditingPlayerId(null);
      setEditPlayerName('');
      setEditJerseyNumber(0);
      setEditJerseyName('');
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
  
  // File Upload handler (supports CSV, TXT, and XLSX)
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploadingCSV(true);
    
    // Check if it's an Excel file
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          let successCount = 0;
          let errorCount = 0;
          const errorDetails: string[] = [];
          
          console.log('Excel data parsed:', jsonData);
          
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            try {
              // Skip empty rows
              if (!row || row.length < 3 || !row[0]) {
                continue;
              }
              
              const [jerseyNumber, jerseyName, playerName] = row;
              
              if (!jerseyNumber || !jerseyName || !playerName) {
                console.error('Missing data in row:', row);
                errorDetails.push(`Row ${i + 1}: Missing data - ${JSON.stringify(row)}`);
                errorCount++;
                continue;
              }
              
              // Handle jersey numbers (could be numeric or string)
              let jerseyNum = typeof jerseyNumber === 'number' ? jerseyNumber : parseFloat(String(jerseyNumber));
              if (isNaN(jerseyNum)) {
                console.error('Invalid jersey number:', jerseyNumber);
                errorDetails.push(`Row ${i + 1}: Invalid jersey number "${jerseyNumber}"`);
                errorCount++;
                continue;
              }
              
              // Clean up the data
              const cleanJerseyName = String(jerseyName).trim();
              const cleanPlayerName = String(playerName).trim();
              
              if (!cleanJerseyName || !cleanPlayerName) {
                console.error('Empty jersey name or player name:', { jerseyName: cleanJerseyName, playerName: cleanPlayerName });
                errorDetails.push(`Row ${i + 1}: Empty jersey name or player name`);
                errorCount++;
                continue;
              }
              
              console.log(`Adding player: ${cleanPlayerName}, Jersey: ${jerseyNum}, Jersey Name: ${cleanJerseyName}`);
              await addPlayer(cleanPlayerName, jerseyNum, cleanJerseyName);
              successCount++;
            } catch (rowError) {
              console.error('Error processing row:', row, rowError);
              errorDetails.push(`Row ${i + 1}: Processing error - ${rowError}`);
              errorCount++;
            }
          }
          
          toast({
            title: "File Import Complete",
            description: `Successfully added ${successCount} players. ${errorCount > 0 ? `Failed to add ${errorCount} players.` : ''}`,
            variant: errorCount > 0 ? "destructive" : "default",
          });
          
          // Log error details for debugging
          if (errorDetails.length > 0) {
            console.log('Import errors:', errorDetails);
          }
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          console.error('Excel parsing error:', error);
          toast({
            title: "Error",
            description: "Failed to process Excel file. Please check the format.",
            variant: "destructive",
          });
        } finally {
          setIsUploadingCSV(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read Excel file",
          variant: "destructive",
        });
        setIsUploadingCSV(false);
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      // Handle CSV/TXT files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split('\n').filter(row => row.trim());
          
          let successCount = 0;
          let errorCount = 0;
          const errorDetails: string[] = [];
          
          for (const row of rows) {
            try {
              // Handle both comma and tab separated values
              const parts = row.includes('\t') ? row.split('\t') : row.split(',');
              const [jerseyNumber, jerseyName, playerName] = parts.map(item => item.trim());
              
              if (!jerseyNumber || !jerseyName || !playerName) {
                console.error('Missing data in row:', row);
                errorDetails.push(`Missing data: ${row}`);
                errorCount++;
                continue;
              }
              
              // Handle decimal jersey numbers by parsing as float
              const jerseyNum = parseFloat(jerseyNumber);
              if (isNaN(jerseyNum)) {
                console.error('Invalid jersey number:', jerseyNumber);
                errorDetails.push(`Invalid jersey number "${jerseyNumber}": ${row}`);
                errorCount++;
                continue;
              }
              
              await addPlayer(playerName, jerseyNum, jerseyName);
              successCount++;
            } catch (rowError) {
              console.error('Error processing row:', row, rowError);
              errorDetails.push(`Processing error: ${row}`);
              errorCount++;
            }
          }
          
          toast({
            title: "File Import Complete",
            description: `Successfully added ${successCount} players. ${errorCount > 0 ? `Failed to add ${errorCount} players.` : ''}`,
            variant: errorCount > 0 ? "destructive" : "default",
          });
          
          // Log error details for debugging
          if (errorDetails.length > 0) {
            console.log('Import errors:', errorDetails);
          }
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to process file. Please check the format.",
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
    }
  };

  return (
    <div className="space-y-8">
      {/* Player Management Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Players Management</h3>
        
        {/* Single Player Add Form */}
        {canEdit && (
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
                accept=".csv,.txt,.xlsx"
                className="hidden"
                onChange={handleCSVUpload}
                disabled={isUploadingCSV}
              />
              <button
                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition flex items-center"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCSV}
                title="Upload player data file (CSV/TXT/XLSX)"
              >
                {isUploadingCSV ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        )}
        
        {/* Players List */}
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 font-medium grid grid-cols-8 gap-2">
            <div className="col-span-1">Jersey #</div>
            <div className="col-span-1">Jersey Name</div>
            <div className="col-span-5">Player Name</div>
            <div className="col-span-1 text-center">Actions</div>
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
                <div key={playerId} className="px-4 py-3 grid grid-cols-8 gap-2 items-center">
                  {editingPlayerId === playerId ? (
                    // Edit mode
                    <>
                      <div className="col-span-1">
                        <input
                          type="number"
                          className="w-full px-3 py-1 border border-gray-300 rounded-md"
                          value={editJerseyNumber}
                          onChange={(e) => setEditJerseyNumber(e.target.value ? parseInt(e.target.value) : 0)}
                          min="0"
                        />
                      </div>
                      <div className="col-span-1">
                        <input
                          type="text"
                          className="w-full px-3 py-1 border border-gray-300 rounded-md"
                          value={editJerseyName}
                          onChange={(e) => setEditJerseyName(e.target.value)}
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          className="w-full px-3 py-1 border border-gray-300 rounded-md"
                          value={editPlayerName}
                          onChange={(e) => setEditPlayerName(e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex justify-center space-x-1">
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
                    </>
                  ) : (
                    // Display mode
                    <>
                      <div className="col-span-1 font-medium">{player.jerseyNumber || '-'}</div>
                      <div className="col-span-1">{player.jerseyName || '-'}</div>
                      <div className="col-span-5">{player.name}</div>
                      <div className="col-span-1 flex justify-center space-x-1">
                        {canEdit && (
                          <button 
                            className="text-blue-500 p-1 hover:bg-blue-50 rounded" 
                            onClick={() => handleEditClick({ ...player, id: playerId })}
                            title="Edit"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="text-red-500 p-1 hover:bg-red-50 rounded" 
                            onClick={() => handleDeleteClick(playerId)}
                            title="Delete"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
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
        <p className="text-gray-600 mb-4">
          Enter player data with each player on a new line using this format: <br />
          <code className="bg-gray-100 px-2 py-1 rounded text-sm">Jersey Number, Jersey Name, Full Player Name</code>
        </p>
        <div className="bg-amber-50 p-3 rounded-md mb-4 text-sm">
          <p className="font-semibold text-amber-700">Example:</p>
          <pre className="text-amber-800 mt-1">
            23, Mehdi, Huzaifa Mehdi<br />
            3, Mo, Moiz Ghadiali<br />
            7, Alam, Mohammed Alam
          </pre>
        </div>
        <div className="space-y-4">
          <textarea 
            className="w-full h-40 px-4 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]" 
            placeholder="23, Mehdi, Huzaifa Mehdi&#10;3, Mo, Moiz Ghadiali&#10;7, Alam, Mohammed Alam"
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
