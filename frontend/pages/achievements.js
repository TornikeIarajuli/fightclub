// pages/achievements.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { Trophy, Star, Target, Flame, Shield, Zap, Crown, Medal, Award } from 'lucide-react';

export default function Achievements() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/profile/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Define all achievements
  const achievements = [
    // Beginner achievements
    {
      id: 'first_match',
      name: 'First Match',
      description: 'Complete your first sparring session',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      requirement: 1,
      progress: userStats?.total_fights || 0,
      category: 'Beginner',
      points: 10
    },
    {
      id: 'first_win',
      name: 'First Victory',
      description: 'Win your first match',
      icon: Trophy,
      color: 'from-green-500 to-green-600',
      requirement: 1,
      progress: userStats?.wins || 0,
      category: 'Beginner',
      points: 15
    },
    {
      id: 'dedicated',
      name: 'Dedicated Fighter',
      description: 'Train for 7 consecutive days',
      icon: Flame,
      color: 'from-orange-500 to-red-600',
      requirement: 7,
      progress: userStats?.training_streak || 0,
      category: 'Beginner',
      points: 20
    },

    // Intermediate achievements
    {
      id: 'warrior',
      name: 'Warrior',
      description: 'Complete 25 matches',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      requirement: 25,
      progress: userStats?.total_fights || 0,
      category: 'Intermediate',
      points: 30
    },
    {
      id: 'win_streak_5',
      name: 'Hot Streak',
      description: 'Win 5 matches in a row',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
      requirement: 5,
      progress: userStats?.current_streak >= 5 ? 5 : userStats?.current_streak || 0,
      category: 'Intermediate',
      points: 25
    },
    {
      id: 'style_master',
      name: 'Style Master',
      description: 'Train in 5 different martial arts',
      icon: Target,
      color: 'from-purple-500 to-purple-600',
      requirement: 5,
      progress: userStats?.styles_trained || 0,
      category: 'Intermediate',
      points: 35
    },

    // Advanced achievements
    {
      id: 'centurion',
      name: 'Centurion',
      description: 'Complete 100 matches',
      icon: Medal,
      color: 'from-red-500 to-pink-600',
      requirement: 100,
      progress: userStats?.total_fights || 0,
      category: 'Advanced',
      points: 50
    },
    {
      id: 'unstoppable',
      name: 'Unstoppable',
      description: 'Win 10 matches in a row',
      icon: Crown,
      color: 'from-yellow-600 to-yellow-500',
      requirement: 10,
      progress: userStats?.longest_streak || 0,
      category: 'Advanced',
      points: 75
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Achieve 80% win rate with 50+ fights',
      icon: Award,
      color: 'from-purple-600 to-pink-600',
      requirement: 80,
      progress: userStats?.win_rate || 0,
      category: 'Advanced',
      points: 100
    },

    // Elite achievements
    {
      id: 'legend',
      name: 'Legend',
      description: 'Complete 500 matches',
      icon: Crown,
      color: 'from-red-600 to-yellow-500',
      requirement: 500,
      progress: userStats?.total_fights || 0,
      category: 'Elite',
      points: 150
    },
    {
      id: 'master',
      name: 'Grand Master',
      description: 'Master 10 different martial arts styles',
      icon: Trophy,
      color: 'from-blue-600 to-purple-600',
      requirement: 10,
      progress: userStats?.styles_trained || 0,
      category: 'Elite',
      points: 200
    },
    {
      id: 'immortal',
      name: 'Immortal Warrior',
      description: 'Win 25 matches in a row',
      icon: Flame,
      color: 'from-orange-600 to-red-600',
      requirement: 25,
      progress: userStats?.longest_streak || 0,
      category: 'Elite',
      points: 250
    }
  ];

  const categories = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

  const totalPoints = achievements
    .filter(a => a.progress >= a.requirement)
    .reduce((sum, a) => sum + a.points, 0);

  const totalPossiblePoints = achievements.reduce((sum, a) => sum + a.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="text-center py-16 text-gray-400 text-xl">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="text-yellow-500" size={40} />
            Achievements & Badges
          </h1>
          <p className="text-gray-400">Unlock badges and earn points as you progress</p>
        </div>

        {/* Points Overview */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 mb-8 shadow-xl shadow-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold mb-2">Total Achievement Points</h2>
              <p className="text-yellow-100">Keep earning to unlock exclusive rewards</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white">{totalPoints}</p>
              <p className="text-yellow-100 text-sm">of {totalPossiblePoints} points</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6 w-full h-3 bg-yellow-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(totalPoints / totalPossiblePoints) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Achievements by Category */}
        {categories.map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const categoryUnlocked = categoryAchievements.filter(a => a.progress >= a.requirement).length;

          return (
            <div key={category} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">{category}</h2>
                <span className="text-gray-400">
                  {categoryUnlocked}/{categoryAchievements.length} Unlocked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  const isUnlocked = achievement.progress >= achievement.requirement;
                  const progressPercentage = Math.min((achievement.progress / achievement.requirement) * 100, 100);

                  return (
                    <div
                      key={achievement.id}
                      className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border transition-all duration-300 ${
                        isUnlocked
                          ? 'border-yellow-500/50 hover:border-yellow-500 shadow-lg shadow-yellow-500/20'
                          : 'border-gray-700 hover:border-gray-600 opacity-75'
                      }`}
                    >
                      {/* Unlocked badge */}
                      {isUnlocked && (
                        <div className="absolute top-3 right-3 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                          UNLOCKED
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-4 ${!isUnlocked && 'grayscale opacity-50'}`}>
                        <Icon className="text-white" size={32} />
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-2">{achievement.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{achievement.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className={`font-bold ${isUnlocked ? 'text-yellow-500' : 'text-white'}`}>
                            {achievement.progress}/{achievement.requirement}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${achievement.color} transition-all duration-500`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Points</span>
                        <span className={`font-bold ${isUnlocked ? 'text-yellow-500' : 'text-gray-400'}`}>
                          +{achievement.points}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}