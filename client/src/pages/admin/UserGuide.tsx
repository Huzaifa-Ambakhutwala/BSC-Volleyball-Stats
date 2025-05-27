import React, { useState } from 'react';
import { Book, Menu, X } from 'lucide-react';

const UserGuide = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  return (
    <div className="h-full flex bg-slate-50">
      {/* Mobile menu button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-700 text-white rounded-md focus:outline-none"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-800 text-white p-6 space-y-4 overflow-y-auto
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <h1 className="text-2xl font-semibold mb-6 text-teal-400 flex items-center">
          <Book className="w-6 h-6 mr-2" />
          🏐 Stat Tracker Guide
        </h1>
        <nav className="space-y-2">
          <button 
            onClick={() => handleNavClick('overview')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'overview' ? 'bg-teal-600 text-white' : ''}`}
          >
            1. Overview
          </button>
          <button 
            onClick={() => handleNavClick('admin-panel')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-panel' ? 'bg-teal-600 text-white' : ''}`}
          >
            2. Admin Panel
          </button>
          <button 
            onClick={() => handleNavClick('stat-tracking')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'stat-tracking' ? 'bg-teal-600 text-white' : ''}`}
          >
            3. Stat Tracking
          </button>
          <button 
            onClick={() => handleNavClick('scoreboard')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'scoreboard' ? 'bg-teal-600 text-white' : ''}`}
          >
            4. Scoreboard
          </button>
          <button 
            onClick={() => handleNavClick('faq')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'faq' ? 'bg-teal-600 text-white' : ''}`}
          >
            5. FAQ & Troubleshooting
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">1. Overview</h2>
              <p className="text-lg leading-relaxed">
                This interactive guide helps you understand the Burhani Sports Club Volleyball Stat Tracker. 
                The platform is designed to manage volleyball tournaments, track live stats, and provide 
                real-time and historical insights for teams, players, and administrators.
              </p>
              <p className="leading-relaxed">
                Key features include a robust admin panel, an intuitive stat tracking interface, a live 
                scoreboard, comprehensive match history, and dynamic leaderboards. Use the navigation on 
                the left to explore specific functionalities.
              </p>
            </section>
          )}

          {/* Admin Panel Section */}
          {activeSection === 'admin-panel' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">2. Admin Panel</h2>
              <p className="text-lg leading-relaxed">
                The Admin Panel is the control center for managing all aspects of your volleyball tournament. 
                From here, administrators can manage player registrations, team compositions, match schedules, 
                user passwords, and oversee player statistics.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Players Tab</h4>
                  <p className="text-blue-700 text-sm">Add, edit, and manage player information including jersey numbers and names.</p>
                </div>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Teams Tab</h4>
                  <p className="text-green-700 text-sm">Create teams, assign players, and set team colors for visual identification.</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Schedule Tab</h4>
                  <p className="text-purple-700 text-sm">Set up match schedules with court assignments and start times.</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Passwords Tab</h4>
                  <p className="text-orange-700 text-sm">Manage team passwords for stat tracking access control.</p>
                </div>
              </div>
            </section>
          )}

          {/* Stat Tracking Section */}
          {activeSection === 'stat-tracking' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">3. Stat Tracking</h2>
              <p className="text-lg leading-relaxed">
                The Stat Tracking interface is where teams record player statistics in real-time during matches.
              </p>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Stat Button Colors:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-green-500 text-white p-3 rounded-md text-center font-semibold">
                    Green: Earned Points
                    <div className="text-sm mt-1">Aces, Spikes, Blocks, Tips, Dumps</div>
                  </div>
                  <div className="bg-cyan-500 text-white p-3 rounded-md text-center font-semibold">
                    Blue: Neutral Actions
                    <div className="text-sm mt-1">Digs, Points, Neutral Blocks</div>
                  </div>
                  <div className="bg-red-500 text-white p-3 rounded-md text-center font-semibold">
                    Red: Faults
                    <div className="text-sm mt-1">Errors, Net Touches, Foot Faults</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-4 rounded">
                <p className="font-semibold">⚠️ Important:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Always select a player before clicking any stat buttons.</li>
                  <li>Green actions typically give your team a point.</li>
                  <li>Red actions usually give the opposing team a point.</li>
                  <li>Blue actions are neutral and don't affect the score directly.</li>
                  <li>Only the most recent stat entry can be undone.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Scoreboard Section */}
          {activeSection === 'scoreboard' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">4. Scoreboard</h2>
              <p className="text-lg leading-relaxed">
                The Scoreboard provides real-time visibility into ongoing matches across all courts. 
                This section displays live scores, player statistics, and match progress.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Live Scores:</strong> See current scores for all active matches.</li>
                <li><strong>Player Stats:</strong> View individual player performance in real-time.</li>
                <li><strong>Set Progress:</strong> Track which set is currently being played.</li>
                <li><strong>Team Information:</strong> See team names, colors, and compositions.</li>
                <li><strong>Court Status:</strong> Know which courts are active and which are free.</li>
              </ul>
            </section>
          )}

          {/* FAQ Section */}
          {activeSection === 'faq' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">5. FAQ & Troubleshooting</h2>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: What if I accidentally enter the wrong statistic?</h4>
                  <p className="text-slate-700">A: You can undo the most recent stat entry using the undo button. Only the latest entry can be undone, so check your entries carefully before continuing.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: Can I edit a match after it's been submitted?</h4>
                  <p className="text-slate-700">A: Yes, but it requires admin verification. Use the unlock button on the match card and enter admin credentials (Username: Mehdi, Password: 0000) to regain editing access.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: What if the scoreboard isn't updating?</h4>
                  <p className="text-slate-700">A: Refresh your browser page. The system updates in real-time, but sometimes a refresh helps if there are connectivity issues.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: How do I know which team should track stats?</h4>
                  <p className="text-slate-700">A: The "Tracker Team" is assigned when the match is created. Only that team will have access to track statistics for the match.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: What's the difference between different colored stat buttons?</h4>
                  <p className="text-slate-700">A: Green buttons are for actions that earn points (aces, spikes), blue buttons are for neutral actions (digs, assists), and red buttons are for faults that give points to the opposing team.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserGuide;