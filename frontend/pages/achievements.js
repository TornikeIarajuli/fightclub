// pages/achievements.js - COMPLETE ENHANCED VERSION
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import BadgeSelector from '../components/BadgeSelector';
import AchievementToast from '../components/AchievementToast';
import { Trophy, Star, Target, Flame, Shield, Zap, Crown, Medal, Award, TrendingUp, Lock, CheckCircle, Settings } from 'lucide-react';

export default function Achievements() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(0);
  const [currentTitle, setCurrentTitle] = useState(null);
  const [nextTitle, setNextTitle] = useState(null);
  const [showBadgeSelector, setShowBadgeSelector] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAchievements();
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/achievements/detailed', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements);
        setStats(data.stats);
        setTotalPoints(data.total_points);
        setMaxPoints(data.max_points);
        setCurrentTitle(data.current_title);
        setNextTitle(data.next_title);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/notifications/achievements?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.notifications.length);

        // Show toasts for new notifications
        const newNotifications = data.notifications.filter(n => !notifications.find(existing => existing.id === n.id));
        newNotifications.forEach(notification => {
          showNotificationToast(notification);
        });

        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const showNotificationToast = (notification) => {
    // This will be handled by the toast component
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      const toastId = `toast-${notification.id}`;
      if (!document.getElementById(toastId)) {
        // Toast will auto-render via state
      }
    }
  };

  const markNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await fetch('https://fightmatch-backend.onrender.com/notifications/achievements/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setUnreadCount(0);
      setNotifications([]);
    } catch (error) {
      console.error('Error marking notifications read:', error);
    }
  };

  const closeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const categories = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

  const getCategoryIcon = (category) => {
    const icons = {
      'Beginner': Star,
      'Intermediate': Target,
      'Advanced': Shield,
      'Elite': Crown
    };
    return icons[category] || Trophy;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Beginner': 'from-green-500 to-emerald-500',
      'Intermediate': 'from-blue-500 to-cyan-500',
      'Advanced': 'from-purple-500 to-pink-500',
      'Elite': 'from-red-500 to-orange-500'
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getTitleColorClasses = (color) => {
    const colors = {
      'gray': 'from-gray-500 to-gray-600',
      'orange': 'from-orange-500 to-orange-600',
      'yellow': 'from-yellow-500 to-yellow-600',
      'cyan': 'from-cyan-500 to-cyan-600',
      'purple': 'from-purple-500 to-purple-600',
      'red': 'from-red-500 to-red-600'
    };
    return colors[color] || colors.gray;
  };

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

      {/* Toast Container */}
      <div id="toast-container" className="fixed top-20 right-4 z-50 space-y-4">
        {notifications.map(notification => (
          <AchievementToast
            key={notification.id}
            notification={notification}
            onClose={() => closeNotification(notification.id)}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Trophy className="text-yellow-500" size={40} />
                Achievements & Badges
              </h1>
              <p className="text-gray-400">Unlock badges and earn points as you progress</p>
            </div>

            {/* Manage Badges Button */}
            <button
              onClick={() => setShowBadgeSelector(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-xl transition shadow-lg shadow-purple-500/30"
            >
              <Settings size={20} />
              Manage Badges
            </button>
          </div>

          {/* Current Title Display */}
          {currentTitle && (
            <div className="mb-6">
              <div className={`inline-flex items-center gap-3 bg-gradient-to-r ${getTitleColorClasses(currentTitle.color)} px-8 py-4 rounded-2xl text-white shadow-2xl`}>
                <span className="text-4xl">{currentTitle.icon}</span>
                <div>
                  <p className="text-sm opacity-90">Your Title</p>
                  <p className="text-2xl font-black">{currentTitle.name}</p>
                  <p className="text-xs opacity-75">{currentTitle.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Points Overview Card */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 mb-8 shadow-xl shadow-yellow-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-2xl font-bold mb-2">Total Achievement Points</h2>
              <p className="text-yellow-100">Keep earning to unlock exclusive rewards</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-black text-white">{totalPoints}</p>
              <p className="text-yellow-100 text-sm">of {maxPoints} points</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-yellow-900/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${(totalPoints / maxPoints) * 100}%` }}
            ></div>
          </div>

          {/* Next Title Progress */}
          {nextTitle && (
            <div className="mt-4 pt-4 border-t border-yellow-500/30">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{nextTitle.icon}</span>
                  <div>
                    <p className="text-sm opacity-75">Next Title</p>
                    <p className="font-bold">{nextTitle.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">{nextTitle.points_required - totalPoints}</p>
                  <p className="text-xs opacity-75">points needed</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-green-500/20">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="text-green-500" size={24} />
                <p className="text-gray-400 text-sm">Achievements Unlocked</p>
              </div>
              <p className="text-3xl font-bold text-white">
                {achievements.filter(a => a.unlocked).length}/{achievements.length}
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Flame className="text-blue-500" size={24} />
                <p className="text-gray-400 text-sm">Current Streak</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats.current_streak}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-purple-500" size={24} />
                <p className="text-gray-400 text-sm">Win Rate</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats.win_rate}%</p>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-yellow-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Target className="text-yellow-500" size={24} />
                <p className="text-gray-400 text-sm">Styles Trained</p>
              </div>
              <p className="text-3xl font-bold text-white">{stats.styles_trained}</p>
            </div>
          </div>
        )}

        {/* Achievements by Category */}
        {categories.map(category => {
          const categoryAchievements = achievements.filter(a => a.category === category);
          const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length;
          const CategoryIcon = getCategoryIcon(category);

          return (
            <div key={category} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center shadow-lg`}>
                    <CategoryIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{category}</h2>
                    <p className="text-gray-400 text-sm">
                      {categoryUnlocked}/{categoryAchievements.length} Unlocked
                    </p>
                  </div>
                </div>

                {/* Category Progress */}
                <div className="text-right">
                  <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getCategoryColor(category)} transition-all duration-500`}
                      style={{ width: `${(categoryUnlocked / categoryAchievements.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryAchievements.map((achievement) => {
                  const isUnlocked = achievement.unlocked;
                  const progressPercentage = achievement.required > 0
                    ? Math.min((achievement.progress / achievement.required) * 100, 100)
                    : 0;

                  return (
                    <div
                      key={achievement.id}
                      className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border transition-all duration-300 ${
                        isUnlocked
                          ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40'
                          : 'border-gray-700 hover:border-gray-600 opacity-75'
                      }`}
                    >
                      {/* Unlocked Badge */}
                      {isUnlocked && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <CheckCircle size={12} />
                          UNLOCKED
                        </div>
                      )}

                      {/* Lock Badge */}
                      {!isUnlocked && (
                        <div className="absolute -top-2 -right-2 bg-gray-700 text-gray-400 p-2 rounded-full shadow-lg">
                          <Lock size={16} />
                        </div>
                      )}

                      {/* Icon */}
                      <div className={`text-6xl mb-4 text-center ${!isUnlocked && 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>

                      {/* Content */}
                      <h3 className="text-xl font-bold text-white mb-2 text-center">{achievement.name}</h3>
                      <p className="text-gray-400 text-sm mb-4 text-center min-h-[40px]">{achievement.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Progress</span>
                          <span className={`font-bold ${isUnlocked ? 'text-yellow-500' : 'text-white'}`}>
                            {achievement.progress}/{achievement.required}
                          </span>
                        </div>

                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getCategoryColor(category)} transition-all duration-500 ${
                              isUnlocked && 'animate-pulse'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Star size={14} className={isUnlocked ? 'text-yellow-500' : 'text-gray-600'} fill="currentColor" />
                          Points
                        </span>
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

        {/* All Titles Section */}
        <div className="mt-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-red-500/20">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Crown className="text-yellow-500" size={32} />
            Title Progression
          </h2>
          <p className="text-gray-400 mb-8">Earn points to unlock higher titles and show off your rank</p>

          <div className="space-y-4">
            {[
              { id: 'novice', name: 'Novice Fighter', icon: '🥋', color: 'gray', points: 0 },
              { id: 'bronze_fighter', name: 'Bronze Fighter', icon: '🥉', color: 'orange', points: 50 },
              { id: 'silver_fighter', name: 'Silver Fighter', icon: '🥈', color: 'gray', points: 150 },
              { id: 'gold_fighter', name: 'Gold Fighter', icon: '🥇', color: 'yellow', points: 300 },
              { id: 'platinum_fighter', name: 'Platinum Fighter', icon: '💎', color: 'cyan', points: 500 },
              { id: 'master', name: 'Master', icon: '⚡', color: 'purple', points: 750 },
              { id: 'grandmaster', name: 'Grandmaster', icon: '👑', color: 'red', points: 1000 }
            ].map((title, index) => {
              const isUnlocked = totalPoints >= title.points;
              const isCurrent = currentTitle?.id === title.id;
              const isNext = nextTitle?.id === title.id;

              return (
                <div
                  key={title.id}
                  className={`relative flex items-center gap-6 p-6 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-r ' + getTitleColorClasses(title.color) + ' border-yellow-400 shadow-2xl scale-105'
                      : isUnlocked
                      ? 'bg-gray-900/50 border-gray-700'
                      : 'bg-gray-900/30 border-gray-800 opacity-50'
                  }`}
                >
                  {/* Title Icon */}
                  <div className={`text-6xl ${!isUnlocked && 'grayscale'}`}>
                    {title.icon}
                  </div>

                  {/* Title Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-2xl font-bold ${isCurrent ? 'text-white' : isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                        {title.name}
                      </h3>
                      {isCurrent && (
                        <span className="px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full">
                          CURRENT
                        </span>
                      )}
                      {isNext && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                          NEXT
                        </span>
                      )}
                      {isUnlocked && !isCurrent && (
                        <CheckCircle size={20} className="text-green-500" />
                      )}
                      {!isUnlocked && (
                        <Lock size={20} className="text-gray-600" />
                      )}
                    </div>
                    <p className={`text-sm ${isCurrent ? 'text-white/90' : isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {title.points} points required
                    </p>
                  </div>

                  {/* Progress to this title */}
                  {!isUnlocked && (
                    <div className="text-right">
                      <p className="text-gray-400 text-sm mb-1">
                        {title.points - totalPoints} points away
                      </p>
                      <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                          style={{
                            width: `${Math.min((totalPoints / title.points) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badge Selector Modal */}
      <BadgeSelector
        isOpen={showBadgeSelector}
        onClose={() => setShowBadgeSelector(false)}
        onSave={() => {
          // Refresh could be added here
          alert('Badges updated successfully!');
        }}
      />
    </div>
  );
}