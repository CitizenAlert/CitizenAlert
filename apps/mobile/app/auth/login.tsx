import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuthStore();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur de validation', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Navigate directly to tabs - the Stack configuration prevents back button
      router.replace('/(tabs)/map');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite lors de la connexion';
      Alert.alert('Échec de la connexion', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top + 16 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/map')}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.colors.text }]}>Connexion à CitizenAlert</Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            borderColor: theme.colors.inputBorder,
            color: theme.colors.text,
          },
        ]}
        placeholder="Email"
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
        placeholder="Mot de passe"
        placeholderTextColor={theme.colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button title={loading ? 'Chargement...' : 'Se connecter'} onPress={handleLogin} disabled={loading} />

      <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => router.push('/auth/register')}>
        Pas de compte ? S'inscrire
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    textAlign: 'center',
  },
});
