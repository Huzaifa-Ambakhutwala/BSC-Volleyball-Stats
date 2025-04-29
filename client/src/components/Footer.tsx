import { Link } from "wouter";
import VolleyballIcon from "./VolleyballIcon";

const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--vb-dark-blue))] text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <VolleyballIcon className="h-6 w-6 text-[hsl(var(--vb-yellow))]" />
                <h2 className="text-lg font-bold">BSCVolleyballStats</h2>
              </a>
            </Link>
            <p className="text-sm text-gray-400 mt-1">Real-time volleyball statistics tracking</p>
          </div>
          <div>
            <nav>
              <ul className="flex space-x-4">
                <li>
                  <Link href="/admin">
                    <a className="hover:text-[hsl(var(--vb-yellow))] transition">Admin</a>
                  </Link>
                </li>
                <li>
                  <Link href="/track">
                    <a className="hover:text-[hsl(var(--vb-yellow))] transition">Stat Tracker</a>
                  </Link>
                </li>
                <li>
                  <Link href="/scoreboard/1">
                    <a className="hover:text-[hsl(var(--vb-yellow))] transition">Scoreboard</a>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} BSCVolleyballStats. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
