// components/GlobalAchievementToasts.js
import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import AchievementToast from './AchievementToast';

export default function GlobalAchievementToasts() {
  const { newAchievements, dismissAchievement, markAchievementsAsRead } = useNotifications();

  useEffect(() => {
    // Mark as read when user dismisses all toasts
    if (newAchievements.length === 0) {
      markAchievementsAsRead();
    }
  }, [newAchievements]);

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-4 pointer-events-none">
      <div className="pointer-events-auto">
        {newAchievements.slice(0, 3).map((notification) => (
          <div key={notification.id} className="mb-4">
            <AchievementToast
              notification={notification}
              onClose={() => dismissAchievement(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}