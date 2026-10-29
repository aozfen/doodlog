import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { SideMemoryCard } from '@/components/memory/side-memory-card';
import { NotebookCover } from '@/components/notebook/notebook-cover';
import { Button, Flat, Icon, Raised, Sticker, Text } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import type { Memory, Notebook, Picture } from '@/types';

// Today's memory: big card, drawing sticks out of the top.
export function TodayCard({
  memory,
  notebookName,
  onPress,
}: {
  memory: Memory;
  notebookName: string;
  onPress?: () => void;
}) {
  return (
    <Raised onPress={onPress} containerStyle={{ marginTop: 36 }} style={styles.today}>
      <Sticker source={memory.drawing} style={styles.todayArt} />
      <Text variant="label">Bugün · {notebookName}</Text>
      <Text variant="note" style={{ marginTop: 4 }}>
        {memory.note}
      </Text>
    </Raised>
  );
}

// Today's drawing is still being made (left onboarding while it drew). Info only, so flat.
export function DrawingTodayCard({ photo, drawing }: { photo?: Picture; drawing: Picture }) {
  return (
    <Flat style={styles.drawing}>
      <View style={styles.drawingArt}>
        {photo ? <Image source={photo} style={styles.drawingPhoto} contentFit="cover" /> : null}
        <Sticker source={drawing} style={[StyleSheet.absoluteFill, { opacity: 0.35 }]} />
      </View>
      <Text variant="label" style={styles.drawingLabel}>
        Bugün · çiziliyor
      </Text>
      <Text variant="sub" style={{ textAlign: 'center' }}>
        Bitince burada olacak, bildirim de göndereceğiz.
      </Text>
    </Flat>
  );
}

// Today is empty: invite to draw.
// Flat on purpose, like an empty calendar day (empty = flat, filled = raised).
// The button is the only raised thing. The whole card is still tappable because
// the dashed + box invites a tap, but it only fades instead of sinking.
export function InviteCard({ onDraw }: { onDraw?: () => void }) {
  return (
    <Pressable
      onPress={onDraw}
      accessibilityRole="button"
      accessibilityLabel="Bugünü çiz, 1 fırça"
      style={({ pressed }) => [{ marginTop: 22, marginBottom: 5 }, pressed && { opacity: 0.7 }]}>
      <Flat style={styles.invite}>
        <View style={styles.placeholder}>
          <Icon name="plus" size={34} opacity={0.45} />
        </View>
        <Text variant="sec">Bugün henüz boş</Text>
        <Text variant="sub" style={{ textAlign: 'center' }}>
          Bir fotoğraf seç, çizimini biz yapalım.
        </Text>
        <Button label="Bugünü çiz · 1 fırça" icon="brush" size="s" onPress={onDraw} style={{ marginTop: 10 }} />
      </Flat>
    </Pressable>
  );
}

// "1 yıl önce bugün": drawing on the left, label in red.
export function OnThisDayCard({ memory, onPress }: { memory: Memory; onPress?: () => void }) {
  return <SideMemoryCard memory={memory} label="1 yıl önce bugün" accent onPress={onPress} style={{ marginTop: 24 }} />;
}

export function NotebookCard({
  notebook,
  status,
  onPress,
}: {
  notebook: Notebook;
  status: string;
  onPress?: () => void;
}) {
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={`${notebook.name}, ${status}`}
      radius={radius.notebook}
      containerStyle={styles.cell}
      style={styles.book}>
      <Text style={styles.bookName} numberOfLines={1}>
        {notebook.name}
      </Text>
      <Text variant="sub" style={styles.bookStatus} numberOfLines={1}>
        {status}
      </Text>
      <NotebookCover cover={notebook.cover} style={styles.cover} />
    </Raised>
  );
}

// Dashed, not raised: it is a placeholder, but still tappable.
export function NewNotebookCard({ onPress }: { onPress?: () => void }) {
  return (
    <View style={styles.cell}>
      <Raised
        onPress={onPress}
        accessibilityLabel="Yeni defter"
        depth={0}
        color="transparent"
        topColor="transparent"
        edgeColor="transparent"
        radius={16}
        style={styles.new}>
        <Icon name="plus" size={30} color={colors.dashedText} />
        <Text variant="note" color={colors.dashedText}>
          Yeni defter
        </Text>
      </Raised>
    </View>
  );
}

const styles = StyleSheet.create({
  today: { minHeight: 250, justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 18 },
  todayArt: { position: 'absolute', top: -30, width: 210, height: 210, alignSelf: 'center' },
  drawing: { marginTop: 22, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 20, gap: 4 },
  drawingArt: { width: 180, height: 180 },
  drawingPhoto: { position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, borderRadius: radius.thumb },
  drawingLabel: { color: colors.red, opacity: 1, marginTop: 10 },
  invite: { minHeight: 210, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 20 },
  placeholder: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: colors.dashedSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cell: { width: '47.5%' },
  book: { height: 184, padding: 12 },
  bookName: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 20, color: colors.ink },
  bookStatus: { fontSize: 11, lineHeight: 14, opacity: 0.6 },
  cover: { flex: 1, marginTop: 6 },
  new: {
    height: 184,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
