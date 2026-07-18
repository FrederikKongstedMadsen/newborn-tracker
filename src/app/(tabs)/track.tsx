import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { IconChip } from '@/components/IconChip';
import { Screen } from '@/components/Screen';
import { colors, fontFamily, fontSize, spacing, trackerColors } from '@/lib/theme';

const TRACKERS = [
  { title: 'Sleep', tracker: 'sleep' as const, href: '/sleep' as const },
  { title: 'Feeding', tracker: 'feeding' as const, href: '/feeding' as const },
  { title: 'Growth', tracker: 'growth' as const, href: '/growth' as const },
  // future: diapers, sick, notes
];

export default function Track() {
  return (
    <Screen topInset>
      <Text style={styles.heading}>Track</Text>
      {TRACKERS.map((t) => (
        <Card key={t.href} onPress={() => router.push(t.href)}>
          <View style={styles.row}>
            <IconChip
              icon={trackerColors[t.tracker].icon}
              accent={trackerColors[t.tracker].accent}
              tint={trackerColors[t.tracker].tint}
            />
            <Text style={styles.title}>{t.title}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { fontSize: fontSize.md, fontFamily: fontFamily.semibold, color: colors.text },
});
