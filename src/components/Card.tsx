import { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/lib/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
}

export function Card({ children, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: '#221f1b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
});
