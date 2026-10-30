import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAddMemory } from '@/components/add/add-memory';
import { MonthSection } from '@/components/calendar/month-section';
import { SideMemoryCard } from '@/components/memory/side-memory-card';
import { CoverSheet } from '@/components/notebook/cover-sheet';
import { DeleteNotebookSheet } from '@/components/notebook/delete-notebook-sheet';
import { EmptyNotebook } from '@/components/notebook/empty-notebook';
import { InviteChip, WaitlistBadge } from '@/components/notebook/invite-chip';
import { InviteSheet } from '@/components/notebook/invite-sheet';
import { NotebookHero } from '@/components/notebook/notebook-hero';
import { IconButton, ListGroup, ListItem, Sheet, Text, useToast } from '@/components/ui';
import { EVENTS, INVITE_SOURCES, MONTHS_SHOWN, NOTEBOOK_KINDS, SCREEN_POP_MS, routes } from '@/constants';
import { useSheet } from '@/hooks/use-sheet';
import { useMemories, useNotebooks, useUser } from '@/hooks/use-store';
import { comingSoon } from '@/lib/alerts';
import { track } from '@/lib/analytics';
import { dayMonth, daysInMonth, getToday, isSameDay, parseIsoDay, recentMonths } from '@/lib/date';
import { countDays, groupByDay } from '@/lib/days';
import { notebookStats } from '@/lib/notebook-stats';
import { withDative } from '@/lib/text';
import { deleteNotebook, notebookIn } from '@/store';
import { colors, space } from '@/theme';
import type { Memory, Picture } from '@/types';

type SheetName = 'menu' | 'cover' | 'delete' | 'invite';

// Notebook page. Design: design/a-v2.html (Defter), a-davet-yakinda.html (invite),
// a-defter-ayar.html (⋯ menu, cover, delete), a-defter.html (empty notebook).
export default function NotebookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const user = useUser();
  const { open: addMemory } = useAddMemory();
  const notebooks = useNotebooks();
  const memories = useMemories();
  const notebook = notebookIn(notebooks, id);
  const [name, setName] = useState(notebook?.name ?? '');
  /** Cover picked on this page (not saved yet). */
  const [picked, setCover] = useState<Picture>();
  const [waitlisted, setWaitlisted] = useState(false);
  const sheet = useSheet<SheetName>();
  const toast = useToast();

  const list = useMemo(() => memories.filter((m) => m.notebookId === id), [memories, id]);
  const byDay = useMemo(() => groupByDay(list), [list]);
  const stats = useMemo(() => notebookStats(list, getToday()), [list]);
  const invite = notebook ? NOTEBOOK_KINDS[notebook.kind].invite : null;
  const last = list.at(-1);
  // A picked cover whose memory was deleted no longer counts; the store keeps its own cover up to date.
  const cover = (picked && list.some((m) => m.drawing === picked) ? picked : undefined) ?? notebook?.cover;
  // Picked cover, else the newest drawing. undefined while the notebook is empty.
  const shownCover = cover ?? last?.drawing;
  const moveTargets = useMemo(() => notebooks.filter((n) => n.id !== id), [notebooks, id]);

  useEffect(() => {
    if (invite) track(EVENTS.inviteSeen, { kind: notebook?.kind ?? '', source: INVITE_SOURCES.notebookPage });
  }, [invite, notebook?.kind]);

  if (!notebook) {
    return (
      <View style={[styles.root, styles.missing, { paddingTop: insets.top + 12 }]}>
        <Text variant="sec">Defter bulunamadı</Text>
      </View>
    );
  }

  const openMemory = (m: Memory) => router.push(routes.memory(m.id, notebook.id));
  const rename = () =>
    Alert.prompt(
      'Defterin adı',
      undefined,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Kaydet', onPress: (value?: string) => value?.trim() && setName(value.trim()) },
      ],
      'plain-text',
      name,
    );

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <IconButton icon="back" label="Geri" onPress={() => router.back()} />
          <View style={styles.actions}>
            {invite && waitlisted ? <WaitlistBadge /> : null}
            {invite && !waitlisted ? (
              <InviteChip
                label={invite.button}
                ownerName={user.name}
                onPress={() => {
                  track(EVENTS.inviteTapped, { kind: notebook.kind, source: INVITE_SOURCES.notebookPage });
                  sheet.open('invite');
                }}
              />
            ) : null}
            <IconButton icon="more" label="Defter ayarları" onPress={() => sheet.open('menu')} />
          </View>
        </View>

        {!last ? (
          <EmptyNotebook notebook={{ ...notebook, name }} today={getToday()} onAdd={() => addMemory(notebook.id)} />
        ) : (
          <NotebookHero name={name} cover={shownCover ?? last.drawing} stats={stats} />
        )}

        {last &&
          recentMonths(getToday(), MONTHS_SHOWN).map(({ year, month }, i) => {
            const filled = countDays(
              list.filter((m) => {
                const d = parseIsoDay(m.date);
                return d.getFullYear() === year && d.getMonth() === month;
              }),
            );
            return (
              <MonthSection
                key={`${year}-${month}`}
                first={i === 0}
                year={year}
                month={month}
                byDay={byDay}
                today={getToday()}
                summary={`${filled} / ${daysInMonth(year, month)} gün`}
                onDayPress={openMemory}>
                {/* Newest memory right under the current month. */}
                {i === 0 ? (
                  <SideMemoryCard
                    memory={last}
                    size="m"
                    label={isSameDay(parseIsoDay(last.date), getToday()) ? 'Bugün' : dayMonth(parseIsoDay(last.date))}
                    onPress={() => openMemory(last)}
                    style={{ marginTop: 44 }}
                  />
                ) : null}
              </MonthSection>
            );
          })}
      </ScrollView>

      <Sheet visible={sheet.is('menu')} onClose={sheet.close}>
        <ListGroup>
          <ListItem icon="chat" label="Adını değiştir" detail={name} onPress={() => sheet.then(rename)} />
          {last ? <ListItem icon="img" label="Kapağı değiştir" onPress={() => sheet.then('cover')} /> : null}
          <ListItem
            icon="share"
            label="Defteri paylaş"
            detail="Yıl özeti ya da kolaj"
            onPress={() => sheet.then(() => comingSoon('Defteri paylaş'))}
          />
        </ListGroup>
        <ListGroup style={{ marginTop: 12 }}>
          <ListItem icon="x" label="Defteri sil" danger onPress={() => sheet.then('delete')} />
        </ListGroup>
      </Sheet>

      <CoverSheet
        visible={sheet.is('cover')}
        memories={list}
        selected={cover}
        onSelect={(c) => {
          setCover(c);
          sheet.close();
        }}
        onClose={sheet.close}
      />

      <DeleteNotebookSheet
        visible={sheet.is('delete')}
        name={name}
        count={stats.count}
        targets={moveTargets}
        onClose={sheet.close}
        onDelete={(moveTo) => {
          const target = moveTargets.find((n) => n.id === moveTo);
          const message = !stats.count
            ? `${name} silindi.`
            : target
              ? `${name} silindi. ${stats.count} anı ${withDative(target.name)} taşındı.`
              : `${name} ve ${stats.count} anı silindi.`;
          sheet.then(() => {
            router.back();
            // Delete once the page has slid away, so it never renders a missing notebook.
            setTimeout(() => {
              const undo = deleteNotebook(notebook.id, target?.id);
              if (undo) toast.undo(message, undo);
            }, SCREEN_POP_MS);
          });
        }}
      />

      {invite ? (
        <InviteSheet
          visible={sheet.is('invite')}
          body={invite.body}
          cover={shownCover}
          onClose={sheet.close}
          onNotify={() => {
            track(EVENTS.inviteNotify, { kind: notebook.kind, source: INVITE_SOURCES.notebookPage });
            sheet.close();
            setWaitlisted(true);
            toast.show('Tamam. Ortak defter gelince ilk sen öğreneceksin.');
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  missing: { alignItems: 'center' },
  content: { paddingHorizontal: space.gutter, paddingBottom: 160 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
