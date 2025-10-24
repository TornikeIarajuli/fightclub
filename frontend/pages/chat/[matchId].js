// pages/chat/[matchId].js - COMPLETE FIX with auto mark-as-read
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase';
import Navigation from '../../components/Navigation';
import { Send, ArrowLeft, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function Messages() {
  const router = useRouter();
  const { matchId } = router.query;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "auto",
        block: "end"
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollToBottom(), 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('https://fightmatch-backend.onrender.com/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch other user info
  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!matchId) return;

      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`https://fightmatch-backend.onrender.com/users/${matchId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setOtherUser(data);
        }
      } catch (error) {
        console.error('Error fetching other user:', error);
      }
    };

    fetchOtherUser();
  }, [matchId]);

  // ✅ NEW: Mark all unread messages as read when entering chat
  useEffect(() => {
    if (!matchId || !currentUser) return;

    const markMessagesAsRead = async () => {
      try {
        const currentUserId = currentUser.id;
        const conversationId = `chat_${Math.min(currentUserId, parseInt(matchId))}_${Math.max(currentUserId, parseInt(matchId))}`;

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(
          messagesRef,
          where('sender_id', '==', parseInt(matchId)),
          where('read', '==', false)
        );

        const snapshot = await getDocs(q);

        console.log(`Found ${snapshot.size} unread messages to mark as read`);

        // Mark each message as read
        const updatePromises = [];
        snapshot.forEach((docSnapshot) => {
          const docRef = doc(db, 'conversations', conversationId, 'messages', docSnapshot.id);
          updatePromises.push(updateDoc(docRef, { read: true }));
        });

        await Promise.all(updatePromises);
        console.log('All messages marked as read');
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    // Mark messages as read when component mounts
    markMessagesAsRead();

    // Also mark as read when window gains focus (user comes back to tab)
    const handleFocus = () => markMessagesAsRead();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, [matchId, currentUser]);

  // Real-time listener for messages
  useEffect(() => {
    if (!matchId || !currentUser) return;

    const currentUserId = currentUser.id;
    const conversationId = `chat_${Math.min(currentUserId, parseInt(matchId))}_${Math.max(currentUserId, parseInt(matchId))}`;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate()
        });
      });
      setMessages(msgs);

      // ✅ Mark new messages as read immediately when they arrive
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // If it's a message from the other user and it's unread, mark it as read
          if (data.sender_id !== currentUserId && data.read === false) {
            const docRef = doc(db, 'conversations', conversationId, 'messages', change.doc.id);
            updateDoc(docRef, { read: true }).catch(err =>
              console.error('Error marking message as read:', err)
            );
          }
        }
      });
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [matchId, currentUser]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('https://fightmatch-backend.onrender.com/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          match_id: parseInt(matchId),
          content: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        setShowEmojiPicker(false);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  if (!currentUser || !otherUser) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400 text-xl">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      <Navigation />

      {/* Chat Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-red-500/20 shadow-xl flex-shrink-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/matches')}
                className="p-2 hover:bg-gray-700/50 rounded-xl transition text-gray-400 hover:text-white"
              >
                <ArrowLeft size={24} />
              </button>

              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg overflow-hidden">
                  {otherUser?.profile_pic ? (
                    <img
                      src={otherUser.profile_pic.startsWith('http')
                        ? otherUser.profile_pic
                        : `https://fightmatch-backend.onrender.com${otherUser.profile_pic}`}
                      alt={otherUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    otherUser.username.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {otherUser?.username || 'User'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {otherUser?.skill_level || 'Fighter'} • {otherUser?.location || 'Unknown location'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/profile/view/${matchId}`)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition text-sm"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-900 to-gray-950"
      >
        <div className="max-w-5xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center py-16">
                <div className="text-7xl mb-4">💬</div>
                <p className="text-gray-400 text-lg">No messages yet</p>
                <p className="text-gray-500 text-sm mt-2">Start the conversation with {otherUser.username}!</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender_id === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-end space-x-2 max-w-md ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isCurrentUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm flex-shrink-0 mb-1 overflow-hidden">
                        {otherUser.profile_pic ? (
                          <img
                            src={otherUser.profile_pic.startsWith('http')
                              ? otherUser.profile_pic
                              : `https://fightmatch-backend.onrender.com${otherUser.profile_pic}`}
                            alt={otherUser.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          msg.sender_name[0].toUpperCase()
                        )}
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl shadow-lg ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-md'
                          : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-bl-md'
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-red-200' : 'text-gray-500'
                      }`}>
                        {msg.timestamp?.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-red-500/20 shadow-2xl flex-shrink-0">
        <div className="max-w-5xl mx-auto px-4 py-4 relative">
          {showEmojiPicker && (
            <div className="absolute bottom-full right-4 mb-2 z-50">
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="absolute -top-2 -right-2 z-10 p-1.5 bg-red-600 hover:bg-red-700 rounded-full text-white shadow-lg"
              >
                <X size={16} />
              </button>
              <div className="shadow-2xl rounded-2xl overflow-hidden border border-gray-700">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme="dark"
                  width={320}
                  height={350}
                  previewConfig={{ showPreview: false }}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                  emojiStyle="native"
                />
              </div>
            </div>
          )}

          <div className="flex items-end space-x-3">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-3 rounded-2xl transition border ${
                showEmojiPicker
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700'
              }`}
            >
              <Smile size={24} />
            </button>

            <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-red-500 transition">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${otherUser.username}...`}
                rows="1"
                className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none max-h-32"
                style={{ minHeight: '50px' }}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              className="p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-2xl transition-all shadow-lg disabled:shadow-none hover:shadow-red-500/50 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}