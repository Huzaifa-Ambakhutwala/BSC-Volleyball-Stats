import { Link } from "wouter";
import VolleyballIcon from "./VolleyballIcon";

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--vb-dark-blue))] text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <VolleyballIcon className="h-8 w-8" />
              <h2 className="text-lg font-bold">BSC Volleyball</h2>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              Professional volleyball tournament management with real-time statistics tracking and comprehensive analysis.
            </p>
          </div>

          {/* Tournament Pages */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Tournament</h3>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link href="/scoreboard/all" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Live Scoreboard
                  </Link>
                </li>
                <li>
                  <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <Link href="/schedule" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Schedule
                  </Link>
                </li>
                <li>
                  <Link href="/history" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Match History
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Statistics & Analysis */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Analytics</h3>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link href="/analysis" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Performance Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/tracker/login" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Stat Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/feedback" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Feedback
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Admin & Management */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Management</h3>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link href="/admin" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                    Admin Dashboard
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1WCvnOLQ0ckXN1gP5ZLHvZMwFEhYfeDqgHqpLZY0nF_0/edit#gid=0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition"
                  >
                    Tournament Schedule
                  </a>
                </li>
                <li>
                  <span className="text-sm text-gray-500">
                    Documentation
                  </span>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} BSC Volleyball Stat Tracker. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                Home
              </Link>
              <Link href="/feedback" className="text-sm text-gray-400 hover:text-[hsl(var(--vb-yellow))] transition">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
