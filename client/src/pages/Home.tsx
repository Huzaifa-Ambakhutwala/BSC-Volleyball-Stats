import { Link } from "wouter";
import VolleyballIcon from "@/components/VolleyballIcon";

const Home = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <VolleyballIcon className="h-32 w-32 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">
            BSC Volleyball Stat Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time volleyball statistics tracking for tournaments
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {/* Admin Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mb-4">
                {/* Settings Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Admin Panel</h3>
              <p className="text-gray-600 mb-4 text-center">
                Manage players, create teams, and schedule matches
              </p>
              <Link
                href="/admin"
                className="btn-blue inline-block w-full text-center"
              >
                Access Admin
              </Link>
            </div>

            {/* Stat Tracker */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center mb-4">
                {/* Bar Chart Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Stat Tracker</h3>
              <p className="text-gray-600 mb-4 text-center">
                Record player stats and track scores in real-time
              </p>
              <Link
                href="/tracker/login"
                className="btn-blue inline-block w-full text-center"
              >
                Track Stats
              </Link>
            </div>

            {/* Scoreboard */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4">
                {/* Monitor Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Scoreboard</h3>
              <p className="text-gray-600 mb-4 text-center">
                Display live scores for each court in your tournament
              </p>
              <Link
                href="/scoreboard/1"
                className="btn-blue inline-block w-full text-center"
              >
                View Scoreboard
              </Link>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mb-4">
                {/* Group Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
              <p className="text-gray-600 mb-4 text-center">
                View top-performing players from across the tournament
              </p>
              <Link
                href="/leaderboard"
                className="btn-blue inline-block w-full text-center"
              >
                View Leaderboard
              </Link>
            </div>

            {/* History */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-500 text-white rounded-full flex items-center justify-center mb-4">
                {/* Document Stack Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7h18M3 12h18M3 17h18"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">History</h3>
              <p className="text-gray-600 mb-4 text-center">
                View past matches and results from the tournament
              </p>
              <Link
                href="/history"
                className="btn-blue inline-block w-full text-center"
              >
                View History
              </Link>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-cyan-500 text-white rounded-full flex items-center justify-center mb-4">
                {/* Detailed Calendar Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect x="3" y="8" width="18" height="13" rx="2" ry="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 2v4M8 2v4M3 10h18M7 14h2m4 0h2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Schedule</h3>
              <p className="text-gray-600 mb-4 text-center">
                View the full match schedule for the tournament
              </p>
              <Link
                href="/schedule"
                className="btn-blue inline-block w-full text-center"
              >
                View Schedule
              </Link>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition flex flex-col items-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mb-4">
                {/* Feedback Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Feedback</h3>
              <p className="text-gray-600 mb-4 text-center">
                Share your thoughts, report bugs, or suggest improvements
              </p>
              <Link
                href="/feedback"
                className="btn-blue inline-block w-full text-center"
              >
                Give Feedback
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Tournament Management Made Easy
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">
                Real-time Stats Tracking
              </h3>
              <p>
                Track aces, kills, blocks, digs, and more for every player. See
                stats update instantly across all devices.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">
                Powerful Admin Controls
              </h3>
              <p>
                Easily add players in bulk, create balanced teams, and schedule
                matches across multiple courts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">Live Scoreboards</h3>
              <p>
                Display professional scoreboards on large screens during your
                tournament. Scores update in real-time as points are earned.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-3">Responsive Design</h3>
              <p>
                Use on any device - laptops for administration, tablets for stat
                tracking, and TVs for scoreboard displays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;
