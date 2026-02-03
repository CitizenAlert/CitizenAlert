import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const hasNavigated = useRef(false);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    if (hasNavigated.current || !isMounted.current) return;
    
    // Use requestAnimationFrame to ensure navigation happens after render cycle
    // This prevents "Attempted to navigate before mounting the Root Layout component" error
    const frameId = requestAnimationFrame(() => {
      if (hasNavigated.current) return;
      
      try {
        if (isAuthenticated) {
          hasNavigated.current = true;
          router.replace('/(tabs)/map');
        } else {
          hasNavigated.current = true;
          router.replace('/auth/login');
        }
      } catch (error: any) {
        hasNavigated.current = false; // Allow retry on error
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196F3" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
