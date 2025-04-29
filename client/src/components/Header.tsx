import { Link, useLocation } from "wouter";
import VolleyballIcon from "./VolleyballIcon";

const Header = () => {
  const [location] = useLocation();

  return (
    <header className="bg-[hsl(var(--vb-dark-blue))] text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <a className="flex items-center space-x-2">
            <VolleyballIcon className="h-8 w-8 text-[hsl(var(--vb-yellow))]" />
            <h1 className="text-xl font-bold tracking-wide">BSCVolleyballStats</h1>
          </a>
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/admin">
                <a className={`hover:text-[hsl(var(--vb-yellow))] transition ${location === '/admin' ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Admin
                </a>
              </Link>
            </li>
            <li>
              <Link href="/track">
                <a className={`hover:text-[hsl(var(--vb-yellow))] transition ${location === '/track' ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Stat Tracker
                </a>
              </Link>
            </li>
            <li>
              <Link href="/scoreboard/1">
                <a className={`hover:text-[hsl(var(--vb-yellow))] transition ${location.startsWith('/scoreboard') ? 'text-[hsl(var(--vb-yellow))]' : ''}`}>
                  Scoreboard
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
