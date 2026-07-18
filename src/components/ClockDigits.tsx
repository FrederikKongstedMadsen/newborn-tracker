import { StyleSheet, Text } from 'react-native';

import { formatClock } from '@/lib/clock';
import { colors, fontFamily, fontSize } from '@/lib/theme';

interface Props {
  seconds: number;
  size?: number;
}

export function ClockDigits({ seconds, size = fontSize.timer }: Props) {
  return <Text style={[styles.digits, { fontSize: size }]}>{formatClock(seconds)}</Text>;
}

const styles = StyleSheet.create({
  digits: {
    color: colors.text,
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
});
