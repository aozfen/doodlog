import { StyleSheet, View } from 'react-native';

import { Flat, Sticker, Text } from '@/components/ui';
import { monthYear } from '@/lib/date';
import { notebookStatus } from '@/lib/notebook-stats';
import { colors, fonts } from '@/theme';
import type { NotebookStats, Picture } from '@/types';

// Notebook title card. Info only, so flat. The cover sticks out of the top right corner.
export function NotebookHero({ name, cover, stats }: { name: string; cover: Picture; stats: NotebookStats }) {
  const pill = stats.thisWeek ? `Bu hafta ${stats.thisWeek} anı` : notebookStatus(stats);
  const since = stats.firstDate ? ` · ilk anı ${monthYear(stats.firstDate)}` : '';

  return (
    <Flat style={styles.card}>
      <Sticker source={cover} style={styles.art} />
      <View style={styles.pill}>
        <Text style={styles.pillText}>{pill}</Text>
      </View>
      <Text variant="hand" style={styles.title} numberOfLines={1}>
        {name}
      </Text>
      <Text variant="sub">
        {stats.count} anı{since}
      </Text>
    </Flat>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 30, minHeight: 150, justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 18 },
  art: { position: 'absolute', right: -8, top: -34, width: 170, height: 184 },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.pill,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.ink },
  title: { fontSize: 40, lineHeight: 46, marginTop: 6, maxWidth: '62%' },
});
