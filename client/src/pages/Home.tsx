import { Link } from 'wouter';
import VolleyballIcon from '@/components/VolleyballIcon';

const Home = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <VolleyballIcon className="h-24 w-24 text-[hsl(var(--vb-blue))] mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">BSCVolleyballStats</h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time volleyball statistics tracking for tournaments
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="w-16 h-16 bg-[hsl(var(--vb-blue))] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
              <p className="text-gray-600 mb-4">
                Manage players, create teams, and schedule matches
              </p>
              <Link href="/admin" className="btn-blue inline-block">
                Access Admin
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="w-16 h-16 bg-[hsl(var(--vb-yellow))] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Stat Tracker</h3>
              <p className="text-gray-600 mb-4">
                Record player stats and track scores in real-time
              </p>
              <Link href="/track" className="btn-blue inline-block">
                Track Stats
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="w-16 h-16 bg-[hsl(var(--vb-success))] text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Scoreboard</h3>
              <p className="text-gray-600 mb-4">
                Display live scores for each court in your tournament
              </p>
              <Link href="/scoreboard/1" className="btn-blue inline-block">
                View Scoreboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Tournament Management Made Easy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">Real-time Stats Tracking</h3>
              <p>
                Track aces, kills, blocks, digs, and more for every player. 
                See stats update instantly across all devices.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">Powerful Admin Controls</h3>
              <p>
                Easily add players in bulk, create balanced teams, and 
                schedule matches across multiple courts.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">Live Scoreboards</h3>
              <p>
                Display professional scoreboards on large screens during your tournament.
                Scores update in real-time as points are earned.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">Responsive Design</h3>
              <p>
                Use on any device - laptops for administration, tablets for stat tracking,
                and TVs for scoreboard displays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
