// pages/matches.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../components/Navigation';
import { MessageSquare, Trophy, Target, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../src/firebase';

export default function Matches() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const { markMatchesAsRead } = useNotifications();
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [recordData, setRecordData] = useState({
    result: 'win',
    martialArtStyle: '',
    notes: ''
  });

  const martialArts = [
    'BJJ', 'Muay Thai', 'Boxing', 'Wrestling', 'Judo',
    'Karate', 'Taekwondo', 'Kickboxing', 'MMA', 'Sambo'
  ];

  useEffect(() => {
    markMatchesAsRead();

    const markRead = async () => {
      try {
        const token = localStorage.getItem('access_token');
        await fetch('https://fightmatch-backend.onrender.com/matches/mark-read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Error marking matches as read:', error);
      }
    };

    markRead();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/matches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data);

        // Set up real-time listeners for each match
        data.forEach(match => {
          setupMessageListener(match.id);
        });
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupMessageListener = async (matchId) => {
    try {
      const token = localStorage.getItem('access_token');

      // Get current user ID
      const userResponse = await fetch('https://fightmatch-backend.onrender.com/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userResponse.ok) return;

      const currentUser = await userResponse.json();
      const currentUserId = currentUser.id;

      // Create conversation ID
      const conversationId = `chat_${Math.min(currentUserId, matchId)}_${Math.max(currentUserId, matchId)}`;

      // Listen to messages in this conversation
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let unreadCount = 0;
        let lastMsg = null;

        snapshot.forEach((doc) => {
          const data = doc.data();
          lastMsg = {
            content: data.content,
            timestamp: data.timestamp?.toDate(),
            sender_id: data.sender_id
          };

          // Count unread messages (messages not sent by current user)
          if (data.sender_id !== currentUserId && !data.read) {
            unreadCount++;
          }
        });

        setUnreadMessages(prev => ({
          ...prev,
          [matchId]: unreadCount
        }));

        setLastMessages(prev => ({
          ...prev,
          [matchId]: lastMsg
        }));
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up message listener:', error);
    }
  };

  const handleRecordFight = (match) => {
    setSelectedMatch(match);
    setShowRecordModal(true);
  };

  const submitFightRecord = async () => {
    if (!recordData.martialArtStyle) {
      alert('Please select a martial art style');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/fights/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          opponent_id: selectedMatch.id,
          result: recordData.result,
          martial_art_style: recordData.martialArtStyle,
          notes: recordData.notes || ""
        })
      });

      if (response.ok) {
        alert('Fight recorded successfully!');
        setShowRecordModal(false);
        setRecordData({ result: 'win', martialArtStyle: '', notes: '' });
        setSelectedMatch(null);
      } else {
        alert('Failed to record fight');
      }
    } catch (error) {
      console.error('Error recording fight:', error);
      alert('Error recording fight');
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="text-center py-16 text-gray-400 text-xl">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
          <MessageSquare className="text-red-500" size={40} />
          Your Matches
        </h1>

        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥊</div>
            <p className="text-gray-400 text-xl mb-4">No matches yet</p>
            <p className="text-gray-500 mb-6">Start swiping to find your sparring partners!</p>
            <button
              onClick={() => router.push('/discover')}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              Discover Fighters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match) => {
              const hasUnread = unreadMessages[match.id] > 0;
              const lastMsg = lastMessages[match.id];

              return (
                <div
                  key={match.id}
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border transition-all duration-300 shadow-lg relative ${
                    hasUnread
                      ? 'border-red-500/50 shadow-red-500/20 ring-2 ring-red-500/30'
                      : 'border-red-500/20 hover:border-red-500/50'
                  }`}
                >
                  {/* Unread Badge */}
                  {hasUnread && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                      <Bell size={12} />
                      {unreadMessages[match.id]} new
                    </div>
                  )}

                  {/* Match Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 relative">
                      {match.profile_pic ? (
                        <img
                          src={match.profile_pic.startsWith('http')
                            ? match.profile_pic
                            : `https://fightmatch-backend.onrender.com${match.profile_pic}`}
                          alt={match.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        match.username.charAt(0).toUpperCase()
                      )}
                      {hasUnread && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{match.username}</h3>
                      <p className="text-gray-400 text-sm">{match.skill_level || 'Intermediate'}</p>

                      {/* Last Message Preview */}
                      {lastMsg && (
                        <div className="mt-1">
                          <p className={`text-sm truncate ${hasUnread ? 'text-white font-semibold' : 'text-gray-500'}`}>
                            {lastMsg.content}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {formatLastMessageTime(lastMsg.timestamp)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                      <p className="text-green-500 font-bold text-lg">{match.wins || 0}</p>
                      <p className="text-gray-500 text-xs">Wins</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                      <p className="text-red-500 font-bold text-lg">{match.losses || 0}</p>
                      <p className="text-gray-500 text-xs">Losses</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-2 text-center">
                      <p className="text-yellow-500 font-bold text-lg">{match.draws || 0}</p>
                      <p className="text-gray-500 text-xs">Draws</p>
                    </div>
                  </div>

                  {/* Martial Arts */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {match.martial_arts && match.martial_arts.slice(0, 3).map((style, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold"
                        >
                          {style}
                        </span>
                      ))}
                      {match.martial_arts && match.martial_arts.length > 3 && (
                        <span className="px-3 py-1 bg-gray-700 text-gray-400 rounded-lg text-sm font-semibold">
                          +{match.martial_arts.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/chat/${match.id}`)}
                      className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-lg transition-all relative ${
                        hasUnread
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <MessageSquare size={18} />
                      Message
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 bg-yellow-500 text-gray-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {unreadMessages[match.id]}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleRecordFight(match)}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 rounded-lg transition shadow-lg shadow-green-500/20"
                    >
                      <Trophy size={18} />
                      Record Fight
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Fight Modal */}
      {showRecordModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-lg w-full border-2 border-red-500/30 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Trophy className="text-red-500" />
                Record Fight vs {selectedMatch.username}
              </h2>
              <button
                onClick={() => {
                  setShowRecordModal(false);
                  setRecordData({ result: 'win', martialArtStyle: '', notes: '' });
                }}
                className="text-gray-400 hover:text-white transition text-2xl"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-6">
              {/* Result Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Match Result
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordData({ ...recordData, result: 'win' })}
                    className={`py-4 rounded-xl font-bold transition-all ${
                      recordData.result === 'win'
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/50 scale-105'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    WIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordData({ ...recordData, result: 'loss' })}
                    className={`py-4 rounded-xl font-bold transition-all ${
                      recordData.result === 'loss'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/50 scale-105'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    LOSS
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordData({ ...recordData, result: 'draw' })}
                    className={`py-4 rounded-xl font-bold transition-all ${
                      recordData.result === 'draw'
                        ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-500/50 scale-105'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    DRAW
                  </button>
                </div>
              </div>

              {/* Martial Art Style */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                  <Target size={16} className="text-red-500" />
                  Martial Art Style
                </label>
                <select
                  value={recordData.martialArtStyle}
                  onChange={(e) => setRecordData({ ...recordData, martialArtStyle: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 transition"
                  required
                >
                  <option value="">Choose style...</option>
                  {martialArts.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={recordData.notes}
                  onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                  placeholder="How did the match go? Any highlights?"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={submitFightRecord}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-500/50 transform hover:scale-105"
              >
                Record Fight Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}