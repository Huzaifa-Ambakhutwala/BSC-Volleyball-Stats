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
    <div className="h-full flex bg-slate-50 text-slate-800">
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
          <div>
            <button 
              onClick={() => handleNavClick('admin-panel')}
              className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-panel' ? 'bg-teal-600 text-white' : ''}`}
            >
              2. Admin Panel
            </button>
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-600 pl-3">
              <button 
                onClick={() => handleNavClick('admin-login')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-login' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.1 Logging In
              </button>
              <button 
                onClick={() => handleNavClick('admin-players')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-players' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.2 Adding Players
              </button>
              <button 
                onClick={() => handleNavClick('admin-teams')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-teams' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.3 Managing Teams
              </button>
              <button 
                onClick={() => handleNavClick('admin-schedules')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-schedules' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.4 Managing Schedules
              </button>
              <button 
                onClick={() => handleNavClick('admin-passwords')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-passwords' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.5 Managing Passwords
              </button>
              <button 
                onClick={() => handleNavClick('admin-stats')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'admin-stats' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.6 Player Stats Overview
              </button>
            </div>
          </div>
          <div>
            <button 
              onClick={() => handleNavClick('stat-tracking')}
              className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'stat-tracking' ? 'bg-teal-600 text-white' : ''}`}
            >
              3. Stat Tracking
            </button>
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-600 pl-3">
              <button 
                onClick={() => handleNavClick('tracker-login')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'tracker-login' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.1 Logging In (Tracker)
              </button>
              <button 
                onClick={() => handleNavClick('tracker-match-selection')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'tracker-match-selection' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.2 Match Selection
              </button>
              <button 
                onClick={() => handleNavClick('tracker-flow')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'tracker-flow' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.3 Stat Tracking Flow
              </button>
              <button 
                onClick={() => handleNavClick('tracker-unlock')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'tracker-unlock' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.4 Unlocking Matches
              </button>
              <button 
                onClick={() => handleNavClick('tracker-submit')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'tracker-submit' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.5 Submitting Matches
              </button>
            </div>
          </div>
          <button 
            onClick={() => handleNavClick('scoreboard')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'scoreboard' ? 'bg-teal-600 text-white' : ''}`}
          >
            4. Scoreboard
          </button>
          <button 
            onClick={() => handleNavClick('history')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'history' ? 'bg-teal-600 text-white' : ''}`}
          >
            5. History
          </button>
          <button 
            onClick={() => handleNavClick('leaderboard')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'leaderboard' ? 'bg-teal-600 text-white' : ''}`}
          >
            6. Leaderboard
          </button>
          <button 
            onClick={() => handleNavClick('faq')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'faq' ? 'bg-teal-600 text-white' : ''}`}
          >
            7. FAQ & Troubleshooting
          </button>
          <button 
            onClick={() => handleNavClick('glossary')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'glossary' ? 'bg-teal-600 text-white' : ''}`}
          >
            8. Glossary
          </button>
          <button 
            onClick={() => handleNavClick('final-tips')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer w-full text-left ${activeSection === 'final-tips' ? 'bg-teal-600 text-white' : ''}`}
          >
            9. Final Tips
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
                user passwords, and oversee player statistics. This section will guide you through each 
                administrative function to ensure smooth tournament operations.
              </p>
            </section>
          )}

          {/* Admin Login Section */}
          {activeSection === 'admin-login' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.1 Logging In (Admin)</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/admin</code> or click the "Admin" link on the website.</li>
                <li>Enter your admin username and password.</li>
                <li>If you forget your credentials, contact the tournament director.</li>
              </ol>
            </section>
          )}

          {/* Admin Players Section */}
          {activeSection === 'admin-players' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.2 Adding Players</h3>
              <p>Effortlessly add and manage all your players:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Players" tab in the Admin Panel.</li>
                <li>Click "Add Player".</li>
                <li>Enter the player's name, jersey number, and (optionally) jersey name.</li>
                <li>Click "Save".</li>
              </ol>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-4 rounded">
                <p className="font-semibold">💡 Tips:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Use the ✏️ pencil icon to edit player details.</li>
                  <li>Use the 🗑️ trash icon to delete players.</li>
                  <li>Utilize the search bar to quickly find specific players.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Admin Teams Section */}
          {activeSection === 'admin-teams' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.3 Creating and Managing Teams</h3>
              <p>Organize your players into teams for the tournament:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Teams" tab.</li>
                <li>Click "Create Team".</li>
                <li>Enter a team name, select a distinct color, and assign players from the available list.</li>
                <li>Click "Save".</li>
              </ol>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-4 rounded">
                <p className="font-semibold">💡 Tips:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>The ✏️ pencil icon allows you to edit existing teams.</li>
                  <li>The 🗑️ trash icon is for deleting a team.</li>
                  <li>Team colors provide a quick visual distinction.</li>
                  <li>Players can be assigned to multiple teams if needed.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Admin Schedules Section */}
          {activeSection === 'admin-schedules' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.4 Creating and Managing Schedules</h3>
              <p>Set up your match schedule with ease:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Schedule" tab.</li>
                <li>Click "Create Match" or "Add to Schedule".</li>
                <li>Select the participating teams, court, date/time, and assign a tracker team responsible for live stat entry.</li>
                <li>Click "Save".</li>
              </ol>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-4 rounded">
                <p className="font-semibold">💡 Tips:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>You can edit or delete matches later.</li>
                  <li>The assigned tracker team can be changed if necessary.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Admin Passwords Section */}
          {activeSection === 'admin-passwords' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.5 Managing Passwords (Teams & Admins)</h3>
              <p>Secure your accounts and manage access:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Passwords" tab.</li>
                <li><strong>Team Passwords:</strong> Set or update passwords for each individual team.</li>
                <li><strong>Admin Passwords:</strong> Add, edit, or remove administrator users.</li>
              </ol>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-4 rounded">
                <p className="font-semibold">⚠️ Important:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Always use strong, unique passwords.</li>
                  <li>You cannot delete your own admin account or the last remaining admin account for security reasons.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Admin Stats Section */}
          {activeSection === 'admin-stats' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.6 Player Stats Overview</h3>
              <p>Access comprehensive player statistics:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Player Stats" or "Leaderboard" tab in the Admin Panel.</li>
                <li>View aggregate statistics or apply filters to see stats by specific player or team.</li>
              </ol>
            </section>
          )}

          {/* Stat Tracking Section */}
          {activeSection === 'stat-tracking' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">3. Stat Tracking</h2>
              <p className="text-lg leading-relaxed">
                The Stat Tracking interface is where teams record player statistics in real-time during matches.
              </p>
            </section>
          )}

          {/* Tracker Login Section */}
          {activeSection === 'tracker-login' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.1 Logging In (Tracker)</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Navigate to the "Tracker" section or use the direct link provided by the admin.</li>
                <li>Enter your team's assigned password.</li>
                <li>If your password doesn't work, contact your tournament coordinator.</li>
              </ol>
            </section>
          )}

          {/* Tracker Match Selection Section */}
          {activeSection === 'tracker-match-selection' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.2 Match Selection</h3>
              <p>Choose the match you want to track stats for:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>You'll see a list of available matches for your team.</li>
                <li>Click on the match card to enter the stat tracking interface.</li>
                <li>Confirm you're tracking the correct match by checking team names and court number.</li>
              </ol>
            </section>
          )}

          {/* Tracker Flow Section */}
          {activeSection === 'tracker-flow' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.3 Stat Tracking Flow</h3>
              <p>Follow this process for accurate stat tracking:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li><strong>Select a Player:</strong> Click on a player's name to select them for stat entry.</li>
                <li><strong>Choose the Action:</strong> Click the appropriate colored button for the action performed.</li>
                <li><strong>Verify Entry:</strong> Check that the stat was recorded correctly in the feed.</li>
                <li><strong>Undo if Needed:</strong> Use the undo button on the most recent entry if you made a mistake.</li>
                <li><strong>Switch Sets:</strong> Use set controls to track statistics for different sets.</li>
              </ol>
              
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

          {/* Tracker Unlock Section */}
          {activeSection === 'tracker-unlock' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.4 Unlocking Matches</h3>
              <p>If you need to edit a match that's been finalized:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Look for the "Unlock" button on the match card.</li>
                <li>Click "Unlock" and enter the admin credentials when prompted.</li>
                <li>Admin Username: <code className="bg-gray-100 px-2 py-1 rounded">Mehdi</code></li>
                <li>Admin Password: <code className="bg-gray-100 px-2 py-1 rounded">0000</code></li>
                <li>Once unlocked, you can resume editing the match statistics.</li>
              </ol>
            </section>
          )}

          {/* Tracker Submit Section */}
          {activeSection === 'tracker-submit' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.5 Submitting Matches</h3>
              <p>When your match is complete:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Complete each set by clicking "Submit Set" after recording all stats for that set.</li>
                <li>After all sets are complete, click "Submit Full Match" to finalize.</li>
                <li>Once submitted, the match becomes locked and requires admin unlock to edit.</li>
                <li>Verify all statistics are correct before final submission.</li>
              </ol>
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

          {/* History Section */}
          {activeSection === 'history' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">5. History</h2>
              <p className="text-lg leading-relaxed">
                Access comprehensive historical data for completed matches, including detailed statistics 
                and performance analytics.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Match Results:</strong> View final scores and outcomes.</li>
                <li><strong>Player Performance:</strong> See detailed stats for each player across matches.</li>
                <li><strong>Team Analytics:</strong> Compare team performance over time.</li>
                <li><strong>Search & Filter:</strong> Find specific matches or players quickly.</li>
              </ul>
            </section>
          )}

          {/* Leaderboard Section */}
          {activeSection === 'leaderboard' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">6. Leaderboard</h2>
              <p className="text-lg leading-relaxed">
                Dynamic rankings showcase top performers across various statistical categories.
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li><strong>Overall Rankings:</strong> See top players based on comprehensive performance metrics.</li>
                <li><strong>Category Leaders:</strong> View leaders in specific stats like aces, spikes, or blocks.</li>
                <li><strong>Team Rankings:</strong> Compare team performance and standings.</li>
                <li><strong>Performance Trends:</strong> Track how rankings change over time.</li>
              </ul>
            </section>
          )}

          {/* FAQ Section */}
          {activeSection === 'faq' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">7. FAQ & Troubleshooting</h2>
              
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

          {/* Glossary Section */}
          {activeSection === 'glossary' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">8. Glossary</h2>
              
              <div className="space-y-4">
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Ace:</strong> A serve that directly results in a point without the opposing team touching the ball.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Spike:</strong> An aggressive attacking hit intended to put the ball down in the opponent's court.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Block:</strong> A defensive play at the net to deflect or stop an opponent's attack.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Dig:</strong> A defensive play to keep the ball in play after an opponent's attack.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Set:</strong> A portion of a volleyball match, typically played to 25 points (must win by 2).</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Court:</strong> The designated playing area for a volleyball match. Multiple courts may be used simultaneously during tournaments.</p>
                </div>
              </div>
            </section>
          )}

          {/* Final Tips Section */}
          {activeSection === 'final-tips' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">9. Final Tips</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Best Practices</h4>
                  <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                    <li>Double-check player selection before entering stats</li>
                    <li>Communicate with your team about who's tracking stats</li>
                    <li>Keep track of set numbers to avoid confusion</li>
                    <li>Use the undo feature immediately if you make a mistake</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Quick Reference</h4>
                  <ul className="list-disc list-inside text-green-700 text-sm space-y-1">
                    <li>Admin credentials: Username "Mehdi", Password "0000"</li>
                    <li>Green buttons = Points earned, Red buttons = Faults, Blue buttons = Neutral</li>
                    <li>Each match consists of up to 3 sets</li>
                    <li>Submit each set individually, then submit the full match</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Need Help?</h4>
                  <p className="text-yellow-700 text-sm">If you encounter any issues not covered in this guide, contact your tournament administrator or refer to the FAQ section for common troubleshooting steps.</p>
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