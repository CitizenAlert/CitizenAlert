import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="map" />
      <Tabs.Screen name="report" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
