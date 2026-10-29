import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { MONTH_NAMES } from '@/lib/date';
import type { Memory } from '@/types';

import { MonthGrid } from './month-grid';

type Props = {
  year: number;
  month: number; // 0-based
  byDay: Map<string, Memory>;
  today: Date;
  /** Right side of the title row, e.g. "8 / 31 gün". */
  summary: string;
  first?: boolean;
  onDayPress?: (m: Memory) => void;
  /** Rendered under the grid. */
  children?: ReactNode;
};

// "Ekim 2026  ·  8 / 31 gün" title and the month grid.
export function MonthSection({ year, month, byDay, today, summary, first, onDayPress, children }: Props) {
  return (
    <View style={{ marginTop: first ? 26 : 34 }}>
      <View style={styles.head}>
        <Text variant="sec" style={styles.title}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <Text variant="sub">{summary}</Text>
      </View>
      <MonthGrid year={year} month={month} byDay={byDay} today={today} onDayPress={onDayPress} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 24, lineHeight: 28 },
});
