import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';
import type { ThemeMode } from '@/types/theme';

export const ThemeSelector = () => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeStore();

  const themes: { label: string; value: ThemeMode }[] = [
    { label: 'Auto (système)', value: 'auto' },
    { label: 'Mode clair', value: 'light' },
    { label: 'Mode sombre', value: 'dark' },
  ];

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    Alert.alert('Thème mis à jour', `Le thème ${themes.find((t) => t.value === mode)?.label} a été appliqué.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Thème de l'application</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Choisissez votre préférence d'affichage</Text>

      <View style={[styles.optionsContainer, { borderColor: theme.colors.divider }]}>
        {themes.map((themeOption) => (
          <TouchableOpacity
            key={themeOption.value}
            style={[
              styles.themeOption,
              themeMode === themeOption.value && {
                backgroundColor: theme.colors.primaryLight,
              },
              { borderBottomColor: theme.colors.divider },
            ]}
            onPress={() => handleThemeChange(themeOption.value)}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name={themeOption.value === 'auto' ? 'phone-portrait' : themeOption.value === 'light' ? 'sunny' : 'moon'}
                size={20}
                color={themeMode === themeOption.value ? '#fff' : theme.colors.text}
              />
              <Text
                style={[
                  styles.optionLabel,
                  {
                    color: themeMode === themeOption.value ? '#fff' : theme.colors.text,
                  },
                ]}
              >
                {themeOption.label}
              </Text>
            </View>
            {themeMode === themeOption.value && <Ionicons name="checkmark-circle" size={24} color="#fff" />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  optionsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
