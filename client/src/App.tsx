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
import LeaderboardPage from "@/pages/leaderboard/LeaderboardPage";
import SchedulePage from "@/pages/schedule/SchedulePage";
import FeedbackPage from "@/pages/FeedbackPage";
import Home from "@/pages/Home";
import { useEffect, useState, lazy, Suspense } from "react";
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
  setTrackerUser: () => { },
});

// Add dark mode context
export const DarkModeContext = createContext({
  darkMode: false,
  setDarkMode: (v: boolean) => { },
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
      // Use the current path to determine which login route to redirect to
      const currentPath = window.location.pathname;
      const loginPath = currentPath.includes('stat-tracker') ? '/stat-tracker/login' : '/tracker/login';
      setLocation(loginPath);
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
    const currentPath = window.location.pathname;
    const loginPath = currentPath.includes('stat-tracker') ? '/stat-tracker/login' : '/tracker/login';
    return <Redirect to={loginPath} />;
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
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin" component={LoginPage} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/tracker" component={TrackerRoute} />
          <Route path="/stat-tracker" component={TrackerRoute} />
          <Route path="/tracker/login">
            {() => {
              const user = getTrackerUser();
              return user ? <Redirect to="/tracker" /> : <StatTrackerLogin />;
            }}
          </Route>
          <Route path="/stat-tracker/login">
            {() => {
              const user = getTrackerUser();
              return user ? <Redirect to="/stat-tracker" /> : <StatTrackerLogin />;
            }}
          </Route>
          <Route path="/scoreboard/all" component={AllCourtsScoreboard} />
          <Route path="/scoreboard/:courtId" component={ScoreboardPage} />
          <Route path="/history" component={GameHistoryPage} />
          <Route path="/history/:matchId" component={MatchDetailsPage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/schedule" component={SchedulePage} />
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
                      <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">Team Match Debug Tool</h2>
                        <p className="mb-2">Select a team to debug matches for that team:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {Object.entries(data.teams).map(([id, team]: [string, any]) => (
                            <a
                              key={id}
                              href={`/debug/team/${id}`}
                              className="px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded text-center transition"
                            >
                              {team.teamName} <span className="text-xs text-gray-500">({id})</span>
                            </a>
                          ))}
                        </div>
                      </div>

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

          <Route path="/debug/team/:teamId">
            {(params) => {
              const teamId = params.teamId;
              const [loading, setLoading] = useState(true);
              const [team, setTeam] = useState<any>(null);
              const [matches, setMatches] = useState<Record<string, any>>({});
              const [teamMatches, setTeamMatches] = useState<any[]>([]);
              const [teams, setTeams] = useState<Record<string, any>>({});

              useEffect(() => {
                if (!teamId) {
                  setLoading(false);
                  return;
                }

                Promise.all([
                  import('./lib/firebase').then(module => module.getTeamById(teamId)),
                  import('./lib/firebase').then(module => module.getMatches()),
                  import('./lib/firebase').then(module => module.getTeams())
                ]).then(([teamData, allMatches, allTeams]) => {
                  setTeam(teamData);
                  setMatches(allMatches);
                  setTeams(allTeams);

                  // Filter matches where this team is the tracker
                  const relevantMatches = [];
                  for (const [matchId, match] of Object.entries(allMatches)) {
                    const trackerTeamId = String(match.trackerTeam || '').trim();
                    const currentTeamId = String(teamId || '').trim();

                    if (trackerTeamId === currentTeamId) {
                      relevantMatches.push({
                        ...match,
                        id: matchId,
                        matchType: 'exact'
                      });
                    } else if (
                      match.trackerTeam &&
                      teamId &&
                      (trackerTeamId.includes(currentTeamId) || currentTeamId.includes(trackerTeamId))
                    ) {
                      relevantMatches.push({
                        ...match,
                        id: matchId,
                        matchType: 'partial'
                      });
                    }
                  }

                  setTeamMatches(relevantMatches);
                  setLoading(false);
                }).catch(error => {
                  console.error("Error loading debug data:", error);
                  setLoading(false);
                });
              }, [params.teamId]);

              if (loading) {
                return <div className="p-6">Loading match data...</div>;
              }

              if (!team) {
                return <div className="p-6">Team not found with ID: {params.teamId}</div>;
              }

              return (
                <div className="container mx-auto p-6">
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h1 className="text-2xl font-bold mb-2">Team Match Debug</h1>

                    <div className="mb-4 p-3 bg-gray-100 rounded-md">
                      <h2 className="text-lg font-semibold mb-2">Team Information</h2>
                      <div>
                        <p><strong>Team ID:</strong> {params.teamId}</p>
                        <p><strong>Team Name:</strong> {team.teamName}</p>
                        <p><strong>Team Color:</strong> {team.teamColor || 'None'}</p>
                        <p><strong>Players:</strong> {team.players?.length || 0}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h2 className="text-lg font-semibold mb-2">
                        Matches This Team Is Assigned To Track ({teamMatches.length})
                      </h2>

                      {teamMatches.length === 0 ? (
                        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
                          <p className="font-semibold">No matches found for this team</p>
                          <p className="text-sm mt-1">This team is not assigned to track any matches</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {teamMatches.map(match => {
                            const teamA = teams[match.teamA];
                            const teamB = teams[match.teamB];

                            return (
                              <div key={match.id} className="border rounded-md p-3 bg-gray-50">
                                <div className="flex justify-between mb-2">
                                  <div>
                                    <span className="font-semibold">Match ID:</span> {match.id}
                                  </div>
                                  <div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      Court {match.courtNumber}
                                    </span>
                                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                      Game {match.gameNumber}
                                    </span>
                                  </div>
                                </div>

                                <div className="mb-2">
                                  <div><strong>Teams:</strong> {teamA?.teamName || 'Unknown'} vs {teamB?.teamName || 'Unknown'}</div>
                                  <div><strong>Score:</strong> {match.scoreA} - {match.scoreB}</div>
                                  <div><strong>Start Time:</strong> {match.startTime}</div>
                                </div>

                                <div className="mt-3 text-xs p-2 bg-gray-200 rounded">
                                  <div><strong>Debug Info:</strong></div>
                                  <div>Match Tracker Team: {match.trackerTeam}</div>
                                  <div>Current Team ID: {params.teamId}</div>
                                  <div>Match Type: {match.matchType}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          </Route>
          {/* Fallback to 404 */}
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  // Dark mode state and effect
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      return stored === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </main>
        <Footer />
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
