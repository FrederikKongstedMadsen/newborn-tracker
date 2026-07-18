import { Fragment } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

import { makeScale } from '@/features/growth/chartScale';
import { todayIso } from '@/lib/dates';
import { colors } from '@/lib/theme';

import { dailyTotals } from './feedMath';
import type { Feed } from './types';

const HEIGHT = 140;
const BAR_GAP = 8;
const LABEL_SPACE = { top: 16, bottom: 16 };
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Props {
  feeds: Feed[];
  width: number;
}

export function FeedingChart({ feeds, width }: Props) {
  const totals = dailyTotals(feeds, 7, todayIso());
  const allZero = totals.every((t) => t.totalSeconds === 0);
  if (allZero) return null;

  const chartHeight = HEIGHT - LABEL_SPACE.top - LABEL_SPACE.bottom;
  const maxSeconds = Math.max(...totals.map((t) => t.totalSeconds), 1);
  const scale = makeScale([0, maxSeconds], [0, chartHeight]);
  const barWidth = (width - BAR_GAP * (totals.length - 1)) / totals.length;

  return (
    <View>
      <Svg width={width} height={HEIGHT}>
        {totals.map((day, i) => {
          const barHeight = scale(day.totalSeconds);
          const x = i * (barWidth + BAR_GAP);
          const y = LABEL_SPACE.top + (chartHeight - barHeight);
          const weekday = WEEKDAY_LETTERS[new Date(`${day.dateIso}T00:00:00`).getDay()];
          return (
            <Fragment key={day.dateIso}>
              {day.count > 0 ? (
                <SvgText
                  x={x + barWidth / 2}
                  y={LABEL_SPACE.top - 4}
                  fontSize={10}
                  fill={colors.muted}
                  textAnchor="middle"
                >
                  {day.count}
                </SvgText>
              ) : null}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={4}
                ry={4}
                fill={colors.primary}
              />
              <SvgText
                x={x + barWidth / 2}
                y={HEIGHT - 4}
                fontSize={10}
                fill={colors.muted}
                textAnchor="middle"
              >
                {weekday}
              </SvgText>
            </Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
