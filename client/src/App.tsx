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
import ScoreboardPage from "@/pages/scoreboard/ScoreboardPage";
import Home from "@/pages/Home";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin" component={LoginPage} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/track" component={StatTrackerPage} />
          <Route path="/scoreboard/:courtId" component={ScoreboardPage} />
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
