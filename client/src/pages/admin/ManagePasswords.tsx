import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getTeams, listenToTeams, getTeamPassword, setTeamPassword } from '@/lib/firebase';
import type { Team } from '@shared/schema';
import { Lock, Edit, Check, X, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

const ManagePasswords = () => {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [teamPasswords, setTeamPasswords] = useState<Record<string, string>>({});
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, setLocation]);

  // Load teams
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = listenToTeams((teamsData) => {
      setTeams(teamsData);
      
      // Load passwords for all teams
      Object.keys(teamsData).forEach(async (teamId) => {
        const password = await getTeamPassword(teamId);
        if (password) {
          setTeamPasswords(prev => ({
            ...prev,
            [teamId]: password
          }));
        }
      });
      
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleEditPassword = (teamId: string) => {
    setEditingTeamId(teamId);
    setNewPassword(teamPasswords[teamId] || '');
  };

  const handleSavePassword = async (teamId: string) => {
    if (!newPassword) {
      toast({
        title: "Error",
        description: "Password cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const success = await setTeamPassword(teamId, newPassword);
    
    if (success) {
      setTeamPasswords(prev => ({
        ...prev,
        [teamId]: newPassword
      }));
      
      toast({
        title: "Success",
        description: `Password updated for ${teams[teamId].teamName}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
    
    setEditingTeamId(null);
    setNewPassword('');
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setNewPassword('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--vb-blue))]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <KeyRound className="w-6 h-6 mr-2" />
        Manage Team Passwords
      </h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-12 gap-4 p-4 font-medium text-gray-600 border-b">
          <div className="col-span-4">Team</div>
          <div className="col-span-5">Password</div>
          <div className="col-span-3">Actions</div>
        </div>

        {Object.entries(teams).length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No teams found. Add teams to manage their passwords.
          </div>
        ) : (
          Object.entries(teams).map(([teamId, team]) => (
            <div key={teamId} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-b-0 hover:bg-gray-50">
              <div className="col-span-4 font-medium">{team.teamName}</div>
              
              <div className="col-span-5">
                {editingTeamId === teamId ? (
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                    placeholder="Enter new password"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{teamPasswords[teamId] ? '••••••••' : 'No password set'}</span>
                  </div>
                )}
              </div>
              
              <div className="col-span-3 flex space-x-2">
                {editingTeamId === teamId ? (
                  <>
                    <button
                      onClick={() => handleSavePassword(teamId)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Save"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEditPassword(teamId)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                    title="Edit Password"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManagePasswords;