import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/lib/theme';

interface Props extends TextInputProps {
  label: string;
}

export function FormField({ label, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: fontSize.sm, color: colors.muted, fontFamily: fontFamily.regular },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    padding: spacing.sm + spacing.xs,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
});
