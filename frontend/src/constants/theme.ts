/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Backgrounds
    text: '#0F1E24',
    background: '#F5F7F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E8EEF0',
    // Text
    textSecondary: '#4A7A8A',
    textMuted: '#7BA3B0',
    // Brand
    primary: '#1B4D5C',
    primaryHover: '#2A6B80',
    accent: '#C4623A',
    accentHover: '#D4784F',
    // Semantic
    success: '#4A9B7F',
    premium: '#C49A3C',
    alert: '#B84C4C',
    // Utility
    border: '#D6DFE2',
    surfaceHighlight: '#EFF4F5',
    icon: '#4A7A8A',
    iconMuted: '#7BA3B0',
  },
  dark: {
    // Backgrounds
    text: '#EFF4F5',
    background: '#0F1E24',
    backgroundElement: '#162A33',
    backgroundSelected: '#1B3D48',
    // Text
    textSecondary: '#7BA3B0',
    textMuted: '#4A7A8A',
    // Brand
    primary: '#1B4D5C',
    primaryHover: '#2A6B80',
    accent: '#C4623A',
    accentHover: '#D4784F',
    // Semantic
    success: '#4A9B7F',
    premium: '#C49A3C',
    alert: '#B84C4C',
    // Utility
    border: '#1B3D48',
    surfaceHighlight: '#1B3D48',
    icon: '#7BA3B0',
    iconMuted: '#4A7A8A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
