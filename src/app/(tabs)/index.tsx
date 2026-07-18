import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { IconChip } from '@/components/IconChip';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { FeedingStatusCard } from '@/features/home/FeedingStatusCard';
import { GrowthStatusCard } from '@/features/home/GrowthStatusCard';
import { NotesStatusCard } from '@/features/home/NotesStatusCard';
import { SleepStatusCard } from '@/features/home/SleepStatusCard';
import { ageInDays } from '@/features/growth/who/curveMath';
import { todayIso } from '@/lib/dates';
import { colors, fontFamily, fontSize, radius, spacing, trackerColors } from '@/lib/theme';

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { data: baby, isLoading } = useBaby();

  if (isLoading) return <Screen topInset>{null}</Screen>;

  return (
    <Screen topInset>
      {baby ? (
        <>
          <View style={styles.header}>
            <IconChip
              icon="happy"
              accent={trackerColors.sleep.accent}
              tint={trackerColors.sleep.tint}
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting(new Date().getHours())}</Text>
              <Text style={styles.name}>{baby.name}</Text>
              <Text style={styles.age}>{ageInDays(baby.birth_date, todayIso())} days old</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.profileButtonPressed,
              ]}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="people-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.grid}>
            <View style={styles.cell}>
              <SleepStatusCard babyId={baby.id} />
            </View>
            <View style={styles.cell}>
              <FeedingStatusCard babyId={baby.id} />
            </View>
            <View style={styles.cell}>
              <GrowthStatusCard babyId={baby.id} />
            </View>
            <View style={styles.cell}>
              <NotesStatusCard babyId={baby.id} />
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  greeting: { fontSize: fontSize.md, color: colors.muted, fontFamily: fontFamily.regular },
  name: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  age: { fontSize: fontSize.md, color: colors.muted, fontFamily: fontFamily.regular },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#221f1b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  profileButtonPressed: { opacity: 0.7 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    flexBasis: '48%',
    flexGrow: 1,
  },
});
