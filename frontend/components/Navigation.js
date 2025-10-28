// components/Navigation.js - ENHANCED WITH ACHIEVEMENT NOTIFICATIONS
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { Home, Users, MessageSquare, User, LogOut, BarChart3, Trophy, Settings, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import Link from 'next/link';

export default function Navigation() {
  const router = useRouter();
  const { unreadMatches, unreadAchievements } = useNotifications();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login').catch(() => {
      // Fallback if push fails
      window.location.href = '/login';
    });
  };

  const navItems = [
    { name: 'Discover', path: '/discover', icon: Users },
    { name: 'Matches', path: '/matches', icon: MessageSquare, badge: unreadMatches },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    {
      name: 'Achievements',
      path: '/achievements',
      icon: Trophy,
      badge: unreadAchievements,
      badgeColor: 'bg-yellow-500' // Different color for achievements
    },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="bg-gray-800 border-b border-red-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Use Link instead of onClick */}
          <Link href="/discover">
            <a className="flex items-center space-x-2 cursor-pointer group">
              <div className="text-2xl">⚔️</div>
              <span className="text-xl font-bold text-white group-hover:text-red-500 transition">
                FightMatch
              </span>
            </a>
          </Link>

          {/* Navigation Links - Use Link components */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.path;

              return (
                <Link key={item.path} href={item.path}>
                  <a className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}>
                    {/* ... icon and badge content ... */}
                  </a>
                </Link>
              );
            })}

            {/* Logout stays as button with error handling */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 ml-2"
            >
              <LogOut size={20} />
              <span className="hidden md:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}