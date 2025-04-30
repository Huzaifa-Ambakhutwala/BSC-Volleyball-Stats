import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { loginStatTracker } from '@/lib/firebase';
import type { Team } from '@shared/schema';
import { useEffect } from 'react';
import { listenToTeams } from '@/lib/firebase';
import { useLocation } from 'wouter';
import { Users, Loader2 } from 'lucide-react';

const StatTrackerLogin = () => {
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

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

    setIsSubmitting(true);

    try {
      const trackerUser = await loginStatTracker(selectedTeam);
      
      if (trackerUser) {
        toast({
          title: "Success",
          description: `Logged in as ${trackerUser.teamName}`,
        });
        
        // Navigate to the stat tracking page
        setLocation('/tracker');
      } else {
        toast({
          title: "Error",
          description: "Failed to login. Please try again.",
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
          
          <button
            onClick={handleLogin}
            disabled={isSubmitting || !selectedTeam}
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