import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import type { Profile } from '@/features/profiles/types';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';

interface Props {
  note?: string | null;
  timeLabel: string;
  profile: Profile | undefined;
}

export function RowAttribution({ note, timeLabel, profile }: Props) {
  const hasNote = !!note && note.trim() !== '';

  return (
    <View style={styles.container}>
      <Text style={styles.rowWhen}>{timeLabel}</Text>
      <View style={styles.rowProfile}>
        {hasNote ? (
          <>
            <Ionicons name="document-text-outline" size={12} color={colors.muted} />
            <Text style={styles.rowNote} numberOfLines={1} ellipsizeMode="tail">
              {note}
            </Text>
          </>
        ) : null}
        <Avatar profile={profile} size={20} />
        <Text style={styles.rowName}>{profile?.display_name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end', gap: spacing.xs },
  rowWhen: { color: colors.muted, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
  rowProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  rowNote: {
    color: colors.mutedDark,
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    flexShrink: 1,
    maxWidth: 140,
  },
  rowName: { color: colors.text, fontSize: fontSize.sm, fontFamily: fontFamily.regular },
});
