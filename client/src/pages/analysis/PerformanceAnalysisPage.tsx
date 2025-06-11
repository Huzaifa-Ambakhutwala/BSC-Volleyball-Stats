import { useState, useEffect } from 'react';
import { getPlayers, getMatches, getMatchStats, getTeams } from '@/lib/firebase';
import type { Player, Match, PlayerStats } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download, 
  Filter,
  Search,
  Trophy,
  Target,
  Zap,
  PieChart,
  FileText,
  Eye
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Radar, Line } from 'react-chartjs-2';
import PlayerWiseAnalysis from './PlayerWiseAnalysis';
import GameWiseAnalysis from './GameWiseAnalysis';
import PlayerComparison from './PlayerComparison';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type AnalysisView = 'player' | 'game' | 'comparison';

const PerformanceAnalysisPage = () => {
  const [activeView, setActiveView] = useState<AnalysisView>('player');
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [matches, setMatches] = useState<Record<string, Match>>({});
  const [teams, setTeams] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        console.log('[PERFORMANCE_ANALYSIS] Loading data...');
        
        const [playersData, matchesData, teamsData] = await Promise.all([
          getPlayers(),
          getMatches(),
          getTeams()
        ]);

        console.log('[PERFORMANCE_ANALYSIS] Loaded', Object.keys(playersData).length, 'players');
        console.log('[PERFORMANCE_ANALYSIS] Loaded', Object.keys(matchesData).length, 'matches');
        console.log('[PERFORMANCE_ANALYSIS] Loaded', Object.keys(teamsData).length, 'teams');

        setPlayers(playersData);
        setMatches(matchesData);
        setTeams(teamsData);
        
      } catch (error) {
        console.error('[PERFORMANCE_ANALYSIS] Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load tournament data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading performance analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
          Performance Analysis
        </h1>
        <p className="text-gray-600">
          Comprehensive statistical analysis and insights from tournament data
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('player')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'player'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Player-Wise Analysis
              </div>
            </button>
            <button
              onClick={() => setActiveView('comparison')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'comparison'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Player Comparison
              </div>
            </button>
            <button
              onClick={() => setActiveView('game')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'game'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Game-Wise Analysis
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeView === 'player' ? (
        <PlayerWiseAnalysis 
          players={players}
          matches={matches}
          teams={teams}
        />
      ) : activeView === 'comparison' ? (
        <PlayerComparison 
          players={players}
          matches={matches}
          teams={teams}
        />
      ) : (
        <GameWiseAnalysis 
          players={players}
          matches={matches}
          teams={teams}
        />
      )}
    </div>
  );
};

export default PerformanceAnalysisPage;