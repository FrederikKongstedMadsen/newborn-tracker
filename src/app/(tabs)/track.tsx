import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, fontSize, spacing } from '@/lib/theme';

const TRACKERS = [
  { title: 'Growth', icon: 'trending-up' as const, href: '/growth' as const },
  { title: 'Feeding', icon: 'water' as const, href: '/feeding' as const },
  { title: 'Sleep', icon: 'moon' as const, href: '/sleep' as const },
  // future: diapers, sick, notes
];

export default function Track() {
  return (
    <Screen topInset>
      <Text style={styles.heading}>Track</Text>
      {TRACKERS.map((t) => (
        <Card key={t.href} onPress={() => router.push(t.href)}>
          <View style={styles.row}>
            <Ionicons name={t.icon} size={22} color={colors.primary} />
            <Text style={styles.title}>{t.title}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
});
