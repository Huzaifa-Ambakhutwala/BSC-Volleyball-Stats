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
    setTrackerUser(user);
    setIsLoading(false);
    
    if (!user) {
      setLocation('/tracker/login');
    }
  }, [setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // Render the StatTrackerPage with context if authenticated
  return trackerUser ? (
    <TrackerUserContext.Provider value={{ trackerUser, setTrackerUser }}>
      <StatTrackerPage />
    </TrackerUserContext.Provider>
  ) : null;
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
          <Route path="/tracker/login" component={StatTrackerLogin} />
          <Route path="/scoreboard/all" component={AllCourtsScoreboard} />
          <Route path="/scoreboard/:courtId" component={ScoreboardPage} />
          <Route path="/history" component={GameHistoryPage} />
          <Route path="/history/:matchId" component={MatchDetailsPage} />
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
