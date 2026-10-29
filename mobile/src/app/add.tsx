import RNMaskedView, { type MaskedViewProps } from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { NewNotebookSheet } from '@/components/notebook/new-notebook-sheet';
import { NotebookPicker } from '@/components/notebook/notebook-picker';
import { Button, Chip, Field, Flat, IconButton, ProgressBar, ProgressFill, Sticker, Tag, Text } from '@/components/ui';
import { EXPECTED_DRAW_MS, NOTE_MAX, REVEAL_MS, SCREEN_POP_MS } from '@/constants';
import { useSheet } from '@/hooks/use-sheet';
import { useUser } from '@/hooks/use-store';
import { comingSoon, drawFailed, noBrushes } from '@/lib/alerts';
import { drawingPop } from '@/lib/animations';
import { dayMonth, getToday, toIsoDay } from '@/lib/date';
import { DrawError, drawPhoto, newRequestId } from '@/lib/drawing';
import {
  addMemory,
  applyBalance,
  getNotebook,
  getNotebooks,
  guessNotebook,
  hasBrush,
  isDrawingKey,
  photos,
  totalBrushes,
} from '@/mock';
import { colors, space } from '@/theme';
import type { Picture } from '@/types';

// The package's class types do not match React 19 types yet, so it is retyped here.
const MaskedView = RNMaskedView as unknown as ComponentType<MaskedViewProps>;

// Paint reveal: a mask with a solid top and a soft band at its bottom edge slides down.
const SIZE = 300;
const BAND = 90; // height of the soft edge
/** The bar reaches this in the expected time, then keeps creeping, so it never looks stuck. */
const EXPECTED_PROGRESS = 0.75;
const LATE_PROGRESS = 0.95;
const LATE_MS = 45_000;

/** The photo to draw: a bundled mock photo key, or a picked file URI. */
function usePhotoParam() {
  const params = useLocalSearchParams<{ photo?: string; notebook?: string }>();
  const key = params.photo && isDrawingKey(params.photo) ? params.photo : undefined;
  const photo: Picture | undefined = key ? photos[key] : params.photo ? { uri: params.photo } : undefined;
  const guessed = key ? guessNotebook(key) : getNotebooks()[0]?.id;
  const notebookId = params.notebook && getNotebook(params.notebook) ? params.notebook : guessed;
  // Picked photos are not kept: the gallery asset id comes with the redraw feature.
  return { photo, keepPhoto: key ? photo : undefined, notebookId };
}

// Add memory, steps 2 and 3: "Çiziliyor…" then "Hazır". Design: design/a-ekle.html.
// Notebook and date are prefilled from the photo, nothing is asked.
export default function AddMemoryScreen() {
  const { photo, keepPhoto, notebookId } = usePhotoParam();
  const [drawing, setDrawing] = useState<Picture>();
  const [round, setRound] = useState(0); // 0 = first drawing, 1+ = redraws
  // Stable callback so the drawing request does not restart on re-render.
  const done = useCallback((result: Picture) => setDrawing(result), []);

  if (!photo) return null;
  if (!drawing) {
    return (
      <Drawing key={round} photo={photo} keepPhoto={keepPhoto} notebookId={notebookId} round={round} onDone={done} />
    );
  }
  return (
    <Ready
      drawing={drawing}
      photo={keepPhoto}
      notebookId={notebookId}
      onRedraw={() => {
        setDrawing(undefined);
        setRound((r) => r + 1);
      }}
    />
  );
}

function Drawing({
  photo,
  keepPhoto,
  notebookId,
  round,
  onDone,
}: {
  photo: Picture;
  keepPhoto?: Picture;
  notebookId?: string;
  /** 0 = first drawing, 1+ = redraws. Every one costs 1 fırça. */
  round: number;
  onDone: (drawing: Picture) => void;
}) {
  const insets = useSafeAreaInsets();
  const bar = useSharedValue(0);
  const reveal = useSharedValue(0);
  const [drawing, setDrawing] = useState<Picture>();
  /** Past the expected time: say it is nearly done instead of looking stuck. */
  const [late, setLate] = useState(false);
  const notebook = notebookId ? getNotebook(notebookId) : undefined;
  const user = useUser();

  useEffect(() => {
    let open = true;
    bar.value = withSequence(
      withTiming(EXPECTED_PROGRESS, { duration: EXPECTED_DRAW_MS, easing: Easing.out(Easing.quad) }),
      withTiming(LATE_PROGRESS, { duration: LATE_MS, easing: Easing.linear }),
    );
    const lateTimer = setTimeout(() => setLate(true), EXPECTED_DRAW_MS);
    drawPhoto(photo, newRequestId())
      .then(({ drawing: result, brushes }) => {
        applyBalance(brushes);
        if (!open) {
          // Closed while drawing: the brush is spent, so the drawing is kept as today's memory.
          if (notebookId) {
            addMemory({ notebookId, date: toIsoDay(getToday()), note: '', drawing: result, photo: keepPhoto });
          }
          return;
        }
        setDrawing(result);
        bar.value = withTiming(1, { duration: REVEAL_MS });
        reveal.value = withTiming(1, { duration: REVEAL_MS, easing: Easing.inOut(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(onDone, result);
        });
      })
      .catch((error: unknown) => {
        const kind = error instanceof DrawError ? error.kind : 'failed';
        if (error instanceof DrawError && error.brushes) applyBalance(error.brushes);
        if (!open) return;
        if (kind === 'no_brushes') {
          router.back();
          setTimeout(noBrushes, SCREEN_POP_MS);
          return;
        }
        drawFailed(kind, () => router.back());
      });
    return () => {
      open = false;
      clearTimeout(lateTimer);
      cancelAnimation(bar);
      cancelAnimation(reveal);
    };
    // One request per mount: a redraw mounts a new Drawing (see `key`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Photo fades out while the drawing is painted from top to bottom.
  const photoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0, 0.8], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(reveal.value, [0, 0.8], [1, 0.94], 'clamp') }],
  }));
  const maskStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(reveal.value, [0, 0.9], [-(SIZE + BAND), 0], 'clamp') }],
  }));
  const barStyle = useAnimatedStyle(() => ({ width: `${interpolate(bar.value, [0, 1], [4, 100], 'clamp')}%` }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.top}>
        <IconButton icon="x" label="Kapat" onPress={() => router.back()} />
        {/* Every drawing, redraws too, costs 1 fırça. The server spends it. */}
        <Chip icon="brush" label={String(totalBrushes(user))} />
      </View>

      <View style={styles.reveal}>
        <Animated.View style={[styles.photo, photoStyle]}>
          <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Animated.View>
        {drawing ? (
          <MaskedView
            style={styles.paint}
            maskElement={
              <Animated.View style={[styles.mask, maskStyle]}>
                <View style={{ height: SIZE, backgroundColor: colors.black }} />
                <LinearGradient colors={[colors.black, 'transparent']} style={{ height: BAND }} />
              </Animated.View>
            }>
            <Sticker source={drawing} style={{ width: SIZE, height: SIZE }} />
          </MaskedView>
        ) : null}
      </View>

      <Text variant="hand" style={styles.title}>
        {round > 0 ? 'Yeniden çiziliyor…' : 'Çiziliyor…'}
      </Text>
      <Text variant="sub" style={{ textAlign: 'center', marginTop: 8 }}>
        {late ? 'Son rötuşlar yapılıyor' : notebook ? `${notebook.name} defterine çiziliyor` : 'Çizgiler atılıyor'}
      </Text>
      <ProgressBar style={styles.track}>
        <Animated.View style={[{ height: '100%' }, barStyle]}>
          <ProgressFill />
        </Animated.View>
      </ProgressBar>
      <Text variant="sub" style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>
        Kapatabilirsin, bitince deftere eklenir.
      </Text>
    </View>
  );
}

function Ready({
  drawing,
  photo,
  notebookId: initialNotebookId,
  onRedraw,
}: {
  drawing: Picture;
  /** Kept with the memory. Undefined for picked photos (see usePhotoParam). */
  photo?: Picture;
  notebookId?: string;
  onRedraw: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [notebookId, setNotebookId] = useState(initialNotebookId);
  const sheet = useSheet<'picker' | 'newNotebook'>();
  const [note, setNote] = useState('');
  const notebook = notebookId ? getNotebook(notebookId) : undefined;
  const footBottom = Math.max(insets.bottom, 20) + 10;

  const redraw = () => {
    Alert.alert('Tekrar çiz', '1 fırça harcanır.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çiz · 1 fırça', onPress: () => (hasBrush() ? onRedraw() : noBrushes()) },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: footBottom + 120 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <IconButton icon="x" label="Kapat" onPress={() => router.back()} />
          <Text variant="hand" style={{ fontSize: 34, lineHeight: 38 }}>
            Hazır
          </Text>
          <IconButton icon="redo" label="Tekrar çiz, 1 fırça" onPress={redraw} />
        </View>

        <Animated.View entering={drawingPop}>
          {/* Flat: nothing happens on tap, so it must not look pressable. */}
          <Flat style={styles.art}>
            <Sticker source={drawing} style={{ width: 270, height: 270 }} />
          </Flat>
        </Animated.View>

        <View style={styles.tags}>
          <Tag icon="cal" label={dayMonth(getToday())} onPress={() => comingSoon('Tarihi değiştir')} />
          {/* Only the guessed notebook is shown, so the row fits any number of notebooks. */}
          <Tag icon="nb" chevron label={notebook?.name ?? 'Defter seç'} onPress={() => sheet.open('picker')} />
        </View>

        <Field
          icon="chat"
          placeholder="Bir not ekle (isteğe bağlı)"
          accessibilityLabel="Not"
          value={note}
          onChangeText={setNote}
          maxLength={NOTE_MAX}
          style={{ marginTop: 16 }}
        />
      </ScrollView>

      <View style={[styles.foot, { bottom: footBottom }]}>
        <Button
          icon="check"
          label="Kaydet"
          disabled={!notebook}
          onPress={() => {
            if (!notebook) return;
            addMemory({
              notebookId: notebook.id,
              date: toIsoDay(getToday()),
              note,
              drawing,
              photo,
            });
            // Back to where "Anı ekle" was opened.
            router.back();
          }}
        />
        <Text variant="sub" style={{ textAlign: 'center', fontSize: 12 }}>
          Beğenmedin mi? Sağ üstten tekrar çiz, 1 fırça.
        </Text>
      </View>

      <NotebookPicker
        visible={sheet.is('picker')}
        selected={notebookId}
        onSelect={setNotebookId}
        onClose={sheet.close}
        onNew={() => sheet.then('newNotebook')}
      />
      <NewNotebookSheet
        visible={sheet.is('newNotebook')}
        onClose={sheet.close}
        onCreate={(n) => {
          setNotebookId(n.id);
          sheet.close();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.gutter },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reveal: { width: 300, height: 300, alignSelf: 'center', marginTop: 70 },
  photo: { position: 'absolute', left: 30, top: 30, width: 240, height: 240, borderRadius: 28, overflow: 'hidden' },
  paint: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE },
  mask: { width: SIZE, height: SIZE + BAND },
  title: { fontSize: 40, lineHeight: 46, textAlign: 'center', marginTop: 36, paddingLeft: 8 },
  track: { marginTop: 28, marginHorizontal: 30 },
  art: { marginTop: 22, height: 300, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 },
  foot: { position: 'absolute', left: space.gutter, right: space.gutter, gap: 12 },
});
