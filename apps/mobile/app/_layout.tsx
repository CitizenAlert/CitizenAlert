import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function RootLayout() {
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
}
