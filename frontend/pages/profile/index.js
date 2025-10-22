// pages/profile/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import PhotoGalleryManager from '../../components/PhotoGalleryManager';
import { Edit, MapPin, Calendar, Award, TrendingUp, Shield, Plus } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('https://fightmatch-backend.onrender.com/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/users/me/photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUser({ ...user, profile_pic: data.photo_url });
        alert('Photo uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    }
  };

  const getSkillColor = (skill) => {
    const colors = {
      'Beginner': 'from-green-500 to-emerald-500',
      'Intermediate': 'from-yellow-500 to-orange-500',
      'Advanced': 'from-orange-500 to-red-500',
      'Pro': 'from-red-500 to-pink-500'
    };
    return colors[skill] || 'from-gray-500 to-gray-600';
  };

  const getTotalFights = () => {
    if (!user) return 0;
    return user.wins + user.losses + user.draws;
  };

  const getWinRate = () => {
    const total = getTotalFights();
    if (total === 0) return 0;
    return ((user.wins / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400 text-xl">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
              My Profile
            </h1>
            <p className="text-gray-400">Manage your fighting profile</p>
          </div>
          <button
            onClick={() => router.push('/profile/edit')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50"
          >
            <Edit size={20} />
            <span>Edit Profile</span>
          </button>
        </div>

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-2xl sticky top-8">
                {/* Avatar with Upload */}
                <div className="text-center mb-6">
                  <div className="relative w-32 h-32 mx-auto mb-4 group">
                    <div className="w-full h-full bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center text-6xl shadow-2xl shadow-red-500/30 overflow-hidden">
                      {user.profile_pic ? (
                        <img
                          src={user.profile_pic.startsWith('http')
                            ? user.profile_pic
                            : `https://fightmatch-backend.onrender.com${user.profile_pic}`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-5xl">👤</span>
                      )}
                    </div>

                    {/* Upload overlay on hover */}
                    <label
                      htmlFor="photo-upload-profile"
                      className="absolute inset-0 bg-black/70 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Plus className="text-white mb-1" size={32} />
                      <span className="text-white text-xs font-semibold">Upload Photo</span>
                    </label>

                    <input
                      id="photo-upload-profile"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Upload hint text */}
                  <p className="text-gray-500 text-xs mb-3">
                    Hover over photo to upload
                  </p>

                  <h2 className="text-3xl font-bold text-white mb-1">{user.full_name}</h2>
                  <p className="text-gray-400 text-lg">@{user.username}</p>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                    <span className="text-gray-400 flex items-center">
                      <MapPin size={16} className="mr-2" />
                      Location
                    </span>
                    <span className="text-white font-semibold">{user.location}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                    <span className="text-gray-400 flex items-center">
                      <Calendar size={16} className="mr-2" />
                      Age
                    </span>
                    <span className="text-white font-semibold">{user.age} years</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-xl">
                    <span className="text-gray-400 flex items-center">
                      <Shield size={16} className="mr-2" />
                      Weight Class
                    </span>
                    <span className="text-white font-semibold">{user.weight_class}</span>
                  </div>
                </div>

                {/* Skill Badge */}
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Skill Level</p>
                  <div className={`inline-block px-6 py-3 bg-gradient-to-r ${getSkillColor(user.skill_level)} text-white font-bold rounded-xl shadow-lg text-lg`}>
                    {user.skill_level}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photo Gallery - Move to top */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
                <PhotoGalleryManager userId={user.id} isOwner={true} />
              </div>

              {/* Fight Record - Prominent Display */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <Award className="mr-2 text-yellow-500" size={28} />
                    Fight Record
                  </h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-3xl font-bold text-green-400">{getWinRate()}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold text-green-400 mb-2">{user.wins}</div>
                    <p className="text-gray-400 font-semibold">Wins</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold text-red-400 mb-2">{user.losses}</div>
                    <p className="text-gray-400 font-semibold">Losses</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
                    <div className="text-5xl font-bold text-yellow-400 mb-2">{user.draws}</div>
                    <p className="text-gray-400 font-semibold">Draws</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-900/50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-400 flex items-center">
                    <TrendingUp size={20} className="mr-2 text-blue-400" />
                    Total Fights
                  </span>
                  <span className="text-2xl font-bold text-white">{getTotalFights()}</span>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-4">About Me</h3>
                <p className="text-gray-300 leading-relaxed text-lg">{user.bio}</p>
              </div>

              {/* Physical Stats */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6">Physical Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Height</p>
                    <p className="text-2xl font-bold text-white">{user.height} cm</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Weight</p>
                    <p className="text-2xl font-bold text-white">{user.weight} kg</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Email</p>
                    <p className="text-lg font-semibold text-white truncate">{user.email}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-1">Experience</p>
                    <p className="text-2xl font-bold text-white">{user.experience_years} years</p>
                  </div>
                </div>
              </div>

              {/* Fighting Skills */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
                <h3 className="text-2xl font-bold text-white mb-6">Fighting Skills</h3>

                <div className="space-y-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-3 font-semibold">Martial Arts</p>
                    <div className="flex flex-wrap gap-3">
                      {user.martial_arts.map((art, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/40 text-red-400 rounded-xl font-semibold text-sm hover:from-red-500/30 hover:to-red-600/30 transition"
                        >
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-3 font-semibold">Preferred Styles</p>
                    <div className="flex flex-wrap gap-3">
                      {user.preferred_styles.map((style, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-gradient-to-r from-gray-600/30 to-gray-700/30 border border-gray-600/50 text-gray-300 rounded-xl font-semibold text-sm hover:from-gray-600/40 hover:to-gray-700/40 transition"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Gallery */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
                <PhotoGalleryManager userId={user.id} isOwner={true} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}