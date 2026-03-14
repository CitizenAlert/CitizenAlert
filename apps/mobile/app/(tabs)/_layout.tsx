import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { notificationService } from '@/services/notificationService';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch unread count
      notificationService.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));

      // Poll every 30 seconds
      const interval = setInterval(() => {
        notificationService.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide the footer tab bar
      }}
    >
      {/* Map is the only screen shown */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Carte',
        }}
      />

      {/* Hidden tabs - accessible via programmatic navigation only */}
      <Tabs.Screen
        name="report"
        options={{
          href: null, // Don't show in tabs
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
