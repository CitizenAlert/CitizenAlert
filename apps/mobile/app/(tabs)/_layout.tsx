import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { notificationService } from '@/services/notificationService';
import { head } from 'node_modules/axios/index.cjs';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationService.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));

      const interval = setInterval(() => {
        notificationService.getUnreadCount().then(setUnreadCount).catch(() => setUnreadCount(0));
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="map" 
        options={{
          headerShown: false,
        }} />
      <Stack.Screen name="report"
       options={{ headerShown: false}}/>
      <Stack.Screen name="notifications" 
        options={{
          headerShown: false,
        }} />
      <Stack.Screen name="profile" 
        options={{
          headerShown: false,
        }} />
    </Stack>
  );
}