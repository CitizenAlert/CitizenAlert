import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isValidating, hydrate } = useAuthStore();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const hasNavigated = useRef(false);
  const isMounted = useRef(false);
  const hasHydrated = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    // Hydrate auth store on mount to restore token from AsyncStorage
    if (!hasHydrated.current) {
      hasHydrated.current = true;
      hydrate();
    }
  }, [hydrate]);

  useEffect(() => {
    if (hasNavigated.current || !isMounted.current || isValidating) return;
    
    // Use requestAnimationFrame to ensure navigation happens after render cycle
    const frameId = requestAnimationFrame(() => {
      if (hasNavigated.current) return;
      
      try {
        hasNavigated.current = true;
        
        // Check onboarding first
        if (!hasCompletedOnboarding) {
          router.replace('/onboarding');
        } else {
          // Always navigate to tabs - tabs layout handles showing map or login
          router.replace('/(tabs)/map');
        }
      } catch (error: any) {
        hasNavigated.current = false; // Allow retry on error
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [isAuthenticated, isValidating, hasCompletedOnboarding, router]);

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
