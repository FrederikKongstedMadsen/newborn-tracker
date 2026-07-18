import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { radius } from '@/lib/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  tint: string;
  size?: number;
}

export function IconChip({ icon, accent, tint, size = 44 }: Props) {
  return (
    <View
      style={[
        styles.chip,
        {
          width: size,
          height: size,
          borderRadius: radius.chip,
          backgroundColor: tint,
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.5} color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
