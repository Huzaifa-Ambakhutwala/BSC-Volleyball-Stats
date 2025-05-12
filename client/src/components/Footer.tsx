import { Link } from "wouter";
import VolleyballIcon from "./VolleyballIcon";

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--vb-dark-blue))] text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/" className="flex items-center space-x-2">
              <VolleyballIcon className="h-6 w-6 text-[hsl(var(--vb-yellow))]" />
              <h2 className="text-lg font-bold">BSC Volleyball Stat Tracker</h2>
            </Link>
            <p className="text-sm text-gray-400 mt-1">Real-time volleyball statistics tracking</p>
          </div>
          <div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link href="/admin" className="hover:text-[hsl(var(--vb-yellow))] transition">
                    Admin
                  </Link>
                </li>
                <li>
                  <Link href="/track" className="hover:text-[hsl(var(--vb-yellow))] transition">
                    Stat Tracker
                  </Link>
                </li>
                <li>
                  <Link href="/scoreboard/1" className="hover:text-[hsl(var(--vb-yellow))] transition">
                    Scoreboard
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} BSC Volleyball Stat Tracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
