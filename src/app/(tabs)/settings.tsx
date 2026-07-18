import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { IconChip } from '@/components/IconChip';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { useMyProfile } from '@/features/profiles/hooks';
import { colors, fontFamily, fontSize, spacing, trackerColors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

export default function Settings() {
  const { data: baby } = useBaby();
  const { data: myProfile } = useMyProfile();

  return (
    <Screen topInset>
      <Text style={styles.heading}>Settings</Text>
      <Card onPress={() => router.push('/settings/baby')}>
        <View style={styles.row}>
          <IconChip
            icon={trackerColors.growth.icon}
            accent={trackerColors.growth.accent}
            tint={trackerColors.growth.tint}
          />
          <View style={styles.textGroup}>
            <Text style={styles.title}>Baby profile</Text>
            <Text style={styles.subtitle}>{baby?.name ?? 'Not set up'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
      </Card>
      <Card onPress={() => router.push('/settings/profile')}>
        <View style={styles.row}>
          <Avatar profile={myProfile ?? undefined} size={44} />
          <View style={styles.textGroup}>
            <Text style={styles.title}>My profile</Text>
            <Text style={styles.subtitle}>{myProfile?.display_name ?? 'Not set up yet'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </View>
      </Card>
      <View style={styles.signOut}>
        <PillButton title="Sign out" variant="danger" onPress={() => supabase.auth.signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  textGroup: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.md, fontFamily: fontFamily.semibold, color: colors.text },
  subtitle: { fontSize: fontSize.sm, fontFamily: fontFamily.regular, color: colors.mutedDark },
  signOut: { marginTop: spacing.xl },
});
