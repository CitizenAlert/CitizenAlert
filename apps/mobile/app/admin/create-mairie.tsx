import { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

export default function CreateMairieScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') {
    return (
      <View style={styles.centered}>
        <Text style={styles.warning}>Cette page est uniquement accessible aux super administrateurs.</Text>
        <Button title="Retour au profil" onPress={() => router.replace('/(tabs)/profile')} color="#2196F3" />
      </View>
    );
  }

  const handleCreateMairie = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Erreur de validation', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Erreur de validation', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    try {
      // Since the user is already a super admin, we'll need to make a direct API call
      // that includes the admin code from the environment
      await authService.createMairieAccount({
        email,
        password,
        firstName,
        lastName,
        phoneNumber: phoneNumber || undefined,
      });
      Alert.alert('Succès', 'Compte Mairie créé avec succès !');
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue lors de la création';
      Alert.alert('Échec de la création', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Créer un compte Mairie</Text>
      <Text style={styles.helper}>
        Cet écran est réservé aux super administrateurs. Utilisez-le pour créer des comptes de mairie.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Prénom *"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Nom *"
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Numéro de téléphone (optionnel)"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe (min 8 caractères) *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title={loading ? 'Création...' : 'Créer le compte'}
        onPress={handleCreateMairie}
        disabled={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  warning: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
    textAlign: 'center',
  },
  helper: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  link: {
    marginTop: 15,
    marginBottom: 30,
    color: '#2196F3',
    textAlign: 'center',
  },
});
