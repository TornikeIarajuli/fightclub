import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadMatches, setUnreadMatches] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread matches count
  const fetchUnreadMatches = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('https://fightmatch-backend.onrender.com/matches/unread', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMatches(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread matches:', error);
    }
  };

  // Poll for updates every 10 seconds
  useEffect(() => {
    fetchUnreadMatches();
    const interval = setInterval(fetchUnreadMatches, 10000);
    return () => clearInterval(interval);
  }, []);

  const markMatchesAsRead = () => {
    setUnreadMatches(0);
  };

  return (
    <NotificationContext.Provider value={{
      unreadMatches,
      unreadMessages,
      fetchUnreadMatches,
      markMatchesAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}