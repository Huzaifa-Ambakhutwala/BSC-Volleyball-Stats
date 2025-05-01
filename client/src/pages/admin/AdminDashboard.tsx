import { useState } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import AddPlayers from './AddPlayers';
import CreateTeams from './CreateTeams';
import CreateSchedule from './CreateSchedule';
import ManagePasswords from './ManagePasswords';
import AllPlayerStats from './AllPlayerStats';

type AdminTab = 'players' | 'teams' | 'schedule' | 'passwords' | 'stats';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('players');
  const { isAuthenticated, logout } = useAuth();

  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/admin" />;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-[hsl(var(--vb-blue))] text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <button 
              onClick={logout} 
              className="text-sm text-white hover:text-[hsl(var(--vb-yellow))] transition"
            >
              Logout
            </button>
          </div>
          
          {/* Admin Tabs Section */}
          <div className="px-6 py-4 bg-gray-50">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                <button 
                  className={`px-6 py-3 border-b-2 font-medium ${
                    activeTab === 'players' 
                      ? 'border-[hsl(var(--vb-blue))] text-[hsl(var(--vb-blue))]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition whitespace-nowrap`}
                  onClick={() => setActiveTab('players')}
                >
                  Add Players
                </button>
                <button 
                  className={`px-6 py-3 border-b-2 font-medium ${
                    activeTab === 'teams' 
                      ? 'border-[hsl(var(--vb-blue))] text-[hsl(var(--vb-blue))]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition whitespace-nowrap`}
                  onClick={() => setActiveTab('teams')}
                >
                  Create Teams
                </button>
                <button 
                  className={`px-6 py-3 border-b-2 font-medium ${
                    activeTab === 'schedule' 
                      ? 'border-[hsl(var(--vb-blue))] text-[hsl(var(--vb-blue))]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition whitespace-nowrap`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Create Schedule
                </button>
                <button 
                  className={`px-6 py-3 border-b-2 font-medium ${
                    activeTab === 'passwords' 
                      ? 'border-[hsl(var(--vb-blue))] text-[hsl(var(--vb-blue))]' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } transition whitespace-nowrap`}
                  onClick={() => setActiveTab('passwords')}
                >
                  Manage Passwords
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'players' && <AddPlayers />}
            {activeTab === 'teams' && <CreateTeams />}
            {activeTab === 'schedule' && <CreateSchedule />}
            {activeTab === 'passwords' && <ManagePasswords />}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminDashboard;