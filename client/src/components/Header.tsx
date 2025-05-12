import { Link, useLocation } from "wouter";
import VolleyballIcon from "./VolleyballIcon";

const Header = () => {
  const [location] = useLocation();

  return (
    <header className="bg-[hsl(var(--vb-dark-blue))] text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <VolleyballIcon className="h-8 w-8 text-[hsl(var(--vb-yellow))]" />
          <h1 className="text-xl font-bold tracking-wide">BSC Volleyball Stat Tracker</h1>
        </Link>
        <div className="flex items-center space-x-4">
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/admin"
                  className={`hover:text-[hsl(var(--vb-yellow))] transition ${location === '/admin' || location.startsWith('/admin/') ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Admin
                </Link>
              </li>
              <li>
                <Link href="/tracker/login"
                  className={`hover:text-[hsl(var(--vb-yellow))] transition ${location.startsWith('/tracker') ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Stat Tracker
                </Link>
              </li>
              <li>
                <Link href="/scoreboard/1"
                  className={`hover:text-[hsl(var(--vb-yellow))] transition ${location.startsWith('/scoreboard') ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Scoreboard
                </Link>
              </li>
              <li>
                <Link href="/history"
                  className={`hover:text-[hsl(var(--vb-yellow))] transition ${location.startsWith('/history') ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  History
                </Link>
              </li>
              <li>
                <Link href="/leaderboard"
                  className={`hover:text-[hsl(var(--vb-yellow))] transition ${location.startsWith('/leaderboard') ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Leaderboard
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
