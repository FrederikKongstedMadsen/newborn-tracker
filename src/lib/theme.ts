import { Ionicons } from '@expo/vector-icons';

export const colors = {
  background: '#f0eee6',
  card: '#ffffff',
  text: '#221f1b',
  muted: '#9b958c',
  mutedDark: '#6b665e',
  border: '#e9e4db',
  primary: '#5a60c6',
  primaryDark: '#4a4fb0',
  danger: '#cf6257',
};

export type TrackerKind = 'sleep' | 'feeding' | 'diaper' | 'growth' | 'temperature' | 'notes';

export const trackerColors: Record<
  TrackerKind,
  { accent: string; tint: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  sleep: { accent: '#5a60c6', tint: '#ece9fb', icon: 'moon' },
  feeding: { accent: '#c07a45', tint: '#fbeadf', icon: 'restaurant' },
  diaper: { accent: '#3a8a6f', tint: '#e2f0ea', icon: 'water' },
  growth: { accent: '#3f76c2', tint: '#dbe6f6', icon: 'trending-up' },
  temperature: { accent: '#cf6257', tint: '#fbe6e3', icon: 'thermometer' },
  notes: { accent: '#8a857c', tint: '#f4f1ec', icon: 'document-text' },
};

export const radius = {
  card: 20,
  chip: 12,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
  timer: 44,
};

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};
