import { Ionicons } from '@expo/vector-icons';

import type { DiaperType } from './types';

export const diaperMeta: Record<
  DiaperType,
  { label: string; color: string; bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  pee: { label: 'Pee', color: '#c99326', bg: '#faf1dc', icon: 'water' },
  poop: { label: 'Poop', color: '#9c6b3f', bg: '#f2e7db', icon: 'ellipse' },
  both: { label: 'Pee + poop', color: '#6f8a3c', bg: '#edf1de', icon: 'ellipse' },
  nothing: { label: 'Dry', color: '#8a857c', bg: '#efece6', icon: 'checkmark-circle' },
};
