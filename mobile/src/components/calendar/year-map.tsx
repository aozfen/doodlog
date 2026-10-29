import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Chevron, Flat, Sticker, Text } from '@/components/ui';
import { MONTH_NAMES, MONTH_SHORT, dayMonth, dayName, daysInMonth, isoDay, parseIsoDay, toIsoDay } from '@/lib/date';
import { colors, fonts, space } from '@/theme';
import type { DayMap, Memory, Notebook } from '@/types';

const LABEL_W = 34;
const DOT_GAP = 3;

type Props = {
  year: number;
  byDay: DayMap;
  today: Date;
  selected?: string; // iso day
  onSelect?: (m: Memory) => void;
};

// One row per month, one dot per day. Filled = red, today = ink, future = faint.
export function YearMap({ year, byDay, today, selected, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const avail = width - space.gutter * 2 - LABEL_W;
  const dot = Math.min(7, Math.floor((avail - DOT_GAP * 30) / 31));
  const todayIso = toIsoDay(today);

  return (
    <View style={{ gap: 8 }}>
      {MONTH_SHORT.map((label, m) => (
        <View key={label} style={styles.row}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.dots}>
            {Array.from({ length: daysInMonth(year, m) }, (_, i) => {
              const d = i + 1;
              const iso = isoDay(year, m, d);
              const mem = byDay.get(iso)?.at(-1);
              const future = new Date(year, m, d) > today;
              const bg = iso === todayIso ? colors.ink : mem ? colors.red : colors.dot;
              const sq = (
                <View
                  style={{ width: dot, height: dot, borderRadius: 2, backgroundColor: bg, opacity: future ? 0.45 : 1 }}
                />
              );
              if (!mem) return <View key={d}>{sq}</View>;
              return (
                <Pressable
                  key={d}
                  hitSlop={3}
                  onPress={() => onSelect?.(mem)}
                  accessibilityLabel={`${d} ${MONTH_NAMES[m]}`}
                  style={selected === iso ? styles.sel : null}>
                  {sq}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

// Selected day under the year map. Flat with a fade on press: a link, not a button.
export function DayCard({ memory, notebook, onPress }: { memory: Memory; notebook?: Notebook; onPress?: () => void }) {
  const date = parseIsoDay(memory.date);
  const label = [dayMonth(date), dayName(date), notebook?.name].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Flat style={styles.card}>
        <Sticker source={memory.drawing} style={styles.art} />
        <View style={{ flex: 1 }}>
          <Text variant="label">{label}</Text>
          <Text variant="note" style={{ marginTop: 2 }} numberOfLines={2}>
            {memory.note}
          </Text>
        </View>
        <Chevron />
      </Flat>
    </Pressable>
  );
}

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <View style={styles.stats}>
      {items.map((s) => (
        <View key={s.label} style={{ flex: 1 }}>
          <Text style={styles.statValue}>{s.value}</Text>
          <Text variant="sub">{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { width: LABEL_W, fontFamily: fonts.heavy, fontSize: 11, color: colors.inkMuted },
  dots: { flexDirection: 'row', gap: DOT_GAP },
  sel: { borderRadius: 3, outlineWidth: 2, outlineColor: colors.ink, outlineOffset: 1 },
  card: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  art: { width: 64, height: 64 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statValue: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 28, color: colors.ink },
});
