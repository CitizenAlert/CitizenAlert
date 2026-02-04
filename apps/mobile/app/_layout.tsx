import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
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
          headerBackVisible: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="auth/login" 
        options={{
          headerBackVisible: false,
          gestureEnabled: false,
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="auth/register" 
        options={{
          headerBackVisible: false,
          gestureEnabled: false,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
