import { Stack } from 'expo-router';

export default function IncidentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="photo"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="recap"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
