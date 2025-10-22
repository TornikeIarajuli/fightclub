// pages/profile/update-record.js
// Create this new file

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { Trophy, TrendingUp, Save, X } from 'lucide-react';

export default function UpdateRecord() {
  const [record, setRecord] = useState({
    wins: 0,
    losses: 0,
    draws: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCurrentRecord();
  }, []);

  const fetchCurrentRecord = async () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/users/me', {
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
      setRecord({
        wins: data.wins || 0,
        losses: data.losses || 0,
        draws: data.draws || 0
      });
    } catch (error) {
      console.error('Error fetching record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      setRecord({
        ...record,
        [field]: numValue
      });
    }
  };

  const handleIncrement = (field) => {
    setRecord({
      ...record,
      [field]: record[field] + 1
    });
  };

  const handleDecrement = (field) => {
    if (record[field] > 0) {
      setRecord({
        ...record,
        [field]: record[field] - 1
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch('http://localhost:8000/users/me/record', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(record)
      });

      if (response.ok) {
        setSuccess('Fight record updated successfully!');
        setTimeout(() => {
          router.push('/profile');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to update record');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.error('Error updating record:', error);
    } finally {
      setSaving(false);
    }
  };

  const getTotalFights = () => record.wins + record.losses + record.draws;
  const getWinRate = () => {
    const total = getTotalFights();
    if (total === 0) return 0;
    return ((record.wins / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400 text-xl">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
              Update Fight Record
            </h1>
            <p className="text-gray-400">Manage your wins, losses, and draws</p>
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-500">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Preview */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 border border-red-500/20 shadow-xl sticky top-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Trophy className="mr-2 text-yellow-500" />
                Current Stats
              </h3>

              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Total Fights</p>
                  <p className="text-4xl font-bold text-white">{getTotalFights()}</p>
                </div>

                <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Win Rate</p>
                  <p className="text-4xl font-bold text-green-400">{getWinRate()}%</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl">
                    <span className="text-gray-400">Wins</span>
                    <span className="text-xl font-bold text-green-400">{record.wins}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl">
                    <span className="text-gray-400">Losses</span>
                    <span className="text-xl font-bold text-red-400">{record.losses}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl">
                    <span className="text-gray-400">Draws</span>
                    <span className="text-xl font-bold text-yellow-400">{record.draws}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 border border-red-500/20 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <TrendingUp className="mr-2 text-blue-400" />
                Update Your Record
              </h3>

              <div className="space-y-6">
                {/* Wins */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
                  <label className="block text-green-400 text-lg font-bold mb-4">
                    Wins
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => handleDecrement('wins')}
                      className="w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-2xl font-bold transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={record.wins}
                      onChange={(e) => handleChange('wins', e.target.value)}
                      className="flex-1 px-6 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center text-3xl font-bold focus:outline-none focus:border-green-500 transition"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleIncrement('wins')}
                      className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl text-2xl font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Losses */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <label className="block text-red-400 text-lg font-bold mb-4">
                    Losses
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => handleDecrement('losses')}
                      className="w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-2xl font-bold transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={record.losses}
                      onChange={(e) => handleChange('losses', e.target.value)}
                      className="flex-1 px-6 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center text-3xl font-bold focus:outline-none focus:border-red-500 transition"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleIncrement('losses')}
                      className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl text-2xl font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Draws */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
                  <label className="block text-yellow-400 text-lg font-bold mb-4">
                    Draws
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => handleDecrement('draws')}
                      className="w-14 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-2xl font-bold transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={record.draws}
                      onChange={(e) => handleChange('draws', e.target.value)}
                      className="flex-1 px-6 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white text-center text-3xl font-bold focus:outline-none focus:border-yellow-500 transition"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => handleIncrement('draws')}
                      className="w-14 h-14 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl text-2xl font-bold transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-xl transition shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}