import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Flat, IconButton, ListGroup, ListItem, Sheet, Sticker, Text, TextButton } from '@/components/ui';
import { routes } from '@/constants';
import { useSheet } from '@/hooks/use-sheet';
import { comingSoon } from '@/lib/alerts';
import { dayMonth, dayName, parseIsoDay } from '@/lib/date';
import { getMemory, getNotebook, mockToday } from '@/mock';
import { colors, space } from '@/theme';

// Memory detail. Design: design/a-takvim.html (3) and design/a-ani-menu.html.
export default function MemoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const sheet = useSheet<'menu' | 'delete'>();
  const [photoOpen, setPhotoOpen] = useState(false);

  const memory = getMemory(id);
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
          {[year !== mockToday.getFullYear() ? String(year) : null, dayName(date), notebook?.name]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <Flat style={styles.art}>
          <Sticker source={memory.drawing} style={{ width: 290, height: 290 }} />
        </Flat>

        <Text variant="note" style={styles.note}>
          {memory.note}
        </Text>

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
          <ListItem icon="chat" label="Notu düzenle" onPress={() => menuAction('Notu düzenle')} />
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

      <Sheet visible={sheet.is('delete')} onClose={sheet.close}>
        <View style={{ alignItems: 'center' }}>
          <Sticker source={memory.drawing} style={{ width: 120, height: 120, opacity: 0.9 }} />
          <Text variant="sec" style={{ fontSize: 24, lineHeight: 30, marginTop: 12 }}>
            Bu anı silinsin mi?
          </Text>
          <Text variant="sub" style={styles.deleteText}>
            Çizim ve not bu telefondan silinir. Orijinal fotoğrafın galerinde kalır. Harcanan fırça geri gelmez.
          </Text>
          <Button
            label="Sil"
            variant="danger"
            style={{ marginTop: 22, alignSelf: 'stretch' }}
            // Mock: nothing is deleted yet, just leave the screen.
            onPress={() => sheet.then(() => router.back())}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.gutter },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  art: { marginTop: 18, height: 330, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 18, lineHeight: 24, marginTop: 18 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, alignSelf: 'flex-start' },
  thumb: { width: 52, height: 52, borderRadius: 14 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  foot: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', gap: 12 },
  deleteText: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
  viewer: { flex: 1, backgroundColor: colors.viewer, alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '80%' },
});
