import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
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
          title: 'Login',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="auth/register"
        options={{
          title: 'Register',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
