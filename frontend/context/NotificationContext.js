// context/NotificationContext.js - ENHANCED VERSION
import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [unreadMatches, setUnreadMatches] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadAchievements, setUnreadAchievements] = useState(0);
  const [newAchievements, setNewAchievements] = useState([]);

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

  // Fetch unread achievements
  const fetchUnreadAchievements = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('https://fightmatch-backend.onrender.com/notifications/achievements?unread_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadAchievements(data.notifications.length);

        // Check for new achievements to show toasts
        const newOnes = data.notifications.filter(
          n => !newAchievements.find(existing => existing.id === n.id)
        );

        if (newOnes.length > 0) {
          setNewAchievements(prev => [...prev, ...newOnes]);
        }
      }
    } catch (error) {
      console.error('Error fetching unread achievements:', error);
    }
  };

  // Poll for updates every 10 seconds
  useEffect(() => {
    fetchUnreadMatches();
    fetchUnreadAchievements();

    const interval = setInterval(() => {
      fetchUnreadMatches();
      fetchUnreadAchievements();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const markMatchesAsRead = () => {
    setUnreadMatches(0);
  };

  const markAchievementsAsRead = () => {
    setUnreadAchievements(0);
    setNewAchievements([]);
  };

  const dismissAchievement = (achievementId) => {
    setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  return (
    <NotificationContext.Provider value={{
      unreadMatches,
      unreadMessages,
      unreadAchievements,
      newAchievements,
      fetchUnreadMatches,
      fetchUnreadAchievements,
      markMatchesAsRead,
      markAchievementsAsRead,
      dismissAchievement
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}