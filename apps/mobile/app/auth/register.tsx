import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register } = useAuthStore();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Erreur de validation', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erreur de validation', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      // Mobile app only creates citizen accounts.
      await register({ email, password, firstName, lastName, phoneNumber });
      // Navigate directly to tabs - the Stack configuration prevents back button
      router.replace('/(tabs)/map');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite lors de l\'inscription';
      Alert.alert('Échec de l\'inscription', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/map')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.colors.text }]}>Créer un compte</Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
        ]}
        placeholder="Prénom *"
        placeholderTextColor={theme.colors.placeholder}
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
        ]}
        placeholder="Nom *"
        placeholderTextColor={theme.colors.placeholder}
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
        ]}
        placeholder="Email *"
        placeholderTextColor={theme.colors.placeholder}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
        ]}
        placeholder="Numéro de téléphone (optionnel)"
        placeholderTextColor={theme.colors.placeholder}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
        ]}
        placeholder="Mot de passe (min 8 caractères) *"
        placeholderTextColor={theme.colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={loading ? 'Création du compte...' : 'S\'inscrire'}
        onPress={handleRegister}
        disabled={loading}
      />

      <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => router.push('/auth/login')}>
        Déjà un compte ? Se connecter
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    minHeight: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  link: {
    marginTop: 15,
    marginBottom: 30,
    textAlign: 'center',
  },
});
