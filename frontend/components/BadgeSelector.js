// components/BadgeSelector.js
import { useState, useEffect } from 'react';
import { Shield, Lock, Check, X } from 'lucide-react';

export default function BadgeSelector({ isOpen, onClose, onSave }) {
  const [badges, setBadges] = useState([]);
  const [selectedBadges, setSelectedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchBadges();
    }
  }, [isOpen]);

  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/badges/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges);

        // Set currently displayed badges
        const displayed = data.badges
          .filter(b => b.is_displayed)
          .map(b => b.id);
        setSelectedBadges(displayed);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBadge = (badgeId) => {
    if (selectedBadges.includes(badgeId)) {
      setSelectedBadges(selectedBadges.filter(id => id !== badgeId));
    } else if (selectedBadges.length < 3) {
      setSelectedBadges([...selectedBadges, badgeId]);
    } else {
      alert('You can only display 3 badges');
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/badges/display', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedBadges)
      });

      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving badges:', error);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-4xl w-full border-2 border-red-500/30 shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800/95 backdrop-blur z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="text-yellow-500" />
              Select Display Badges
            </h2>
            <p className="text-gray-400 text-sm mt-1">Choose up to 3 badges to display on your profile</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Selected Count */}
        <div className="px-6 py-4 bg-gray-900/50">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Selected: {selectedBadges.length}/3</span>
            <button
              onClick={handleSave}
              disabled={selectedBadges.length === 0}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-semibold rounded-lg transition"
            >
              Save Selection
            </button>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map((badge) => {
                const isSelected = selectedBadges.includes(badge.id);
                const isUnlocked = badge.unlocked;

                return (
                  <button
                    key={badge.id}
                    onClick={() => isUnlocked && toggleBadge(badge.id)}
                    disabled={!isUnlocked}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      !isUnlocked
                        ? 'bg-gray-900/50 border-gray-700 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-gradient-to-br ' + getCategoryColor(badge.category) + ' border-yellow-400 shadow-lg scale-105'
                        : 'bg-gray-900/80 border-gray-700 hover:border-gray-600 hover:scale-105'
                    }`}
                  >
                    {/* Selection Indicator */}
                    {isSelected && isUnlocked && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Check size={16} className="text-green-600" />
                      </div>
                    )}

                    {/* Lock Icon */}
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2">
                        <Lock size={20} className="text-gray-600" />
                      </div>
                    )}

                    {/* Badge Icon */}
                    <div className="text-5xl mb-3 text-center">{badge.icon}</div>

                    {/* Badge Name */}
                    <h3 className={`font-bold text-sm text-center mb-1 ${
                      isUnlocked ? 'text-white' : 'text-gray-600'
                    }`}>
                      {badge.name}
                    </h3>

                    {/* Category */}
                    <p className="text-xs text-center text-gray-500">
                      {badge.category}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}