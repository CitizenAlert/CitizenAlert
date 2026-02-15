import { Stack } from 'expo-router';

export default function IncidentLayout() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerTintColor: '#2563eb',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
      }}
    >
      <Stack.Screen
        name="photo"
        options={{
          title: 'Add photo',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="recap"
        options={{
          title: 'Confirm incident',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
