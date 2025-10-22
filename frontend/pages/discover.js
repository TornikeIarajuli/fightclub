// pages/discover.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import DiscoverFilters from '../components/DiscoverFilters';
import PhotoCarousel from '../components/PhotoCarousel';
import { Heart, X, Filter, MapPin, Award, User as UserIcon } from 'lucide-react';

export default function Discover() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [filterCount, setFilterCount] = useState(0);
  const [userGalleries, setUserGalleries] = useState({}); // Store galleries for each user

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, []);

  // Fetch gallery for current user when index changes
  useEffect(() => {
    if (users[currentIndex]) {
      fetchUserGallery(users[currentIndex].id);
    }
  }, [currentIndex, users]);

  const fetchUserGallery = async (userId) => {
    if (userGalleries[userId]) return; // Already fetched

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`https://fightmatch-backend.onrender.com/users/${userId}/gallery`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserGalleries(prev => ({
          ...prev,
          [userId]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching user gallery:', error);
    }
  };

  const fetchUsers = async (filters = {}) => {
  setLoading(true);
  try {
    const token = localStorage.getItem('access_token');

    // Check if we're actually filtering or just loading all users
    const hasActiveFilters = Object.keys(filters).length > 0 &&
                            Object.values(filters).some(val =>
                              val !== null && val !== undefined && val !== ''
                            );

    const url = hasActiveFilters
      ? 'https://fightmatch-backend.onrender.com/users/discover/filter'
      : 'https://fightmatch-backend.onrender.com/users/discover';

    const options = {
      method: hasActiveFilters ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (hasActiveFilters) {
      options.body = JSON.stringify(filters);
    }

    const response = await fetch(url, options);

    if (response.ok) {
      const data = await response.json();
      setUsers(data);
      setCurrentIndex(0);

      console.log(`Loaded ${data.length} users for swiping`);
    } else {
      console.error('Failed to fetch users');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    setLoading(false);
  }
};

// Call this on component mount to load ALL users by default
useEffect(() => {
  fetchUsers(); // No filters = load everyone
}, []);

  const handleSwipe = async (isLike) => {
    if (currentIndex >= users.length) return;

    const currentUser = users[currentIndex];

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_user_id: currentUser.id,
          is_like: isLike
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data.match) {
          alert(`It's a match! You can now message ${currentUser.username}`);
        }

        setCurrentIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error swiping:', error);
    }
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setFilterCount(Object.keys(filters).length);
    setShowFilters(false);
    fetchUsers(filters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setFilterCount(0);
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="text-center py-16 text-gray-400 text-xl">Loading fighters...</div>
      </div>
    );
  }

  const currentUser = users[currentIndex];
  const currentUserGallery = userGalleries[currentUser?.id] || [];

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Filters Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <UserIcon className="text-red-500" size={40} />
            Discover Fighters
          </h1>

          <button
            onClick={() => setShowFilters(true)}
            className="relative flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition border border-red-500/30 hover:border-red-500/50"
          >
            <Filter size={20} />
            Filters
            {filterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* Active Filters Display */}
        {filterCount > 0 && (
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-gray-400 text-sm">Active filters:</span>
            {Object.entries(activeFilters).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;

              // Create readable filter names
              const filterNames = {
                'martial_arts': 'Styles',
                'weight_class': 'Weight Class',
                'skill_level': 'Skill Level',
                'gender': 'Gender',
                'max_distance': 'Distance',
                'experience_min': 'Min Experience',
                'experience_max': 'Max Experience',
                'day_of_week': 'Available'
              };

              const displayName = filterNames[key] || key;

              // Format the value
              let displayValue;
              if (Array.isArray(value)) {
                displayValue = value.join(', ');
              } else if (key === 'max_distance') {
                displayValue = `${value} km`;
              } else if (key === 'experience_min' || key === 'experience_max') {
                displayValue = `${value} years`;
              } else if (key === 'day_of_week') {
                displayValue = value.charAt(0).toUpperCase() + value.slice(1);
              } else {
                displayValue = value.toString();
              }

              return (
                <span
                  key={key}
                  className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold border border-red-500/30"
                >
                  {displayName}: {displayValue}
                </span>
              );
            })}
            <button
              onClick={clearFilters}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-semibold transition"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Card Display */}
        {!currentUser ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥊</div>
            <p className="text-gray-400 text-xl mb-4">No more fighters to discover!</p>
            <p className="text-gray-500 mb-6">Try adjusting your filters or check back later</p>
            <button
              onClick={() => router.push('/matches')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              View Matches
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            {/* Card - Narrower and more modern */}
            <div className="w-full max-w-md">
              <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl overflow-hidden border border-red-500/30 shadow-2xl shadow-red-500/20">
                {/* Photo Carousel */}
                <PhotoCarousel
                  userId={currentUser.id}
                  photos={userGalleries[currentUser.id] || []}
                />

                {/* Profile Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {!currentUser.profile_pic && (
                        <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                          {currentUser.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold text-white">{currentUser.username}</h2>
                        <p className="text-gray-400 flex items-center gap-1 text-sm mt-1">
                          <MapPin size={14} className="text-red-500" />
                          {currentUser.location || 'Location not set'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 px-3 py-1.5 rounded-lg border border-red-500/50">
                      <p className="text-red-400 font-bold text-sm">{currentUser.skill_level}</p>
                    </div>
                  </div>

                  {/* Stats - Compact */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/50">
                      <p className="text-green-500 font-bold text-xl">{currentUser.wins || 0}</p>
                      <p className="text-gray-500 text-xs">Wins</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/50">
                      <p className="text-red-500 font-bold text-xl">{currentUser.losses || 0}</p>
                      <p className="text-gray-500 text-xs">Loss</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/50">
                      <p className="text-yellow-500 font-bold text-xl">{currentUser.draws || 0}</p>
                      <p className="text-gray-500 text-xs">Draw</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/50">
                      <p className="text-white font-bold text-xl">{currentUser.experience_years || 0}</p>
                      <p className="text-gray-500 text-xs">Years</p>
                    </div>
                  </div>

                  {/* Martial Arts - Compact */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                      <Award size={12} className="text-red-500" />
                      Martial Arts
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {currentUser.martial_arts && currentUser.martial_arts.map((style, index) => (
                        <span
                          key={index}
                          className="px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold border border-red-500/30"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bio - Compact */}
                  {currentUser.bio && (
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm line-clamp-2">{currentUser.bio}</p>
                    </div>
                  )}

                  {/* Physical Stats - Compact Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-700/30">
                      <p className="text-gray-500 text-xs">Class</p>
                      <p className="text-white font-semibold text-sm truncate">{currentUser.weight_class || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-700/30">
                      <p className="text-gray-500 text-xs">Height</p>
                      <p className="text-white font-semibold text-sm">{currentUser.height ? `${currentUser.height}cm` : 'N/A'}</p>
                    </div>
                    <div className="bg-gray-900/30 rounded-lg p-2 border border-gray-700/30">
                      <p className="text-gray-500 text-xs">Weight</p>
                      <p className="text-white font-semibold text-sm">{currentUser.weight ? `${currentUser.weight}kg` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Swipe Buttons - Modern floating style */}
                <div className="flex items-center justify-center gap-6 p-6 pt-0">
                  <button
                    onClick={() => handleSwipe(false)}
                    className="group w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-red-500/50 transform hover:scale-110 border border-gray-600 hover:border-red-500"
                  >
                    <X size={28} className="text-gray-300 group-hover:text-white transition" />
                  </button>

                  <div className="text-gray-400 text-sm">
                    {currentIndex + 1} / {users.length}
                  </div>

                  <button
                    onClick={() => handleSwipe(true)}
                    className="group w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-green-500/50 transform hover:scale-110 border border-gray-600 hover:border-green-500"
                  >
                    <Heart size={28} className="text-gray-300 group-hover:text-white transition" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Modal */}
      {showFilters && (
        <DiscoverFilters
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}