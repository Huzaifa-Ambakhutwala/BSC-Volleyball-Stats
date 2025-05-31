import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Download, Search, Filter, Calendar, User, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { database, ref, get, onValue, off } from '@/lib/firebase';

interface TrackerLog {
  id: string;
  teamName: string;
  action: string;
  timestamp: string;
  matchId?: string;
  set?: number;
  playerId?: string;
  details?: string;
  createdAt: string;
}

const TrackerLogs = () => {
  const [logs, setLogs] = useState<TrackerLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<TrackerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const { toast } = useToast();

  // Get unique teams and actions for filters
  const uniqueTeams = Array.from(new Set(logs.map(log => log.teamName))).sort();
  const uniqueActions = Array.from(new Set(logs.map(log => log.action))).sort();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, teamFilter, actionFilter, dateFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const logsRef = ref(database, 'trackerLogs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const logsData = snapshot.val();
        const logsArray = Object.entries(logsData).map(([id, log]: [string, any]) => ({
          id,
          ...log,
        }));
        // Sort by timestamp, newest first
        logsArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(logsArray);
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tracker logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Team filter
    if (teamFilter) {
      filtered = filtered.filter(log => log.teamName === teamFilter);
    }

    // Action filter
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredLogs(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Team', 'Action', 'Match ID', 'Set', 'Player ID', 'Details'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${log.teamName}"`,
        `"${log.action}"`,
        log.matchId || '',
        log.set || '',
        log.playerId || '',
        `"${log.details || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tracker-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTeamFilter('');
    setActionFilter('');
    setDateFilter('');
  };

  const getActionColor = (action: string) => {
    if (action.includes('Add')) return 'text-green-600 bg-green-50';
    if (action.includes('Delete')) return 'text-red-600 bg-red-50';
    if (action.includes('Score')) return 'text-blue-600 bg-blue-50';
    if (action.includes('Submit')) return 'text-purple-600 bg-purple-50';
    if (action.includes('Login') || action.includes('Logout')) return 'text-gray-600 bg-gray-50';
    return 'text-orange-600 bg-orange-50';
  };

  const parseDetails = (details: string | undefined) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tracker logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tracker Logs</h1>
              <p className="text-gray-600 mt-1">Monitor all stat tracker activities and interactions</p>
            </div>
            <Button onClick={exportToCSV} className="btn-blue">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search team or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Team Filter */}
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Teams</option>
                {uniqueTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Clear Filters */}
            <Button onClick={clearFilters} variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match/Set
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const details = parseDetails(log.details);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.teamName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.matchId && (
                        <div>
                          <div>Match: {log.matchId}</div>
                          {log.set && <div className="text-xs text-gray-500">Set: {log.set}</div>}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.playerId && (
                        <div>
                          <div>ID: {log.playerId}</div>
                          {details && details.playerName && (
                            <div className="text-xs text-gray-500">{details.playerName}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      {details && (
                        <div className="truncate">
                          {typeof details === 'object' ? (
                            <div className="space-y-1">
                              {Object.entries(details).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="font-medium">{key}:</span> {String(value)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs">{String(details)}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {logs.length === 0 ? 'No tracker activity has been logged yet.' : 'Try adjusting your filters.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackerLogs;