import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginPage from "@/pages/admin/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import StatTrackerPage from "@/pages/tracker/StatTrackerPage";
import StatTrackerLogin from "@/pages/tracker/StatTrackerLogin";
import ScoreboardPage from "@/pages/scoreboard/ScoreboardPage";
import AllCourtsScoreboard from "@/pages/scoreboard/AllCourtsScoreboard";
import GameHistoryPage from "@/pages/history/GameHistoryPage";
import MatchDetailsPage from "@/pages/history/MatchDetailsPage";
import Home from "@/pages/Home";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getTrackerUser, type TrackerUser } from "@/lib/firebase";

// Context for tracker authentication
import { createContext } from "react";

// Create context for tracker user
export const TrackerUserContext = createContext<{
  trackerUser: TrackerUser | null;
  setTrackerUser: (user: TrackerUser | null) => void;
}>({
  trackerUser: null,
  setTrackerUser: () => {},
});

// Protected route for stat tracker
const TrackerRoute = () => {
  const [trackerUser, setTrackerUser] = useState<TrackerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is logged in as a tracker
    const user = getTrackerUser();
    console.log("TrackerRoute - Retrieved tracker user from localStorage:", user);
    
    if (!user) {
      console.log("TrackerRoute - No user found, redirecting to login");
      setIsLoading(false);
      setLocation('/tracker/login');
      return;
    }
    
    console.log("TrackerRoute - User found, team ID:", user.teamId);
    
    // Important: Set the user state BEFORE setting loading to false
    setTrackerUser(user);
    
    // Slight delay to ensure context is properly updated
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  }, [setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading tracker user data...</div>;
  }

  // Redirect to login if not authenticated
  if (!trackerUser) {
    console.log("TrackerRoute - TrackerUser is null after loading, redirecting to login");
    return <Redirect to="/tracker/login" />;
  }

  console.log("TrackerRoute - Rendering StatTrackerPage with user:", trackerUser);
  
  // Render the StatTrackerPage with context if authenticated
  return (
    <TrackerUserContext.Provider value={{ trackerUser, setTrackerUser }}>
      <StatTrackerPage />
    </TrackerUserContext.Provider>
  );
};

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin" component={LoginPage} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/tracker" component={TrackerRoute} />
          <Route path="/tracker/login">
            {() => {
              const user = getTrackerUser();
              return user ? <Redirect to="/tracker" /> : <StatTrackerLogin />;
            }}
          </Route>
          <Route path="/scoreboard/all" component={AllCourtsScoreboard} />
          <Route path="/scoreboard/:courtId" component={ScoreboardPage} />
          <Route path="/history" component={GameHistoryPage} />
          <Route path="/history/:matchId" component={MatchDetailsPage} />
          <Route path="/debug">
            {() => {
              const [loading, setLoading] = useState(true);
              const [data, setData] = useState<any>({ matches: {}, teams: {} });
              
              // Load all matches and teams for debugging
              useEffect(() => {
                const { getMatches, getTeams } = require('./lib/firebase');
                
                Promise.all([getMatches(), getTeams()])
                  .then(([matches, teams]) => {
                    console.log("DEBUG - All Matches:", matches);
                    console.log("DEBUG - All Teams:", teams);
                    
                    // Log info about each match
                    Object.entries(matches).forEach(([id, match]: [string, any]) => {
                      const trackerTeamName = teams[match.trackerTeam]?.teamName || 'Unknown';
                      console.log(`Match ${id} - Court ${match.courtNumber}`);
                      console.log(`- Tracker Team: ${trackerTeamName} (ID: ${match.trackerTeam})`);
                      console.log(`- TeamA: ${teams[match.teamA]?.teamName || 'Unknown'} (ID: ${match.teamA})`);
                      console.log(`- TeamB: ${teams[match.teamB]?.teamName || 'Unknown'} (ID: ${match.teamB})`);
                      console.log('---');
                    });
                    
                    setData({ matches, teams });
                    setLoading(false);
                  })
                  .catch(error => {
                    console.error("Error loading debug data:", error);
                    setLoading(false);
                  });
              }, []);
              
              return (
                <div className="container mx-auto p-6">
                  <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
                  {loading ? (
                    <p>Loading data...</p>
                  ) : (
                    <div>
                      <h2 className="text-xl font-semibold mt-4 mb-2">Matches ({Object.keys(data.matches).length})</h2>
                      <div className="bg-gray-100 p-4 rounded mb-4">
                        <ul className="space-y-2">
                          {Object.entries(data.matches).map(([id, match]: [string, any]) => (
                            <li key={id} className="border-b pb-2">
                              <strong>Match ID: {id}</strong>
                              <div className="text-sm">
                                <p>Court: {match.courtNumber}</p>
                                <p>Tracker Team: {data.teams[match.trackerTeam]?.teamName || 'Unknown'} (ID: {match.trackerTeam})</p>
                                <p>Team A: {data.teams[match.teamA]?.teamName || 'Unknown'}</p>
                                <p>Team B: {data.teams[match.teamB]?.teamName || 'Unknown'}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <h2 className="text-xl font-semibold mt-4 mb-2">Teams ({Object.keys(data.teams).length})</h2>
                      <div className="bg-gray-100 p-4 rounded">
                        <ul className="space-y-2">
                          {Object.entries(data.teams).map(([id, team]: [string, any]) => (
                            <li key={id} className="border-b pb-2">
                              <strong>Team ID: {id}</strong>
                              <div className="text-sm">
                                <p>Name: {team.teamName}</p>
                                <p>Players: {team.players?.length || 0}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          </Route>
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
