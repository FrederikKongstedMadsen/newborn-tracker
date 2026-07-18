import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { FeedingStatusCard } from '@/features/home/FeedingStatusCard';
import { GrowthStatusCard } from '@/features/home/GrowthStatusCard';
import { SleepStatusCard } from '@/features/home/SleepStatusCard';
import { ageInDays } from '@/features/growth/who/curveMath';
import { todayIso } from '@/lib/dates';
import { colors, fontSize } from '@/lib/theme';

export default function Home() {
  const { data: baby, isLoading } = useBaby();

  if (isLoading) return <Screen topInset>{null}</Screen>;

  return (
    <Screen topInset>
      {baby ? (
        <>
          <Text style={styles.name}>{baby.name}</Text>
          <Text style={styles.age}>{ageInDays(baby.birth_date, todayIso())} days old</Text>
          <GrowthStatusCard babyId={baby.id} />
          <FeedingStatusCard babyId={baby.id} />
          <SleepStatusCard babyId={baby.id} />
        </>
      ) : (
        <Card onPress={() => router.push('/profile')}>
          <Text style={styles.name}>Welcome</Text>
          <Text style={styles.age}>Create the baby profile to get started</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  age: { fontSize: fontSize.md, color: colors.muted },
});
