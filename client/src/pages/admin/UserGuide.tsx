import React, { useState } from 'react';
import { Book, Menu, X } from 'lucide-react';

const UserGuide = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
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
          <a 
            href="#overview" 
            onClick={() => handleNavClick('overview')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'overview' ? 'bg-teal-600 text-white' : ''}`}
          >
            1. Overview
          </a>
          <div>
            <a 
              href="#admin-panel" 
              onClick={() => handleNavClick('admin-panel')}
              className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-panel' ? 'bg-teal-600 text-white' : ''}`}
            >
              2. Admin Panel
            </a>
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-600 pl-3">
              <a 
                href="#admin-login" 
                onClick={() => handleNavClick('admin-login')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-login' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.1 Logging In
              </a>
              <a 
                href="#admin-players" 
                onClick={() => handleNavClick('admin-players')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-players' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.2 Adding Players
              </a>
              <a 
                href="#admin-teams" 
                onClick={() => handleNavClick('admin-teams')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-teams' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.3 Managing Teams
              </a>
              <a 
                href="#admin-schedules" 
                onClick={() => handleNavClick('admin-schedules')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-schedules' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.4 Managing Schedules
              </a>
              <a 
                href="#admin-passwords" 
                onClick={() => handleNavClick('admin-passwords')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-passwords' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.5 Managing Passwords
              </a>
              <a 
                href="#admin-stats" 
                onClick={() => handleNavClick('admin-stats')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'admin-stats' ? 'bg-teal-600 text-white' : ''}`}
              >
                2.6 Player Stats Overview
              </a>
            </div>
          </div>
          <div>
            <a 
              href="#stat-tracking" 
              onClick={() => handleNavClick('stat-tracking')}
              className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'stat-tracking' ? 'bg-teal-600 text-white' : ''}`}
            >
              3. Stat Tracking
            </a>
            <div className="ml-4 mt-1 space-y-1 border-l border-slate-600 pl-3">
              <a 
                href="#tracker-login" 
                onClick={() => handleNavClick('tracker-login')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'tracker-login' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.1 Logging In (Tracker)
              </a>
              <a 
                href="#tracker-match-selection" 
                onClick={() => handleNavClick('tracker-match-selection')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'tracker-match-selection' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.2 Match Selection
              </a>
              <a 
                href="#tracker-flow" 
                onClick={() => handleNavClick('tracker-flow')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'tracker-flow' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.3 Stat Tracking Flow
              </a>
              <a 
                href="#tracker-unlock" 
                onClick={() => handleNavClick('tracker-unlock')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'tracker-unlock' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.4 Unlocking Matches
              </a>
              <a 
                href="#tracker-submit" 
                onClick={() => handleNavClick('tracker-submit')}
                className={`nav-link text-sm block py-1 px-2 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'tracker-submit' ? 'bg-teal-600 text-white' : ''}`}
              >
                3.5 Submitting Matches
              </a>
            </div>
          </div>
          <a 
            href="#scoreboard" 
            onClick={() => handleNavClick('scoreboard')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'scoreboard' ? 'bg-teal-600 text-white' : ''}`}
          >
            4. Scoreboard
          </a>
          <a 
            href="#history" 
            onClick={() => handleNavClick('history')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'history' ? 'bg-teal-600 text-white' : ''}`}
          >
            5. History
          </a>
          <a 
            href="#leaderboard" 
            onClick={() => handleNavClick('leaderboard')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'leaderboard' ? 'bg-teal-600 text-white' : ''}`}
          >
            6. Leaderboard
          </a>
          <a 
            href="#faq" 
            onClick={() => handleNavClick('faq')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'faq' ? 'bg-teal-600 text-white' : ''}`}
          >
            7. FAQ & Troubleshooting
          </a>
          <a 
            href="#glossary" 
            onClick={() => handleNavClick('glossary')}
            className={`nav-link block py-2 px-3 rounded-md hover:bg-slate-700 cursor-pointer ${activeSection === 'glossary' ? 'bg-teal-600 text-white' : ''}`}
          >
            8. Glossary
          </a>
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
                  <li>You can also upload an Excel file with player data using the "Upload Players from Excel" button.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Admin Teams Section */}
          {activeSection === 'admin-teams' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.3 Managing Teams</h3>
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
              <h3 className="text-2xl font-semibold text-slate-600">2.4 Managing Schedules</h3>
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
                  <li>Ensure the tracker team has their login credentials before the match.</li>
                </ul>
              </div>
            </section>
          )}

          {/* Admin Passwords Section */}
          {activeSection === 'admin-passwords' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">2.5 Managing Passwords</h3>
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
                  <li>Share team passwords securely with designated stat trackers.</li>
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
                <li>Go to the "Player Stats" tab in the Admin Panel.</li>
                <li>View aggregate statistics or apply filters to see stats by specific player or team.</li>
                <li>Export data for external analysis if needed.</li>
              </ol>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4 rounded">
                <p className="font-semibold">📊 Features:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Sort players by various metrics (points, aces, blocks, etc.)</li>
                  <li>Filter by specific matches or date ranges</li>
                  <li>View detailed breakdowns of player performance</li>
                </ul>
              </div>
            </section>
          )}

          {/* Stat Tracking Section */}
          {activeSection === 'stat-tracking' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">3. Stat Tracking</h2>
              <p className="text-lg leading-relaxed">
                The Stat Tracking interface is where the live action of a volleyball match is recorded. 
                Designated stat trackers log every point, error, and significant play. This section details 
                how to log in as a stat tracker, select a match, and accurately use the stat entry system, 
                including understanding the different action types and finalizing sets and matches.
              </p>
            </section>
          )}

          {/* Tracker Login Section */}
          {activeSection === 'tracker-login' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.1 Logging In (Tracker)</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/tracker</code> or click the "Stat Tracker" link.</li>
                <li>Enter your team ID and password (provided by the admin).</li>
                <li>You will see a list of matches assigned to your team for tracking.</li>
              </ol>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4 rounded">
                <p className="font-semibold">📝 Note:</p>
                <p className="mt-2">Only teams assigned as "tracker teams" for specific matches will have access to track those matches.</p>
              </div>
            </section>
          )}

          {/* Tracker Match Selection Section */}
          {activeSection === 'tracker-match-selection' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.2 Match Selection</h3>
              <p>Once logged in, match cards provide essential information at a glance:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Court number</li>
                <li>Start time</li>
                <li>Team names and their assigned colors</li>
                <li>Lock status (indicating if the match is editable)</li>
                <li>Current set and score information</li>
              </ul>
              <p className="mt-4">Click on a match card to begin tracking its statistics.</p>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-4 rounded">
                <p className="font-semibold">💡 Tip:</p>
                <p className="mt-2">Matches show different statuses: "Not Started", "In Progress", "Completed", or "Locked".</p>
              </div>
            </section>
          )}

          {/* Tracker Unlock Section */}
          {activeSection === 'tracker-unlock' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.4 Unlocking Matches</h3>
              <p>If a match is locked and requires changes, an admin can unlock it:</p>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Click "Unlock" on the locked match.</li>
                <li>Choose an admin from the list and enter their password.</li>
                <li>The sets will become editable again.</li>
                <li>This action will be logged in the audit trail for security and transparency.</li>
              </ol>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-4 rounded">
                <p className="font-semibold">⚠️ Important:</p>
                <p className="mt-2">Only use the unlock feature when absolutely necessary, as it affects data integrity.</p>
              </div>
            </section>
          )}

          {/* Tracker Submit Section */}
          {activeSection === 'tracker-submit' && (
            <section className="space-y-4">
              <h3 className="text-2xl font-semibold text-slate-600">3.5 Submitting Matches</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Finalizing a match locks it, preventing further edits by stat trackers.</li>
                <li>A confirmation dialog will appear before finalization to prevent accidental submissions.</li>
                <li>Once finalized, stats can no longer be edited unless an admin explicitly unlocks the match.</li>
                <li>This ensures data integrity for completed matches.</li>
              </ul>
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-4 rounded">
                <p className="font-semibold">🔒 Final Check:</p>
                <p className="mt-2">Always review all statistics before finalizing a match, as corrections after submission require admin intervention.</p>
              </div>
            </section>
          )}

          {/* Scoreboard Section */}
          {activeSection === 'scoreboard' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">4. Scoreboard</h2>
              <p className="text-lg leading-relaxed">
                The Scoreboard section provides a live overview of all ongoing matches. This is the place to 
                check real-time scores, see which set is currently being played on each court, and follow 
                the tournament's progress as it happens. This feature is accessible to all users and updates dynamically.
              </p>
              
              <h3 className="text-2xl font-semibold text-slate-600 mt-6">4.1 Viewing Live Scores</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Scoreboard" tab or section on the website.</li>
                <li>See all active courts, their live scores, and current set numbers displayed.</li>
                <li>Scores update automatically as stat trackers enter data.</li>
              </ol>
              
              <h3 className="text-2xl font-semibold text-slate-600 mt-6">4.2 Navigation (Scoreboard)</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Easily switch between different courts to view their live updates.</li>
                <li>Scores and set information update in real-time.</li>
                <li>Click on individual matches for more detailed statistics.</li>
              </ul>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-4 rounded">
                <p className="font-semibold">📺 Features:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Live score updates</li>
                  <li>Current set indicators</li>
                  <li>Team names and colors</li>
                  <li>Match status indicators</li>
                </ul>
              </div>
            </section>
          )}

          {/* History Section */}
          {activeSection === 'history' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">5. History</h2>
              <p className="text-lg leading-relaxed">
                The History section is an archive of all completed matches. Users can browse past games, 
                review detailed set scores, analyze player statistics for specific matches, and examine 
                the sequence of actions recorded. This is invaluable for post-match analysis, record-keeping, 
                and understanding player or team performance over time.
              </p>
              
              <h3 className="text-2xl font-semibold text-slate-600 mt-6">5.1 Viewing Past Matches</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "History" tab or section.</li>
                <li>You will see a list of all completed matches, sorted by date and time.</li>
                <li>Use filters to find specific matches, teams, or date ranges.</li>
              </ol>
              
              <h3 className="text-2xl font-semibold text-slate-600 mt-6">5.2 Match Details (History)</h3>
              <p>Click on any match in the history list to view comprehensive details, including:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Set scores for the entire match</li>
                <li>Individual player statistics for that specific match</li>
                <li>Detailed stat logs showing the sequence of actions recorded</li>
                <li>Timeline of events during the match</li>
              </ul>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-4 rounded">
                <p className="font-semibold">📊 Analysis Features:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Player performance breakdowns</li>
                  <li>Team comparison statistics</li>
                  <li>Action-by-action replay</li>
                  <li>Export options for detailed analysis</li>
                </ul>
              </div>
            </section>
          )}

          {/* Leaderboard Section */}
          {activeSection === 'leaderboard' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">6. Leaderboard</h2>
              <p className="text-lg leading-relaxed">
                The Leaderboard section showcases top-performing players and teams based on accumulated 
                statistics throughout the tournament. It allows users to sort and filter rankings by 
                various metrics, offering a competitive overview and highlighting standout performances. 
                This is a great way to track progress and recognize achievements.
              </p>
              
              <h3 className="text-2xl font-semibold text-slate-600 mt-6">6.1 Player Rankings</h3>
              <ol className="list-decimal list-inside space-y-2 pl-4">
                <li>Go to the "Leaderboard" tab or section.</li>
                <li>Sort players by various metrics such as total points, aces, blocks, kills, etc.</li>
                <li>Click on a player's name for a full breakdown of their individual statistics.</li>
                <li>Use filters to view rankings by position, team, or time period.</li>
              </ol>
              
              <h3 className="text-2xl font-semibold text-slate-600 mt-6">6.2 Team Rankings</h3>
              <p>The leaderboard also allows you to sort teams based on criteria like:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Number of wins and losses</li>
                <li>Total points scored across all matches</li>
                <li>Average points per match</li>
                <li>Overall team performance metrics</li>
              </ul>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-3 mt-4 rounded">
                <p className="font-semibold">🏆 Ranking Categories:</p>
                <ul className="list-disc list-inside pl-4 mt-2">
                  <li>Most Aces</li>
                  <li>Most Kills</li>
                  <li>Most Blocks</li>
                  <li>Highest Points</li>
                  <li>Best Win Rate</li>
                  <li>Most Improved Player</li>
                </ul>
              </div>
            </section>
          )}

          {/* Glossary Section */}
          {activeSection === 'glossary' && (
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-slate-700 border-b pb-2 mb-4">8. Glossary</h2>
              <p className="text-lg leading-relaxed">
                Understanding the terminology used within the Volleyball Stat Tracker is key to its effective use. 
                This glossary defines common terms you'll encounter while navigating the platform and recording statistics.
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Set:</strong> One segment of a volleyball match. Matches are typically played as best of 3 or best of 5 sets.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Stat Tracker:</strong> The designated team member or user responsible for entering live statistics during a match using the tracker interface.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Admin:</strong> A user with full access and privileges for managing the site, including player/team setup, scheduling, password management, and system oversight.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Action:</strong> A specific stat entry recorded during a match, such as a kill, ace, serve error, block, etc. These are categorized for clarity (Earned, Block, Fault).</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Kill:</strong> A successful attack by a player that results directly in a point.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Ace:</strong> A serve that results directly in a point, either by landing in the opponent's court untouched or being mishandled by the receiving team.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Block (Point):</strong> A defensive play at the net where a player successfully blocks an opponent's attack, resulting directly in a point.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Error/Fault:</strong> An action by a player or team that results in the opposing team being awarded a point (e.g., serve error, spike error, net touch).</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Dig:</strong> A defensive play where a player successfully passes a ball that has been attacked by the opponent.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Tip:</strong> A light, strategic touch over the net, usually with fingertips, designed to place the ball in an open area.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Dump:</strong> A strategic second-touch by the setter that results in a point, typically catching the defense off-guard.</p>
                </div>
                
                <div className="border-l-4 border-gray-300 pl-4">
                  <p><strong className="text-slate-700">Court:</strong> The designated playing area for a volleyball match. Multiple courts may be used simultaneously during tournaments.</p>
                </div>
              </div>
            </section>
          )}</old_str>

          {/* Stat Tracking Flow Section */}
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
                  <p className="text-slate-700">A: Yes, but it requires admin verification. Use the unlock button on the match card and enter admin credentials to regain editing access.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: What if the scoreboard isn't updating?</h4>
                  <p className="text-slate-700">A: Refresh your browser page. The system updates in real-time, but sometimes a refresh helps if there are connectivity issues.</p>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-slate-600 mb-2">Q: How do I know which team should track stats?</h4>
                  <p className="text-slate-700">A: The "Tracker Team" is assigned when the match is created. Only that team will have access to track statistics for the match.</p>
                </div>
              </div>
            </section>
          )}

          {/* Add more sections as needed */}
        </div>
      </main>
    </div>
  );
};

export default UserGuide;