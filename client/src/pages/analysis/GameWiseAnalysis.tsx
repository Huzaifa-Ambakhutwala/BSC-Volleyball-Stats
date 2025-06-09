import { useState, useEffect, useMemo } from 'react';
import { getMatchStats } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Download, 
  Trophy, 
  Users,
  Target,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Crown,
  Zap,
  Search
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  RadialLinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend
);

interface GameWiseAnalysisProps {
  players: Record<string, Player>;
  matches: Record<string, Match>;
  teams: Record<string, any>;
}

type GameAnalysisData = {
  match: Match;
  matchId: string;
  teamAStats: {
    teamInfo: any;
    players: Array<{
      player: Player;
      playerId: string;
      stats: PlayerStats;
      netScore: number;
    }>;
    totalPoints: number;
    totalFaults: number;
    netPerformance: number;
  };
  teamBStats: {
    teamInfo: any;
    players: Array<{
      player: Player;
      playerId: string;
      stats: PlayerStats;
      netScore: number;
    }>;
    totalPoints: number;
    totalFaults: number;
    netPerformance: number;
  };
  mvpPlayer?: {
    player: Player;
    playerId: string;
    stats: PlayerStats;
    netScore: number;
    team: 'A' | 'B';
  };
  allStats: Record<string, PlayerStats>;
};

const GameWiseAnalysis = ({ players, matches, teams }: GameWiseAnalysisProps) => {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [gameData, setGameData] = useState<GameAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Helper functions
  const calculateTotalEarned = (stats: PlayerStats): number => {
    return (stats.aces || 0) + (stats.spikes || 0) + (stats.blocks || 0) + 
           (stats.tips || 0) + (stats.dumps || 0) + (stats.digs || 0) + (stats.points || 0);
  };

  const calculateTotalFaults = (stats: PlayerStats): number => {
    return (stats.serveErrors || 0) + (stats.spikeErrors || 0) + (stats.netTouches || 0) + 
           (stats.footFaults || 0) + (stats.reaches || 0) + (stats.carries || 0) + 
           (stats.outOfBounds || 0) + (stats.faults || 0);
  };

  // Filter matches based on search
  const filteredMatches = useMemo(() => {
    return Object.entries(matches).filter(([id, match]) => {
      const teamAName = teams[match.teamA]?.teamName || '';
      const teamBName = teams[match.teamB]?.teamName || '';
      const searchTerm = searchQuery.toLowerCase();
      
      return (
        teamAName.toLowerCase().includes(searchTerm) ||
        teamBName.toLowerCase().includes(searchTerm) ||
        match.gameNumber.toString().includes(searchTerm) ||
        match.courtNumber.toString().includes(searchTerm) ||
        new Date(match.startTime).toLocaleDateString().includes(searchTerm)
      );
    });
  }, [matches, teams, searchQuery]);

  // Load game analysis data
  const loadGameData = async (matchId: string) => {
    if (!matchId) return;
    
    setIsLoading(true);
    try {
      const match = matches[matchId];
      if (!match) return;

      console.log(`[GAME_ANALYSIS] Loading data for match ${match.gameNumber}`);

      // Get match stats
      const allStats = await getMatchStats(matchId);
      
      // Get team information
      const teamAInfo = teams[match.teamA];
      const teamBInfo = teams[match.teamB];

      if (!teamAInfo || !teamBInfo) {
        console.error('Team information not found');
        return;
      }

      // Process Team A stats
      const teamAPlayers: GameAnalysisData['teamAStats']['players'] = [];
      let teamATotalPoints = 0;
      let teamATotalFaults = 0;

      teamAInfo.players?.forEach((playerId: string) => {
        const player = players[playerId];
        const playerStats = allStats[playerId];
        
        if (player && playerStats) {
          const points = calculateTotalEarned(playerStats);
          const faults = calculateTotalFaults(playerStats);
          const netScore = points - faults;
          
          teamAPlayers.push({
            player,
            playerId,
            stats: playerStats,
            netScore
          });
          
          teamATotalPoints += points;
          teamATotalFaults += faults;
        }
      });

      // Process Team B stats
      const teamBPlayers: GameAnalysisData['teamBStats']['players'] = [];
      let teamBTotalPoints = 0;
      let teamBTotalFaults = 0;

      teamBInfo.players?.forEach((playerId: string) => {
        const player = players[playerId];
        const playerStats = allStats[playerId];
        
        if (player && playerStats) {
          const points = calculateTotalEarned(playerStats);
          const faults = calculateTotalFaults(playerStats);
          const netScore = points - faults;
          
          teamBPlayers.push({
            player,
            playerId,
            stats: playerStats,
            netScore
          });
          
          teamBTotalPoints += points;
          teamBTotalFaults += faults;
        }
      });

      // Find MVP (player with best net performance)
      let mvpPlayer: GameAnalysisData['mvpPlayer'];
      let bestNetScore = -Infinity;

      [...teamAPlayers, ...teamBPlayers].forEach((playerData) => {
        if (playerData.netScore > bestNetScore) {
          bestNetScore = playerData.netScore;
          mvpPlayer = {
            ...playerData,
            team: teamAPlayers.includes(playerData) ? 'A' : 'B'
          };
        }
      });

      const analysisData: GameAnalysisData = {
        match,
        matchId,
        teamAStats: {
          teamInfo: teamAInfo,
          players: teamAPlayers.sort((a, b) => b.netScore - a.netScore),
          totalPoints: teamATotalPoints,
          totalFaults: teamATotalFaults,
          netPerformance: teamATotalPoints - teamATotalFaults
        },
        teamBStats: {
          teamInfo: teamBInfo,
          players: teamBPlayers.sort((a, b) => b.netScore - a.netScore),
          totalPoints: teamBTotalPoints,
          totalFaults: teamBTotalFaults,
          netPerformance: teamBTotalPoints - teamBTotalFaults
        },
        mvpPlayer,
        allStats
      };

      setGameData(analysisData);
      console.log(`[GAME_ANALYSIS] Loaded data for match ${match.gameNumber}:`, analysisData);

    } catch (error) {
      console.error('[GAME_ANALYSIS] Error loading game data:', error);
      toast({
        title: "Error",
        description: "Failed to load game analysis data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when match is selected
  useEffect(() => {
    if (selectedMatchId) {
      loadGameData(selectedMatchId);
    }
  }, [selectedMatchId]);

  // Team comparison chart data
  const teamComparisonData = useMemo(() => {
    if (!gameData) return null;

    return {
      labels: ['Points Earned', 'Total Faults', 'Net Performance'],
      datasets: [
        {
          label: gameData.teamAStats.teamInfo.teamName,
          data: [
            gameData.teamAStats.totalPoints,
            gameData.teamAStats.totalFaults,
            gameData.teamAStats.netPerformance
          ],
          backgroundColor: gameData.teamAStats.teamInfo.teamColor || '#3B82F6',
          borderColor: gameData.teamAStats.teamInfo.teamColor || '#3B82F6',
          borderWidth: 1
        },
        {
          label: gameData.teamBStats.teamInfo.teamName,
          data: [
            gameData.teamBStats.totalPoints,
            gameData.teamBStats.totalFaults,
            gameData.teamBStats.netPerformance
          ],
          backgroundColor: gameData.teamBStats.teamInfo.teamColor || '#EF4444',
          borderColor: gameData.teamBStats.teamInfo.teamColor || '#EF4444',
          borderWidth: 1
        }
      ]
    };
  }, [gameData]);

  // Radar chart for team skills comparison
  const radarChartData = useMemo(() => {
    if (!gameData) return null;

    // Aggregate team stats
    const teamASkills = {
      aces: 0, spikes: 0, blocks: 0, tips: 0, digs: 0
    };
    const teamBSkills = {
      aces: 0, spikes: 0, blocks: 0, tips: 0, digs: 0
    };

    gameData.teamAStats.players.forEach(p => {
      teamASkills.aces += p.stats.aces || 0;
      teamASkills.spikes += p.stats.spikes || 0;
      teamASkills.blocks += p.stats.blocks || 0;
      teamASkills.tips += p.stats.tips || 0;
      teamASkills.digs += p.stats.digs || 0;
    });

    gameData.teamBStats.players.forEach(p => {
      teamBSkills.aces += p.stats.aces || 0;
      teamBSkills.spikes += p.stats.spikes || 0;
      teamBSkills.blocks += p.stats.blocks || 0;
      teamBSkills.tips += p.stats.tips || 0;
      teamBSkills.digs += p.stats.digs || 0;
    });

    return {
      labels: ['Aces', 'Spikes', 'Blocks', 'Tips', 'Digs'],
      datasets: [
        {
          label: gameData.teamAStats.teamInfo.teamName,
          data: [
            teamASkills.aces,
            teamASkills.spikes,
            teamASkills.blocks,
            teamASkills.tips,
            teamASkills.digs
          ],
          backgroundColor: `${gameData.teamAStats.teamInfo.teamColor || '#3B82F6'}33`,
          borderColor: gameData.teamAStats.teamInfo.teamColor || '#3B82F6',
          borderWidth: 2
        },
        {
          label: gameData.teamBStats.teamInfo.teamName,
          data: [
            teamBSkills.aces,
            teamBSkills.spikes,
            teamBSkills.blocks,
            teamBSkills.tips,
            teamBSkills.digs
          ],
          backgroundColor: `${gameData.teamBStats.teamInfo.teamColor || '#EF4444'}33`,
          borderColor: gameData.teamBStats.teamInfo.teamColor || '#EF4444',
          borderWidth: 2
        }
      ]
    };
  }, [gameData]);

  // Export functionality
  const exportToCSV = () => {
    if (!gameData) return;

    const csvData = [
      ['Game Analysis Report'],
      ['Match Number', gameData.match.gameNumber.toString()],
      ['Court', gameData.match.courtNumber.toString()],
      ['Date', new Date(gameData.match.startTime).toLocaleDateString()],
      ['Team A', gameData.teamAStats.teamInfo.teamName],
      ['Team B', gameData.teamBStats.teamInfo.teamName],
      [''],
      ['Team Summary'],
      ['Team', 'Total Points', 'Total Faults', 'Net Performance'],
      [gameData.teamAStats.teamInfo.teamName, 
       gameData.teamAStats.totalPoints.toString(),
       gameData.teamAStats.totalFaults.toString(),
       gameData.teamAStats.netPerformance.toString()],
      [gameData.teamBStats.teamInfo.teamName,
       gameData.teamBStats.totalPoints.toString(),
       gameData.teamBStats.totalFaults.toString(),
       gameData.teamBStats.netPerformance.toString()],
      [''],
      ['MVP Player'],
      [gameData.mvpPlayer?.player.name || 'N/A', 
       gameData.mvpPlayer?.netScore.toString() || '0'],
      [''],
      ['Individual Player Performance'],
      ['Player', 'Team', 'Points', 'Faults', 'Net Score'],
      ...gameData.teamAStats.players.map(p => [
        p.player.name,
        gameData.teamAStats.teamInfo.teamName,
        calculateTotalEarned(p.stats).toString(),
        calculateTotalFaults(p.stats).toString(),
        p.netScore.toString()
      ]),
      ...gameData.teamBStats.players.map(p => [
        p.player.name,
        gameData.teamBStats.teamInfo.teamName,
        calculateTotalEarned(p.stats).toString(),
        calculateTotalFaults(p.stats).toString(),
        p.netScore.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_${gameData.match.gameNumber}_analysis.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Match Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Select Match
        </h2>
        
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search matches by team, court, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <select
            value={selectedMatchId}
            onChange={(e) => setSelectedMatchId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a match...</option>
            {filteredMatches.map(([id, match]) => (
              <option key={id} value={id}>
                Match {match.gameNumber} - Court {match.courtNumber} - {teams[match.teamA]?.teamName} vs {teams[match.teamB]?.teamName} 
                ({new Date(match.startTime).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading game analysis...</p>
        </div>
      )}

      {/* Game Analysis */}
      {gameData && !isLoading && (
        <div className="space-y-6">
          {/* Match Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Match {gameData.match.gameNumber} Analysis
                </h1>
                <p className="text-gray-600">
                  Court {gameData.match.courtNumber} • {new Date(gameData.match.startTime).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: gameData.teamAStats.teamInfo.teamColor || '#3B82F6',
                      color: 'white'
                    }}
                  >
                    {gameData.teamAStats.teamInfo.teamName}
                  </span>
                  <span className="text-gray-500">vs</span>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: gameData.teamBStats.teamInfo.teamColor || '#EF4444',
                      color: 'white'
                    }}
                  >
                    {gameData.teamBStats.teamInfo.teamName}
                  </span>
                </div>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* MVP Player */}
          {gameData.mvpPlayer && (
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Crown className="h-8 w-8 text-yellow-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Match MVP</h3>
                    <p className="text-yellow-700">
                      {gameData.mvpPlayer.player.name} 
                      <span className="ml-2">
                        ({gameData.mvpPlayer.team === 'A' ? gameData.teamAStats.teamInfo.teamName : gameData.teamBStats.teamInfo.teamName})
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-800">+{gameData.mvpPlayer.netScore}</p>
                  <p className="text-sm text-yellow-600">Net Score</p>
                </div>
              </div>
            </div>
          )}

          {/* Team Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2" style={{ color: gameData.teamAStats.teamInfo.teamColor }}>
                  {gameData.teamAStats.teamInfo.teamName}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-semibold text-green-600">{gameData.teamAStats.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Faults:</span>
                    <span className="font-semibold text-red-600">{gameData.teamAStats.totalFaults}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Net:</span>
                    <span className={`font-bold ${gameData.teamAStats.netPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gameData.teamAStats.netPerformance >= 0 ? '+' : ''}{gameData.teamAStats.netPerformance}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 font-medium">Team Comparison</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2" style={{ color: gameData.teamBStats.teamInfo.teamColor }}>
                  {gameData.teamBStats.teamInfo.teamName}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points:</span>
                    <span className="font-semibold text-green-600">{gameData.teamBStats.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Faults:</span>
                    <span className="font-semibold text-red-600">{gameData.teamBStats.totalFaults}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Net:</span>
                    <span className={`font-bold ${gameData.teamBStats.netPerformance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gameData.teamBStats.netPerformance >= 0 ? '+' : ''}{gameData.teamBStats.netPerformance}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Team Performance Comparison
              </h3>
              {teamComparisonData && (
                <Bar 
                  data={teamComparisonData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Skills Radar Comparison
              </h3>
              {radarChartData && (
                <Radar 
                  data={radarChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top'
                      }
                    },
                    scales: {
                      r: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Individual Player Performance */}
          <div className="bg-white rounded-lg shadow">
            <div 
              className="p-6 border-b cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'players' ? '' : 'players')}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Individual Player Performance
                </h3>
                {expandedSection === 'players' ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>
            
            {expandedSection === 'players' && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team A Players */}
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: gameData.teamAStats.teamInfo.teamColor }}>
                      {gameData.teamAStats.teamInfo.teamName} Players
                    </h4>
                    <div className="space-y-3">
                      {gameData.teamAStats.players.map((playerData) => (
                        <div key={playerData.playerId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{playerData.player.name}</h5>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              playerData.netScore >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {playerData.netScore >= 0 ? '+' : ''}{playerData.netScore}
                            </span>
                          </div>
                          <div className="flex space-x-4 text-sm text-gray-600">
                            <span>Points: {calculateTotalEarned(playerData.stats)}</span>
                            <span>Faults: {calculateTotalFaults(playerData.stats)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {playerData.stats.aces > 0 && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                                🔥{playerData.stats.aces}
                              </span>
                            )}
                            {playerData.stats.spikes > 0 && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                                💥{playerData.stats.spikes}
                              </span>
                            )}
                            {playerData.stats.blocks > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                🧱{playerData.stats.blocks}
                              </span>
                            )}
                            {playerData.stats.tips > 0 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                                👆{playerData.stats.tips}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Team B Players */}
                  <div>
                    <h4 className="font-semibold mb-3" style={{ color: gameData.teamBStats.teamInfo.teamColor }}>
                      {gameData.teamBStats.teamInfo.teamName} Players
                    </h4>
                    <div className="space-y-3">
                      {gameData.teamBStats.players.map((playerData) => (
                        <div key={playerData.playerId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{playerData.player.name}</h5>
                            <span className={`px-2 py-1 rounded text-sm font-medium ${
                              playerData.netScore >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {playerData.netScore >= 0 ? '+' : ''}{playerData.netScore}
                            </span>
                          </div>
                          <div className="flex space-x-4 text-sm text-gray-600">
                            <span>Points: {calculateTotalEarned(playerData.stats)}</span>
                            <span>Faults: {calculateTotalFaults(playerData.stats)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {playerData.stats.aces > 0 && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">
                                🔥{playerData.stats.aces}
                              </span>
                            )}
                            {playerData.stats.spikes > 0 && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                                💥{playerData.stats.spikes}
                              </span>
                            )}
                            {playerData.stats.blocks > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                🧱{playerData.stats.blocks}
                              </span>
                            )}
                            {playerData.stats.tips > 0 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded">
                                👆{playerData.stats.tips}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedMatchId && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg text-gray-600">Select a match to view detailed game analysis</p>
          <p className="text-sm text-gray-500 mt-2">
            Choose from the dropdown above to see team comparisons, player performance, and MVP selection
          </p>
        </div>
      )}
    </div>
  );
};

export default GameWiseAnalysis;