import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getTeams, 
  listenToTeams, 
  getTeamPassword, 
  setTeamPassword, 
  getAdminUsers, 
  addAdminUser, 
  updateAdminUser, 
  deleteAdminUser,
  AdminUser as FirebaseAdminUser
} from '@/lib/firebase';
import type { Team } from '@shared/schema';
import { Lock, Edit, Check, X, Loader2, KeyRound, PlusCircle, Eye, EyeOff, User, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

// Using the Firebase admin user type instead of creating a new one

const ManagePasswords = () => {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [teamPasswords, setTeamPasswords] = useState<Record<string, string>>({});
  const [adminUsers, setAdminUsers] = useState<FirebaseAdminUser[]>([]);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [showAdminPasswordMap, setShowAdminPasswordMap] = useState<Record<string, boolean>>({});
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingAdminIndex, setEditingAdminIndex] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [newAdminUsername, setNewAdminUsername] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [showAddAdminForm, setShowAddAdminForm] = useState<boolean>(false);
  const [showAddTeamForm, setShowAddTeamForm] = useState<boolean>(false);
  const [newTeamId, setNewTeamId] = useState<string>('');
  const [newTeamPassword, setNewTeamPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const { isAuthenticated, username } = useAuth();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/admin/login');
    }
  }, [isAuthenticated, setLocation]);

  // Load teams and admin users
  useEffect(() => {
    setLoading(true);
    
    // Load admin users
    const loadAdminUsers = async () => {
      try {
        const admins = await getAdminUsers();
        setAdminUsers(admins);
      } catch (error) {
        console.error('Error loading admin users:', error);
      }
    };
    
    loadAdminUsers();
    
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
  
  const togglePasswordVisibility = (teamId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };
  
  const toggleAdminPasswordVisibility = (index: number) => {
    setShowAdminPasswordMap(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const handleAddAdmin = async () => {
    if (!newAdminUsername || !newAdminPassword) {
      toast({
        title: "Error",
        description: "Username and password cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const success = await addAdminUser(newAdminUsername, newAdminPassword);
    
    if (success) {
      // Refresh admin users
      const admins = await getAdminUsers();
      setAdminUsers(admins);
      
      setNewAdminUsername('');
      setNewAdminPassword('');
      setShowAddAdminForm(false);
      
      toast({
        title: "Success",
        description: `Admin ${newAdminUsername} added successfully`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to add admin. Username may already exist.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditAdmin = (index: number) => {
    setEditingAdminIndex(index);
    setNewPassword(adminUsers[index].password);
  };
  
  const handleSaveAdminPassword = async (username: string) => {
    if (!newPassword) {
      toast({
        title: "Error",
        description: "Password cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const success = await updateAdminUser(username, newPassword);
    
    if (success) {
      // Refresh admin users
      const admins = await getAdminUsers();
      setAdminUsers(admins);
      
      toast({
        title: "Success",
        description: `Password updated for ${username}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update password",
        variant: "destructive",
      });
    }
    
    setEditingAdminIndex(null);
    setNewPassword('');
  };
  
  const handleDeleteAdmin = async (username: string) => {
    // Cannot delete the currently logged in admin
    if (username === username) {
      toast({
        title: "Error",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    const success = await deleteAdminUser(username);
    
    if (success) {
      // Refresh admin users
      const admins = await getAdminUsers();
      setAdminUsers(admins);
      
      toast({
        title: "Success",
        description: `Admin ${username} deleted successfully`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete admin. Cannot delete the last admin account.",
        variant: "destructive",
      });
    }
  };
  
  const handleAddTeam = async () => {
    if (!newTeamId || !newTeamPassword) {
      toast({
        title: "Error",
        description: "Team and password cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    // Check if team exists
    if (!teams[newTeamId]) {
      toast({
        title: "Error",
        description: "Team ID not found",
        variant: "destructive",
      });
      return;
    }
    
    const success = await setTeamPassword(newTeamId, newTeamPassword);
    
    if (success) {
      setTeamPasswords(prev => ({
        ...prev,
        [newTeamId]: newTeamPassword
      }));
      
      setNewTeamId('');
      setNewTeamPassword('');
      setShowAddTeamForm(false);
      
      toast({
        title: "Success",
        description: `Password set for ${teams[newTeamId].teamName}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to set team password",
        variant: "destructive",
      });
    }
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
      {/* Admin Users Section */}
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <User className="w-6 h-6 mr-2" />
        Manage Admin Credentials
      </h1>
      
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="grid grid-cols-12 gap-4 w-full font-medium text-gray-600">
            <div className="col-span-4">Username</div>
            <div className="col-span-5">Password</div>
            <div className="col-span-3">Actions</div>
          </div>
          <button 
            onClick={() => setShowAddAdminForm(!showAddAdminForm)}
            className="flex items-center text-sm bg-[hsl(var(--vb-blue))] text-white px-3 py-2 rounded-md hover:bg-opacity-90"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Add Admin
          </button>
        </div>

        {showAddAdminForm && (
          <div className="grid grid-cols-12 gap-4 p-4 items-center border-b bg-gray-50">
            <div className="col-span-4">
              <input
                type="text"
                value={newAdminUsername}
                onChange={(e) => setNewAdminUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                placeholder="Enter admin username"
              />
            </div>
            <div className="col-span-5">
              <input
                type="text"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                placeholder="Enter admin password"
              />
            </div>
            <div className="col-span-3 flex space-x-2">
              <button
                onClick={handleAddAdmin}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                title="Save"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowAddAdminForm(false);
                  setNewAdminUsername('');
                  setNewAdminPassword('');
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {adminUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No admin users found. Add an admin user to get started.
          </div>
        ) : (
          adminUsers.map((admin, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-b-0 hover:bg-gray-50">
              <div className="col-span-4 font-medium">{admin.username}</div>
              
              <div className="col-span-5">
                {editingAdminIndex === index ? (
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
                    {showAdminPasswordMap[index] ? (
                      <span>{admin.password}</span>
                    ) : (
                      <span>••••••••</span>
                    )}
                    <button
                      onClick={() => toggleAdminPasswordVisibility(index)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                      title={showAdminPasswordMap[index] ? "Hide Password" : "Show Password"}
                    >
                      {showAdminPasswordMap[index] ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="col-span-3 flex space-x-2">
                {editingAdminIndex === index ? (
                  <>
                    <button
                      onClick={() => handleSaveAdminPassword(admin.username)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                      title="Save"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingAdminIndex(null);
                        setNewPassword('');
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Cancel"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditAdmin(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit Password"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {admin.username !== username && (
                      <button
                        onClick={() => handleDeleteAdmin(admin.username)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Delete Admin"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Team Passwords Section */}
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Users className="w-6 h-6 mr-2" />
        Manage Team Credentials
      </h1>
      
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="grid grid-cols-12 gap-4 w-full font-medium text-gray-600">
            <div className="col-span-4">Team</div>
            <div className="col-span-5">Password</div>
            <div className="col-span-3">Actions</div>
          </div>
          <button 
            onClick={() => setShowAddTeamForm(!showAddTeamForm)}
            className="flex items-center text-sm bg-[hsl(var(--vb-blue))] text-white px-3 py-2 rounded-md hover:bg-opacity-90"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Add Team Password
          </button>
        </div>

        {showAddTeamForm && (
          <div className="grid grid-cols-12 gap-4 p-4 items-center border-b bg-gray-50">
            <div className="col-span-4">
              <select
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              >
                <option value="">Select Team</option>
                {Object.entries(teams)
                  .filter(([id, _]) => !teamPasswords[id])
                  .map(([id, team]) => (
                    <option key={id} value={id}>{team.teamName}</option>
                  ))}
              </select>
            </div>
            <div className="col-span-5">
              <input
                type="text"
                value={newTeamPassword}
                onChange={(e) => setNewTeamPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                placeholder="Enter team password"
              />
            </div>
            <div className="col-span-3 flex space-x-2">
              <button
                onClick={handleAddTeam}
                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                title="Save"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowAddTeamForm(false);
                  setNewTeamId('');
                  setNewTeamPassword('');
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                title="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

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
                    {!teamPasswords[teamId] ? (
                      <span className="text-gray-400 italic">No password set</span>
                    ) : showPasswordMap[teamId] ? (
                      <span>{teamPasswords[teamId]}</span>
                    ) : (
                      <span>••••••••</span>
                    )}
                    {teamPasswords[teamId] && (
                      <button
                        onClick={() => togglePasswordVisibility(teamId)}
                        className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                        title={showPasswordMap[teamId] ? "Hide Password" : "Show Password"}
                      >
                        {showPasswordMap[teamId] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
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