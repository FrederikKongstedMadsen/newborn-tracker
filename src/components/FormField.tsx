import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { colors } from '@/lib/theme';

interface Props extends TextInputProps {
  label: string;
}

export function FormField({ label, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 13, color: colors.muted },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 },
});
