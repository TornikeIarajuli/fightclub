// components/AchievementToast.js
import { useState, useEffect } from 'react';
import { Trophy, X, Star } from 'lucide-react';

export default function AchievementToast({ notification, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 shadow-2xl shadow-yellow-500/50 border-2 border-yellow-400 max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center animate-bounce">
              <Trophy className="text-white" size={28} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                Achievement Unlocked!
                <Star className="text-yellow-200 animate-pulse" size={16} fill="currentColor" />
              </h3>
            </div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
          <p className="text-white font-bold text-xl mb-1">{notification.title}</p>
          <p className="text-white/90 text-sm mb-3">{notification.message}</p>

          {notification.points_earned > 0 && (
            <div className="flex items-center gap-2 text-white font-bold">
              <span className="text-2xl">+{notification.points_earned}</span>
              <span className="text-sm opacity-90">Points</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}