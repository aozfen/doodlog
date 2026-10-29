import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddMemory } from '@/components/add/add-memory';
import {
  DrawingTodayCard,
  InviteCard,
  NewNotebookCard,
  NotebookCard,
  OnThisDayCard,
  TodayCard,
} from '@/components/home/cards';
import { NewNotebookSheet } from '@/components/notebook/new-notebook-sheet';
import { OfferBadge } from '@/components/paywall/offer-badge';
import { Avatar, Chip, Text } from '@/components/ui';
import { PAYWALL_DELAY_MS, SHEET_SWAP_MS, routes } from '@/constants';
import { useDrawJob, useMemories, useNotebooks, usePaywallDue, useUser } from '@/hooks/use-store';
import { longDay } from '@/lib/date';
import { notebookStatus } from '@/lib/notebook-stats';
import {
  getNotebook,
  getOnThisDayMemory,
  getTodayMemory,
  mockToday,
  setPaywallDue,
  statsOf,
  totalBrushes,
} from '@/mock';
import { space } from '@/theme';

// Home. No info or notice cards here: only today, "1 yıl önce" and notebooks.
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { open: addMemory } = useAddMemory();
  const notebooks = useNotebooks();
  const memories = useMemories();
  const user = useUser();
  const job = useDrawJob();
  const paywallDue = usePaywallDue();
  const drawn = job?.status === 'done';

  // Left onboarding before the first drawing: once it lands, show it, then the paywall they skipped.
  useEffect(() => {
    if (!paywallDue || !drawn) return;
    const id = setTimeout(() => {
      setPaywallDue(false);
      router.push(routes.firstDrawing);
    }, PAYWALL_DELAY_MS);
    return () => clearTimeout(id);
  }, [paywallDue, drawn]);
  const [creating, setCreating] = useState(false);
  // Mock only: long-press the date to switch between filled and empty today.
  const [showToday, setShowToday] = useState(true);
  const today = showToday ? getTodayMemory() : undefined;
  const todayNotebook = today && getNotebook(today.notebookId);
  const onThisDay = getOnThisDayMemory();

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 18 }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.row}>
        <Text variant="hand" style={{ flexShrink: 1 }} numberOfLines={1}>
          {user.name ? `Merhaba ${user.name}` : 'Merhaba'}
        </Text>
        {/* The chip opens the brushes screen, the profile circle opens settings. */}
        <View style={styles.actions}>
          <Chip icon="brush" label={String(totalBrushes(user))} onPress={() => router.push(routes.brushes)} />
          <Avatar name={user.name} size={32} label="Ayarlar" onPress={() => router.push(routes.settings)} />
        </View>
      </View>
      <Text variant="sub" style={{ marginTop: 4 }} onLongPress={() => setShowToday((v) => !v)}>
        {longDay(mockToday)}
      </Text>

      {/* Only while the exit offer runs. After the greeting, where the eye goes next. */}
      <OfferBadge />

      {today && todayNotebook ? (
        <TodayCard
          memory={today}
          notebookName={todayNotebook.name}
          onPress={() => router.push(routes.memory(today.id))}
        />
      ) : job?.status === 'drawing' ? (
        <DrawingTodayCard photo={job.photo} drawing={job.drawing} />
      ) : (
        <InviteCard onDraw={() => addMemory()} />
      )}

      {onThisDay ? <OnThisDayCard memory={onThisDay} onPress={() => router.push(routes.memory(onThisDay.id))} /> : null}

      <View style={[styles.row, { marginTop: 28 }]}>
        <Text variant="sec">Defterlerim</Text>
        <Text variant="sub">
          {notebooks.length} defter · {memories.length} anı
        </Text>
      </View>
      <View style={styles.books}>
        {notebooks.map((n) => (
          <NotebookCard
            key={n.id}
            notebook={n}
            status={notebookStatus(statsOf(n.id))}
            onPress={() => router.push(routes.notebook(n.id))}
          />
        ))}
        <NewNotebookCard onPress={() => setCreating(true)} />
      </View>

      <NewNotebookSheet
        visible={creating}
        onClose={() => setCreating(false)}
        onCreate={(n) => {
          setCreating(false);
          setTimeout(() => router.push(routes.notebook(n.id)), SHEET_SWAP_MS);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter, paddingBottom: 160 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  books: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20, marginTop: 12 },
});
