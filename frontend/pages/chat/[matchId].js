import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/firebase'; // Adjust path: '../firebase' or '../../src/firebase'

export default function Messages() {
  const router = useRouter();
  const { matchId } = router.query;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch other user info
  useEffect(() => {
    if (!matchId) return;

    const fetchOtherUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`https://fightmatch-backend.onrender.com/users/${matchId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setOtherUser(data);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchOtherUser();
  }, [matchId]);

  // Real-time listener for messages
  useEffect(() => {
    if (!matchId) return;

    const currentUserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('user_id')) : null;
    if (!currentUserId) {
      console.error('No user_id in localStorage');
      return;
    }

    // Create conversation ID (same logic as backend)
    const conversationId = `chat_${Math.min(currentUserId, parseInt(matchId))}_${Math.max(currentUserId, parseInt(matchId))}`;

    // Set up real-time listener
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to JS Date
          timestamp: data.timestamp?.toDate()
        });
      });
      setMessages(msgs);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [matchId]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

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
        setNewMessage(''); // Clear input
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

  const currentUserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('user_id')) : null;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-white hover:text-gray-300"
          >
            ← Back
          </button>
          {otherUser && (
            <div className="flex items-center gap-3">
              {otherUser.profile_pic && (
                <img
                  src={otherUser.profile_pic}
                  alt={otherUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <h2 className="text-white font-semibold">{otherUser.username}</h2>
                <p className="text-gray-400 text-sm">{otherUser.skill_level}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation! 🥊
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    isCurrentUser
                      ? 'bg-red-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-white rounded-bl-none'
                  }`}>
                    {!isCurrentUser && (
                      <p className="text-xs text-gray-300 mb-1 font-semibold">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="break-words">{msg.content}</p>
                    {msg.timestamp && (
                      <p className="text-xs text-gray-300 mt-1 opacity-70">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 bg-gray-700 text-white rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading}
            className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}