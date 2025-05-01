import { useState, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loginStatTracker } from '@/lib/firebase';
import type { Team } from '@shared/schema';
import { useEffect } from 'react';
import { listenToTeams } from '@/lib/firebase';
import { useLocation } from 'wouter';
import { Users, Loader2, Lock } from 'lucide-react';
import { TrackerUserContext } from '@/App';

const StatTrackerLogin = () => {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const { setTrackerUser } = useContext(TrackerUserContext);

  // Load teams
  useEffect(() => {
    setIsLoading(true);
    
    const unsubscribe = listenToTeams((teamsData) => {
      setTeams(teamsData);
      setIsLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    if (!selectedTeam) {
      toast({
        title: "Error",
        description: "Please select your team",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter your team password",
        variant: "destructive",
      });
      return;
    }

    console.log("Attempting login with team ID:", selectedTeam);
    setIsSubmitting(true);

    try {
      // Get the selected team from the local teams state to include team color
      const selectedTeamData = teams[selectedTeam];
      console.log("Selected team data:", selectedTeamData);
      
      if (!selectedTeamData) {
        console.error("Selected team not found in teams data");
        throw new Error("Team data not found");
      }
      
      const trackerUser = await loginStatTracker(selectedTeam, password);
      
      if (trackerUser) {
        console.log("Login successful, user data:", trackerUser);
        
        // Set the user in context
        setTrackerUser(trackerUser);
        
        // Force a check for matches immediately
        const matches = await getMatchesForTracker(selectedTeam);
        console.log("Available matches for this team:", matches);
        
        if (Object.keys(matches).length === 0) {
          console.warn("No matches found for this team. User may not see any matches.");
        }
        
        toast({
          title: "Success",
          description: `Logged in as ${trackerUser.teamName}`,
        });
        
        // Navigate to the stat tracking page
        setLocation('/tracker');
      } else {
        console.error("Login failed, no user returned");
        toast({
          title: "Error",
          description: "Failed to login. Please check your team password and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg font-medium">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <Users className="w-12 h-12 mx-auto text-[hsl(var(--vb-blue))]" />
          <h1 className="text-2xl font-bold mt-4">Stat Tracker Login</h1>
          <p className="text-gray-600 mt-2">Select your team to track stats for your assigned matches</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="teamSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Your Team
            </label>
            <select
              id="teamSelect"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select your team</option>
              {Object.entries(teams).map(([id, team]) => (
                <option key={id} value={id}>{team.teamName}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Team Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-[hsl(var(--vb-blue))] focus:border-[hsl(var(--vb-blue))]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter team password"
              />
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If this is your first login, the password you enter will be set as your team password.
            </p>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isSubmitting || !selectedTeam || !password}
            className="w-full bg-[hsl(var(--vb-blue))] text-white py-3 rounded-md hover:bg-[hsl(var(--vb-blue-darker))] transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatTrackerLogin;