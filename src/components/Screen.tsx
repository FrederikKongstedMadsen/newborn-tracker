import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/lib/theme';

interface Props {
  children: ReactNode;
  /** Scrollable content (default true). */
  scroll?: boolean;
  /** Apply the top inset — use on screens WITHOUT a native header (tabs). */
  topInset?: boolean;
}

export function Screen({ children, scroll = true, topInset = false }: Props) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: topInset ? insets.top + spacing.md : spacing.md,
    paddingLeft: spacing.md + insets.left,
    paddingRight: spacing.md + insets.right,
    paddingBottom: spacing.md,
  };

  if (!scroll) {
    return <View style={[styles.container, styles.content, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, padding]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md },
});
