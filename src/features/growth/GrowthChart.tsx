import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import { makeScale } from './chartScale';
import type { GrowthMeasurement } from './types';
import { ageInDays } from './who/curveMath';
import { getCurve } from './who/curves';
import type { Indicator, Percentile } from './who/types';
import { PERCENTILES } from './who/types';

// Percentile bands read as a diverging/status encoding centered on the median:
// p50 is "typical" (good/green), p15+p85 are the borderline band (warning/amber),
// p3+p97 are the outer band (critical/red). Colors from the validated status
// palette (dataviz skill) so they hold contrast and CVD separation.
const PERCENTILE_COLORS: Record<Percentile, string> = {
  p3: '#d03b3b',
  p15: '#fab219',
  p50: '#0ca30c',
  p85: '#fab219',
  p97: '#d03b3b',
};

// Chart chrome tokens (light surface — the app has no dark-mode theming yet).
const SURFACE = '#fcfcfb';
const INK_PRIMARY = '#0b0b0b';
const INK_MUTED = '#898781';
const GRIDLINE = '#e1e0d9';
const MEASUREMENT_COLOR = '#2a78d6'; // categorical slot 1 (blue)

const MARGIN = { top: 12, right: 36, bottom: 28, left: 40 };

interface Props {
  indicator: Indicator;
  sex: 'male' | 'female';
  birthDate: string;
  measurements: GrowthMeasurement[];
  width: number;
  height: number;
}

function valueFor(indicator: Indicator, m: GrowthMeasurement): number | null {
  if (indicator === 'weight-for-age') return m.weight_g === null ? null : m.weight_g / 1000;
  if (indicator === 'length-for-age') return m.height_cm;
  return m.head_circumference_cm;
}

export function GrowthChart({ indicator, sex, birthDate, measurements, width, height }: Props) {
  const curve = getCurve(indicator, sex);
  const dataPoints = measurements
    .map((m) => ({ ageDays: ageInDays(birthDate, m.measured_at), value: valueFor(indicator, m) }))
    .filter((p): p is { ageDays: number; value: number } => p.value !== null && p.ageDays >= 0);

  const maxAge = Math.max(90, ...dataPoints.map((p) => p.ageDays)) * 1.1;
  const visible = curve.points.filter((p) => p.ageDays <= maxAge);
  const yValues = [
    ...visible.flatMap((p) => PERCENTILES.map((pc) => p[pc])),
    ...dataPoints.map((p) => p.value),
  ];
  const yMin = Math.min(...yValues) * 0.95;
  const yMax = Math.max(...yValues) * 1.05;

  const x = makeScale([0, maxAge], [MARGIN.left, width - MARGIN.right]);
  const y = makeScale([yMin, yMax], [height - MARGIN.bottom, MARGIN.top]);

  const monthTicks: number[] = [];
  for (let days = 0; days <= maxAge; days += 30.4375 * (maxAge > 200 ? 2 : 1)) {
    monthTicks.push(days);
  }

  return (
    <View>
      <Svg width={width} height={height}>
        <Rect x={0} y={0} width={width} height={height} fill={SURFACE} />
        {monthTicks.map((days) => (
          <Line
            key={days}
            x1={x(days)}
            y1={MARGIN.top}
            x2={x(days)}
            y2={height - MARGIN.bottom}
            stroke={GRIDLINE}
            strokeWidth={1}
          />
        ))}
        {monthTicks.map((days) => (
          <SvgText
            key={`label-${days}`}
            x={x(days)}
            y={height - 10}
            fontSize={10}
            fill={INK_MUTED}
            textAnchor="middle"
          >
            {Math.round(days / 30.4375)}
          </SvgText>
        ))}
        {PERCENTILES.map((pc) => (
          <Polyline
            key={pc}
            points={visible.map((p) => `${x(p.ageDays)},${y(p[pc])}`).join(' ')}
            stroke={PERCENTILE_COLORS[pc]}
            strokeWidth={pc === 'p50' ? 2.5 : 1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
          />
        ))}
        {PERCENTILES.map((pc) => (
          <SvgText
            key={`pc-${pc}`}
            x={width - MARGIN.right + 4}
            y={y(visible[visible.length - 1][pc]) + 3}
            fontSize={9}
            fill={INK_MUTED}
          >
            {pc.slice(1)}
          </SvgText>
        ))}
        {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
          <SvgText key={v} x={4} y={y(v) + 3} fontSize={10} fill={INK_MUTED}>
            {v.toFixed(1)}
          </SvgText>
        ))}
        {dataPoints.map((p, i) => (
          <Circle
            key={i}
            cx={x(p.ageDays)}
            cy={y(p.value)}
            r={4}
            fill={MEASUREMENT_COLOR}
            stroke={SURFACE}
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.legend}>
        <LegendItem color={PERCENTILE_COLORS.p50} label="Median (p50)" />
        <LegendItem color={PERCENTILE_COLORS.p15} label="Typical range (p15–p85)" />
        <LegendItem color={PERCENTILE_COLORS.p3} label="Outer range (p3–p97)" />
        <LegendItem color={MEASUREMENT_COLOR} label="Measurement" shape="circle" />
      </View>
    </View>
  );
}

function LegendItem({
  color,
  label,
  shape = 'line',
}: {
  color: string;
  label: string;
  shape?: 'line' | 'circle';
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          shape === 'circle' ? styles.legendSwatchCircle : styles.legendSwatchLine,
          { backgroundColor: color },
        ]}
      />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 12, height: 3 },
  legendSwatchLine: { borderRadius: 1.5 },
  legendSwatchCircle: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: INK_PRIMARY },
});
