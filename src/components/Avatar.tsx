import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '@/lib/theme';
import type { Profile } from '@/features/profiles/types';

interface Props {
  profile: Profile | undefined;
  size?: number;
}

export function Avatar({ profile, size = 24 }: Props) {
  const emoji = profile?.emoji?.trim();
  const initial = profile?.display_name.trim().charAt(0).toUpperCase() || '?';
  const glyph = emoji ? emoji : initial;
  const backgroundColor = profile?.color ?? colors.muted;
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor },
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.5 }]}>{glyph}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#ffffff',
    fontFamily: fontFamily.bold,
  },
});
