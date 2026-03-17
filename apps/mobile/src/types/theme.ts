export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Colors {
  primary: string;
  primaryLight: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  borderLight: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  overlay: string;
  placeholder: string;
  input: string;
  inputBorder: string;
  divider: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: Colors;
  isDark: boolean;
}
