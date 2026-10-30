import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthSection } from '@/components/calendar/month-section';
import { DayCard, Stats, YearMap } from '@/components/calendar/year-map';
import { Segmented, Tag, Text } from '@/components/ui';
import { MONTHS_SHOWN, routes } from '@/constants';
import { daysBetween, getToday, MONTH_NAMES, parseIsoDay, recentMonths, toIsoDay } from '@/lib/date';
import { countDays, groupByDay } from '@/lib/days';
import { useMemories, useNotebooks } from '@/hooks/use-store';
import { notebookIn } from '@/store';
import { space } from '@/theme';
import type { Memory } from '@/types';

type CalendarView = 'month' | 'year';

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'month', label: 'Ay' },
  { value: 'year', label: 'Yıl' },
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const notebooks = useNotebooks();
  const memories = useMemories();
  const params = useLocalSearchParams<{ view?: CalendarView }>();
  const [view, setView] = useState<CalendarView>(params.view === 'year' ? 'year' : 'month');
  const [filter, setFilter] = useState<string | null>(null); // notebook id, null = all
  const [selected, setSelected] = useState(() => toIsoDay(getToday()));

  const year = getToday().getFullYear();
  const all = useMemo(() => (filter ? memories.filter((m) => m.notebookId === filter) : memories), [memories, filter]);
  const list = useMemo(() => all.filter((m) => parseIsoDay(m.date).getFullYear() === year), [all, year]);
  const byDay = useMemo(() => groupByDay(all), [all]);
  const selectedMemory = byDay.get(selected)?.at(-1) ?? list.at(-1);
  const openMemory = (m: Memory) => router.push(routes.memory(m.id, filter ?? undefined));

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.row}>
        <Text variant="hand" style={styles.title}>
          Takvim
        </Text>
        <Segmented value={view} onChange={setView} options={VIEW_OPTIONS} />
      </View>

      {/* One scrollable row: fits any number of notebooks and stays quick to switch. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagScroll}
        contentContainerStyle={styles.tags}>
        <Tag label="Hepsi" selected={!filter} onPress={() => setFilter(null)} />
        {notebooks.map((n) => (
          <Tag key={n.id} label={n.name} selected={filter === n.id} onPress={() => setFilter(n.id)} />
        ))}
      </ScrollView>

      {view === 'month' ? (
        recentMonths(getToday(), MONTHS_SHOWN).map(({ year: y, month }, i) => {
          const inMonth = all.filter((m) => {
            const d = parseIsoDay(m.date);
            return d.getFullYear() === y && d.getMonth() === month;
          });
          const books = new Set(inMonth.map((m) => m.notebookId)).size;
          return (
            <MonthSection
              key={`${y}-${month}`}
              first={i === 0}
              year={y}
              month={month}
              byDay={byDay}
              today={getToday()}
              summary={`${inMonth.length} anı${!filter && books > 1 ? ` · ${books} defter` : ''}`}
              onDayPress={openMemory}
            />
          );
        })
      ) : (
        <>
          <View style={[styles.row, { marginTop: 26, marginBottom: 14 }]}>
            <Text variant="sec" style={styles.yearTitle}>
              {year}
            </Text>
            <Text variant="sub">{countDays(list)} gün dolu</Text>
          </View>
          <YearMap
            year={year}
            byDay={byDay}
            today={getToday()}
            selected={selectedMemory?.date}
            onSelect={(m) => setSelected(m.date)}
          />
          {selectedMemory ? (
            <DayCard
              memory={selectedMemory}
              notebook={notebookIn(notebooks, selectedMemory.notebookId)}
              onPress={() => openMemory(selectedMemory)}
            />
          ) : null}
          <Stats items={yearStats(list)} />
        </>
      )}
    </ScrollView>
  );
}

function yearStats(list: Memory[]) {
  // Longest run of consecutive days. `list` is sorted oldest first; a day can hold several memories.
  const dates = [...new Set(list.map((m) => m.date))].map(parseIsoDay);
  let best = dates.length ? 1 : 0;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = daysBetween(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const perMonth = new Array<number>(12).fill(0);
  dates.forEach((d) => perMonth[d.getMonth()]++);
  const busiest = perMonth.indexOf(Math.max(...perMonth));
  return [
    { value: `${best} gün`, label: 'en uzun seri' },
    { value: MONTH_NAMES[busiest], label: 'en dolu ay' },
    { value: String(perMonth[getToday().getMonth()]), label: 'bu ay' },
  ];
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingBottom: 160 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 40, lineHeight: 44 },
  yearTitle: { fontSize: 24, lineHeight: 28 },
  // Bleeds to the screen edges so tags scroll under the gutter.
  tagScroll: { marginHorizontal: -space.gutter, marginTop: 14, flexGrow: 0 },
  tags: { flexDirection: 'row', gap: 8, paddingHorizontal: space.gutter, paddingBottom: 4 },
});
