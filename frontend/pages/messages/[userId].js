// pages/messages/[userId].js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import { Send, ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';

export default function MessageThread() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const { userId } = router.query;

  const getConversationId = (user1Id, user2Id) => {
    const ids = [parseInt(user1Id), parseInt(user2Id)].sort((a, b) => a - b);
    return `conversation_${ids[0]}_${ids[1]}`;
  };

  useEffect(() => {
    if (userId) {
      fetchCurrentUser();
      fetchOtherUser();
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser && userId) {
      fetchMessages();
    }
  }, [currentUser, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch('http://localhost:8000/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchOtherUser = async () => {
    const token = localStorage.getItem('access_token');
    try {
      // Changed from /stats/${userId} to /users/${userId}
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOtherUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = () => {
    if (!currentUser) return;

    const conversationId = getConversationId(currentUser.id, userId);
    const storedMessages = localStorage.getItem(conversationId);

    if (storedMessages) {
      const allMessages = JSON.parse(storedMessages);
      const messagesWithOwnership = allMessages.map(msg => ({
        ...msg,
        isCurrentUser: msg.senderId === currentUser.id
      }));
      setMessages(messagesWithOwnership);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      senderId: currentUser.id,
      senderName: currentUser.username,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, { ...message, isCurrentUser: true }];
    setMessages(updatedMessages);

    const conversationId = getConversationId(currentUser.id, userId);
    const messagesToSave = updatedMessages.map(({ isCurrentUser, ...msg }) => msg);
    localStorage.setItem(conversationId, JSON.stringify(messagesToSave));

    setNewMessage('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent mb-4"></div>
            <p className="text-gray-400 text-xl">Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navigation />

      {/* Chat Header - Modern & Sleek */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-red-500/20 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and user info */}
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
                        : `http://localhost:8000${otherUser.profile_pic}`}
                      alt={otherUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    '🥊'
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {otherUser?.username || 'User'}
                  </h2>
                  <p className="text-sm text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-700/50 rounded-xl transition text-gray-400 hover:text-white">
                <Phone size={20} />
              </button>
              <button className="p-2 hover:bg-gray-700/50 rounded-xl transition text-gray-400 hover:text-white">
                <Video size={20} />
              </button>
              <button className="p-2 hover:bg-gray-700/50 rounded-xl transition text-gray-400 hover:text-white">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area - Beautiful scrollable chat */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16">
                <div className="text-7xl mb-4">💬</div>
                <p className="text-gray-400 text-lg">No messages yet</p>
                <p className="text-gray-500 text-sm mt-2">Start the conversation with your sparring partner!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const showAvatar = index === 0 || messages[index - 1].isCurrentUser !== msg.isCurrentUser;
                const isLastInGroup = index === messages.length - 1 || messages[index + 1].isCurrentUser !== msg.isCurrentUser;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'} ${!isLastInGroup ? 'mb-1' : 'mb-4'}`}
                  >
                    <div className={`flex items-end space-x-2 max-w-md ${msg.isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      {!msg.isCurrentUser && showAvatar && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm flex-shrink-0 mb-1">
                          {msg.senderName[0].toUpperCase()}
                        </div>
                      )}
                      {!msg.isCurrentUser && !showAvatar && (
                        <div className="w-8"></div>
                      )}

                      {/* Message bubble */}
                      <div className="flex flex-col">
                        {!msg.isCurrentUser && showAvatar && (
                          <span className="text-xs text-gray-500 mb-1 ml-3">
                            {msg.senderName}
                          </span>
                        )}
                        <div
                          className={`px-4 py-3 rounded-2xl shadow-lg ${
                            msg.isCurrentUser
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-md'
                              : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-bl-md'
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                          <p className={`text-xs mt-1 ${
                            msg.isCurrentUser ? 'text-red-200' : 'text-gray-500'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Message Input - Modern floating style */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-red-500/20 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <form onSubmit={sendMessage} className="flex items-end space-x-3">
            <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-red-500 transition">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows="1"
                className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none max-h-32"
                style={{ minHeight: '50px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 text-white rounded-2xl transition-all shadow-lg disabled:shadow-none hover:shadow-red-500/50 flex items-center justify-center"
            >
              <Send size={20} />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}