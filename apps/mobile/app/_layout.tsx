import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '@/stores/authStore';
import { pushNotificationService } from '@/services/pushNotificationService';

Sentry.init({
  dsn: 'https://3f8f0e3f626eba064aa50075606bacca@o4510986403774464.ingest.de.sentry.io/4510986467672144',
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (isAuthenticated) {
      pushNotificationService.registerForPushNotifications().then((token) => {
        if (token) {
          pushNotificationService.sendTokenToBackend(token);
        }
      });
    }

    notificationListener.current = pushNotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = pushNotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        const data = response.notification.request.content.data;

        if (data?.hazardId) {
          router.push('/(tabs)/map');
        } else {
          router.push('/(tabs)/notifications');
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerBackVisible: false,
            gestureEnabled: false,
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="auth/login"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="auth/register"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="incident"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="admin/create-mairie"
            options={{
              title: 'Créer un compte Mairie',
              headerShown: true,
              headerBackVisible: true,
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
});
