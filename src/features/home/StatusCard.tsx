import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { IconChip } from '@/components/IconChip';
import { colors, fontFamily, fontSize, trackerColors } from '@/lib/theme';

interface Props {
  tracker: keyof typeof trackerColors;
  value: string;
  meta: string;
  onPress?: () => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StatusCard({ tracker, value, meta, onPress }: Props) {
  const { accent, tint, icon } = trackerColors[tracker];

  return (
    <Card onPress={onPress}>
      <IconChip icon={icon} accent={accent} tint={tint} />
      <Text style={styles.title}>{capitalize(tracker)}</Text>
      <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.sm, color: colors.muted, fontFamily: fontFamily.regular },
  value: { fontSize: fontSize.lg, fontFamily: fontFamily.bold, color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.mutedDark, fontFamily: fontFamily.regular },
});
