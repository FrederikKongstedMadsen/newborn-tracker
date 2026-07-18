import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/lib/theme';

type Variant = 'primary' | 'danger' | 'neutral';

interface Props {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  disabled?: boolean;
}

const backgrounds: Record<Variant, string> = {
  primary: colors.primary,
  danger: colors.danger,
  neutral: colors.card,
};

const pressedBackgrounds: Record<Variant, string> = {
  primary: colors.primaryDark,
  danger: colors.danger,
  neutral: colors.border,
};

const textColors: Record<Variant, string> = {
  primary: '#ffffff',
  danger: '#ffffff',
  neutral: colors.text,
};

export function PillButton({ title, onPress, icon, variant = 'primary', disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: pressed ? pressedBackgrounds[variant] : backgrounds[variant] },
        disabled && styles.disabled,
      ]}
    >
      {icon ? <Ionicons name={icon} size={20} color={textColors[variant]} /> : null}
      <Text style={[styles.label, { color: textColors[variant] }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
  },
});
