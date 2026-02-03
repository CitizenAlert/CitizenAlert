import { View, StyleSheet, Button } from 'react-native';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile Screen</Text>
      {user && (
        <View style={styles.userInfo}>
          <Text>Email: {user.email}</Text>
          <Text>
            Name: {user.firstName} {user.lastName}
          </Text>
        </View>
      )}
      <Button title="Logout" onPress={handleLogout} color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
});
