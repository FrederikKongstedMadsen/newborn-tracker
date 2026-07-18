import { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, spacing } from '@/lib/theme';

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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7 },
});
