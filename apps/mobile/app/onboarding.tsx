import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboardingStore';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Bienvenue à CitizenAlert',
    description: 'Signalez les incidents dans votre ville et restez connecté avec votre communauté',
    icon: 'alert-circle',
    color: '#FF6B6B',
  },
  {
    id: '2',
    title: 'Signalez les Incidents',
    description: 'C\'est simple ! Appuyez sur la carte → Sélectionnez un type d\'incident → Prenez une photo → Ajoutez une description → Soumettez !',
    icon: 'location',
    color: '#4E89FF',
  },
  {
    id: '3',
    title: 'Restez Informé',
    description: 'Recevez des notifications sur les incidents près de vous et contribuez à améliorer votre ville',
    icon: 'notifications',
    color: '#FFD93D',
  },
  {
    id: '4',
    title: 'Commencez Maintenant',
    description: 'Explorez la carte, signalez des incidents et aidez votre communauté à rester en sécurité',
    icon: 'checkmark-circle',
    color: '#6BCB77',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { completeOnboarding } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/map');
  };

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)/map');
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width, backgroundColor: theme.colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={80} color={item.color} />
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        ref={scrollRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? theme.colors.primary : theme.colors.divider,
              },
            ]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentIndex > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.skipButton, { borderColor: theme.colors.primary }]}
            onPress={() => scrollRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true })}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Précédent</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            { backgroundColor: theme.colors.primary, flex: currentIndex > 0 ? 1 : 1 },
          ]}
          onPress={currentIndex === SLIDES.length - 1 ? handleFinish : handleNext}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skip Button (only on first 3 slides) */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
          <Text style={[styles.skipLinkText, { color: theme.colors.textSecondary }]}>
            Passer
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    borderWidth: 2,
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
