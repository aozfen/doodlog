import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MemoryStack } from '@/components/memory/memory-stack';
import { NoteBubble } from '@/components/memory/note-bubble';
import { NoteSheet } from '@/components/memory/note-sheet';
import {
  Button,
  Flat,
  IconButton,
  ListGroup,
  ListItem,
  Sheet,
  Sticker,
  Text,
  TextButton,
  useToast,
} from '@/components/ui';
import { SCREEN_POP_MS, routes } from '@/constants';
import { useSheet } from '@/hooks/use-sheet';
import { useMemories } from '@/hooks/use-store';
import { comingSoon } from '@/lib/alerts';
import { dayMonth, dayName, getToday, parseIsoDay } from '@/lib/date';
import { deleteMemory, getNotebook, setMemoryNote } from '@/mock';
import { colors, space } from '@/theme';

// Memory detail. Design: design/a-takvim.html (3) and design/a-ani-menu.html.
// A day can hold several memories: they lie as a pile of cards to swipe through.
export default function MemoryScreen() {
  const { id, notebook: scope } = useLocalSearchParams<{ id: string; notebook?: string }>();
  const insets = useSafeAreaInsets();
  const sheet = useSheet<'menu' | 'delete' | 'note'>();
  const [photoOpen, setPhotoOpen] = useState(false);
  const memories = useMemories();
  const toast = useToast();

  const opened = memories.find((m) => m.id === id);
  const sameDay = useMemo(
    () => (opened ? memories.filter((m) => m.date === opened.date && (!scope || m.notebookId === scope)) : []),
    [memories, opened, scope],
  );
  const [page, setPage] = useState(() =>
    Math.max(
      0,
      sameDay.findIndex((m) => m.id === id),
    ),
  );
  const memory = sameDay[page] ?? opened;
  if (!memory) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
        <IconButton icon="back" label="Geri" onPress={() => router.back()} />
        <Text variant="sec" style={{ marginTop: 24 }}>
          Anı bulunamadı
        </Text>
      </View>
    );
  }

  const date = parseIsoDay(memory.date);
  const year = date.getFullYear();
  const title = dayMonth(date);
  const notebook = getNotebook(memory.notebookId);
  const footBottom = Math.max(insets.bottom, 20) + 10;
  const menuAction = (what: string) => sheet.then(() => comingSoon(what));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: footBottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <IconButton icon="back" label="Geri" onPress={() => router.back()} />
          <IconButton icon="more" label="Diğer" onPress={() => sheet.open('menu')} />
        </View>

        <Text variant="hand" style={{ marginTop: 18 }}>
          {title}
        </Text>
        <Text variant="sub">
          {[year !== getToday().getFullYear() ? String(year) : null, dayName(date), notebook?.name]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View>
          {sameDay.length > 1 ? (
            <MemoryStack memories={sameDay} index={page} onChange={setPage} />
          ) : (
            <Flat style={styles.art}>
              <Sticker source={memory.drawing} style={{ width: 290, height: 290 }} />
            </Flat>
          )}
          {/* Keyed by memory: on a swipe the old bubble fades out while the new one pops in, piece by piece. */}
          <Animated.View
            key={memory.id}
            exiting={FadeOut.duration(140)}
            style={[styles.bubble, { right: (sameDay.length > 1 ? space.gutter / 2 : 0) - BUBBLE_OUT }]}>
            <NoteBubble note={memory.note} onPress={() => sheet.open('note')} />
          </Animated.View>
        </View>
        {sameDay.length > 1 ? (
          <>
            <View style={styles.dots} accessibilityLabel={`${sameDay.length} anıdan ${page + 1}.`}>
              {sameDay.map((m, i) => (
                <View key={m.id} style={[styles.dot, i === page && styles.dotOn]} />
              ))}
            </View>
          </>
        ) : null}

        {memory.photo ? (
          <Pressable
            style={styles.photoRow}
            onPress={() => setPhotoOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Orijinal fotoğrafı büyüt">
            <Image source={memory.photo} style={styles.thumb} contentFit="cover" />
            <Text variant="sub">Orijinal fotoğraf · dokun, büyüt</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <LinearGradient
        pointerEvents="none"
        colors={[colors.bgClear, colors.bg, colors.bg]}
        locations={[0, 0.55, 1]}
        style={[styles.fade, { height: footBottom + 110 }]}
      />
      <View style={[styles.foot, { bottom: footBottom }]}>
        <Button
          variant="secondary"
          icon="redo"
          accessibilityLabel="Tekrar çiz, 1 fırça"
          onPress={() => comingSoon('Tekrar çiz')}
        />
        <Button label="Paylaş" icon="share" style={{ flex: 1 }} onPress={() => router.push(routes.share(memory.id))} />
      </View>

      <Sheet visible={sheet.is('menu')} onClose={sheet.close}>
        <ListGroup>
          <ListItem icon="chat" label={memory.note ? 'Notu düzenle' : 'Not ekle'} onPress={() => sheet.then('note')} />
          <ListItem icon="cal" label="Tarihi değiştir" detail={title} onPress={() => menuAction('Tarihi değiştir')} />
          <ListItem
            icon="nb"
            label="Başka deftere taşı"
            detail={notebook?.name}
            onPress={() => menuAction('Başka deftere taşı')}
          />
          <ListItem icon="book" label="Defterin kapağı yap" onPress={() => menuAction('Defterin kapağı yap')} />
          <ListItem icon="dl" label="Çizimi galeriye kaydet" onPress={() => menuAction('Çizimi galeriye kaydet')} />
        </ListGroup>
        <ListGroup style={{ marginTop: 12 }}>
          <ListItem icon="x" label="Anıyı sil" danger onPress={() => sheet.then('delete')} />
        </ListGroup>
      </Sheet>

      <NoteSheet
        visible={sheet.is('note')}
        note={memory.note}
        onClose={sheet.close}
        onSave={(note) => {
          setMemoryNote(memory.id, note);
          sheet.close();
        }}
      />

      <Sheet visible={sheet.is('delete')} onClose={sheet.close}>
        <View style={{ alignItems: 'center' }}>
          <Sticker source={memory.drawing} style={{ width: 120, height: 120, opacity: 0.9 }} />
          <Text variant="sec" style={{ fontSize: 24, lineHeight: 30, marginTop: 12 }}>
            Bu anı silinsin mi?
          </Text>
          <Text variant="sub" style={styles.deleteText}>
            Çizim ve not kalıcı olarak silinir. Orijinal fotoğrafın galerinde kalır. Harcanan fırça geri gelmez.
          </Text>
          <Button
            label="Kalıcı olarak sil"
            variant="danger"
            style={{ marginTop: 22, alignSelf: 'stretch' }}
            onPress={() =>
              sheet.then(() => {
                const gone = memory.id;
                router.back();
                // Delete once the screen has slid away, so it never renders a missing memory.
                setTimeout(() => {
                  const undo = deleteMemory(gone);
                  if (undo) toast.undo('Anı silindi.', undo);
                }, SCREEN_POP_MS);
              })
            }
          />
          <TextButton label="Vazgeç" onPress={sheet.close} />
        </View>
      </Sheet>

      <Modal visible={photoOpen} transparent animationType="fade" onRequestClose={() => setPhotoOpen(false)}>
        <Pressable style={styles.viewer} onPress={() => setPhotoOpen(false)} accessibilityLabel="Kapat">
          {memory.photo ? <Image source={memory.photo} style={styles.full} contentFit="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  );
}

/** The drawing card starts this far below its box (art and pile margin). */
const CARD_TOP = 18;
/** How far the note bubble sticks out past the card's top-right corner. */
const BUBBLE_OUT = 8;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.gutter },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  art: { marginTop: 18, height: 330, alignItems: 'center', justifyContent: 'center' },
  // Sticks out a little past the drawing card's top-right corner.
  // A long note wraps instead of covering the whole drawing.
  bubble: {
    position: 'absolute',
    top: CARD_TOP - BUBBLE_OUT,
    maxWidth: '60%',
    zIndex: 100,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.dot },
  dotOn: { backgroundColor: colors.ink },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, alignSelf: 'flex-start' },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  foot: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', gap: 12 },
  deleteText: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
  viewer: { flex: 1, backgroundColor: colors.viewer, alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '80%' },
});
