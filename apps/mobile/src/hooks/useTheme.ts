import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import type { Theme } from '@/types/theme';
import { lightColors, darkColors } from '@/utils/colors';

export const useTheme = (): Theme => {
  const { themeMode } = useThemeStore();
  const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null

  return useMemo(() => {
    let isDark = false;
    
    if (themeMode === 'auto') {
      // Use system color scheme: default to light if null
      isDark = systemColorScheme === 'dark';
    } else {
      // Use user's manual selection
      isDark = themeMode === 'dark';
    }

    const colors = isDark ? darkColors : lightColors;

    return {
      mode: themeMode,
      colors,
      isDark,
    };
  }, [themeMode, systemColorScheme]);
};
