// pages/analytics.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { TrendingUp, Award, Target, Calendar, Activity, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="text-center py-16 text-gray-400 text-xl">Loading analytics...</div>
      </div>
    );
  }

  const totalFights = analytics?.total_fights || 0;
  const wins = analytics?.wins || 0;
  const losses = analytics?.losses || 0;
  const draws = analytics?.draws || 0;
  const winRate = totalFights > 0 ? ((wins / totalFights) * 100).toFixed(1) : 0;
  const currentStreak = analytics?.current_streak || 0;
  const longestStreak = analytics?.longest_streak || 0;

  // Mock data for style breakdown (you'll replace with real data)
  const styleStats = [
    { style: 'BJJ', wins: 15, losses: 5, draws: 2, color: 'bg-blue-500' },
    { style: 'Muay Thai', wins: 12, losses: 8, draws: 1, color: 'bg-red-500' },
    { style: 'Boxing', wins: 8, losses: 4, draws: 0, color: 'bg-yellow-500' },
    { style: 'Wrestling', wins: 10, losses: 3, draws: 1, color: 'bg-green-500' },
  ];

  // Monthly activity (mock data)
  const monthlyActivity = [
    { month: 'Jan', fights: 8 },
    { month: 'Feb', fights: 12 },
    { month: 'Mar', fights: 15 },
    { month: 'Apr', fights: 10 },
    { month: 'May', fights: 18 },
    { month: 'Jun', fights: 14 },
  ];

  const maxFights = Math.max(...monthlyActivity.map(m => m.fights));

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="text-red-500" size={40} />
            Fight Analytics
          </h1>
          <p className="text-gray-400">Track your progress and performance</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20 hover:border-red-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-semibold">Total Fights</h3>
              <Activity className="text-red-500" size={24} />
            </div>
            <p className="text-4xl font-bold text-white">{totalFights}</p>
            <p className="text-sm text-gray-500 mt-2">All time record</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-green-500/20 hover:border-green-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-semibold">Win Rate</h3>
              <TrendingUp className="text-green-500" size={24} />
            </div>
            <p className="text-4xl font-bold text-white">{winRate}%</p>
            <p className="text-sm text-gray-500 mt-2">{wins}W - {losses}L - {draws}D</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-semibold">Current Streak</h3>
              <Target className="text-yellow-500" size={24} />
            </div>
            <p className="text-4xl font-bold text-white">{currentStreak}</p>
            <p className="text-sm text-gray-500 mt-2">{currentStreak >= 0 ? 'Wins' : 'Losses'}</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/50 transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 font-semibold">Best Streak</h3>
              <Award className="text-purple-500" size={24} />
            </div>
            <p className="text-4xl font-bold text-white">{longestStreak}</p>
            <p className="text-sm text-gray-500 mt-2">Longest win streak</p>
          </div>
        </div>

        {/* Style Breakdown */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Target className="text-red-500" />
            Performance by Style
          </h2>

          <div className="space-y-6">
            {styleStats.map((style) => {
              const styleTotal = style.wins + style.losses + style.draws;
              const styleWinRate = styleTotal > 0 ? ((style.wins / styleTotal) * 100).toFixed(1) : 0;

              return (
                <div key={style.style} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${style.color}`}></div>
                      <span className="text-white font-semibold">{style.style}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold">{styleWinRate}%</span>
                      <span className="text-gray-500 text-sm ml-2">
                        ({style.wins}W-{style.losses}L-{style.draws}D)
                      </span>
                    </div>
                  </div>

                  <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${style.color} rounded-full transition-all duration-500`}
                      style={{ width: `${styleWinRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Activity Chart */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-red-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Calendar className="text-red-500" />
            Training Frequency
          </h2>

          <div className="flex items-end justify-between h-64 gap-4">
            {monthlyActivity.map((month) => {
              const heightPercentage = (month.fights / maxFights) * 100;

              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full group">
                    <div
                      className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-300 hover:from-red-500 hover:to-red-300"
                      style={{ height: `${heightPercentage}%`, minHeight: '20px' }}
                    ></div>

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                      {month.fights} fights
                    </div>
                  </div>

                  <span className="text-gray-400 text-sm font-semibold">{month.month}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-400">
                Total: <span className="text-white font-bold">
                  {monthlyActivity.reduce((sum, m) => sum + m.fights, 0)} fights
                </span>
              </div>
              <div className="text-gray-400">
                Average: <span className="text-white font-bold">
                  {(monthlyActivity.reduce((sum, m) => sum + m.fights, 0) / monthlyActivity.length).toFixed(1)} per month
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}