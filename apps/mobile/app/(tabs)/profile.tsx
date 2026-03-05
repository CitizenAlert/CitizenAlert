import { useState } from 'react';
import { View, StyleSheet, Button, Text, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit profile fields
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'citizen':
        return 'Citoyen';
      case 'municipality':
        return 'Mairie';
      case 'admin':
        return 'Administrateur';
      default:
        return 'Inconnu';
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'citizen':
        return '#2196F3';
      case 'municipality':
        return '#4CAF50';
      case 'admin':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const handleSaveProfile = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert('Erreur de validation', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await authService.updateProfile({
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || undefined,
      });
      setUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour avec succès');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Échec de la mise à jour du profil';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur de validation', 'Veuillez remplir tous les champs de mot de passe');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Erreur de validation', 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur de validation', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      Alert.alert('Succès', 'Mot de passe changé avec succès');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Échec du changement de mot de passe';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await authService.deleteAccount();
              logout();
              router.replace('/auth/login');
              Alert.alert('Succès', 'Votre compte a été supprimé');
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Échec de la suppression du compte';
              Alert.alert('Erreur', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  const handleBroadcastNotification = () => {
    Alert.prompt(
      'Notification de test',
      'Envoyer une notification à tous les utilisateurs (DEBUG)',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async (message) => {
            if (!message) return;
            setLoading(true);
            try {
              const { api } = await import('@/services/api');
              const response = await api.post('/notifications/broadcast', {
                title: 'Notification de test',
                message: message,
                type: 'hazard_nearby',
              });

              Alert.alert('Succès', `Notification envoyée à ${response.data.sent} utilisateur(s)`);
            } catch (error: unknown) {
              console.error('Broadcast error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Échec de l\'envoi de la notification';
              Alert.alert('Erreur', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.text}>Veuillez vous connecter pour voir votre profil</Text>
        <Button title="Se connecter" onPress={() => router.replace('/auth/login')} color="#2196F3" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: insets.top }}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
          <Text style={styles.roleBadgeText}>{getRoleLabel(user.role)}</Text>
        </View>
      </View>

      {!isEditing && !isChangingPassword && (
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Nom :</Text>
            <Text style={styles.value}>{user.firstName} {user.lastName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email :</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
          {user.phoneNumber && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Téléphone :</Text>
              <Text style={styles.value}>{user.phoneNumber}</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              title="Modifier le profil"
              onPress={() => {
                setFirstName(user.firstName);
                setLastName(user.lastName);
                setEmail(user.email);
                setPhoneNumber(user.phoneNumber || '');
                setIsEditing(true);
              }}
              color="#2196F3"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Changer le mot de passe"
              onPress={() => setIsChangingPassword(true)}
              color="#FF9800"
            />
            <View style={styles.buttonSpacer} />
            {user.role === 'admin' && (
              <>
                <Button
                  title="Créer un compte Mairie"
                  onPress={() => router.push('/admin/create-mairie')}
                  color="#4CAF50"
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title="🔔 Notification de test (DEBUG)"
                  onPress={handleBroadcastNotification}
                  color="#9C27B0"
                />
                <View style={styles.buttonSpacer} />
              </>
            )}
            <Button
              title="Supprimer le compte"
              onPress={handleDeleteAccount}
              color="#F44336"
            />
            <View style={styles.buttonSpacer} />
            <Button title="Déconnexion" onPress={handleLogout} color="#757575" />
          </View>
        </View>
      )}

      {isEditing && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modifier le profil</Text>
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
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Enregistrement...' : 'Enregistrer'}
              onPress={handleSaveProfile}
              disabled={loading}
              color="#2196F3"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Annuler"
              onPress={() => setIsEditing(false)}
              color="#757575"
            />
          </View>
        </View>
      )}

      {isChangingPassword && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe actuel *"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Nouveau mot de passe (min 8 caractères) *"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmer le nouveau mot de passe *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <View style={styles.buttonContainer}>
            <Button
              title={loading ? 'Changement...' : 'Changer le mot de passe'}
              onPress={handleChangePassword}
              disabled={loading}
              color="#FF9800"
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Annuler"
              onPress={() => {
                setIsChangingPassword(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              color="#757575"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    width: 100,
    color: '#666',
  },
  value: {
    fontSize: 16,
    flex: 1,
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
  },
  buttonSpacer: {
    height: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
