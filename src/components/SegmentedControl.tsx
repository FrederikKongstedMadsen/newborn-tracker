import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, fontSize, radius, spacing } from '@/lib/theme';

interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function SegmentedControl({ options, selected, onSelect }: Props) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: colors.card,
    shadowColor: '#221f1b',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  label: {
    fontSize: fontSize.md,
    fontFamily: fontFamily.semibold,
    color: colors.muted,
  },
  labelSelected: {
    color: colors.text,
  },
});
