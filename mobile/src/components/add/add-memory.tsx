import { Image } from 'expo-image';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Button, Sheet, Text } from '@/components/ui';
import { SHEET_PHOTOS, SHEET_SWAP_MS, routes } from '@/constants';
import { noBrushes } from '@/lib/alerts';
import { galleryAccess, openPhotoSettings, recentPhotos, type GalleryAccess } from '@/lib/gallery';
import { photoParam, pickPhoto } from '@/lib/photos';
import { hasBrush } from '@/mock';
import { colors, fonts, radius } from '@/theme';

const Ctx = createContext<{ open: (notebookId?: string) => void }>({ open: () => {} });

/**
 * Opens the photo picker from anywhere under the tabs (bottom bar, "Bugünü çiz").
 * Pass a notebook id to add straight into that notebook.
 */
export const useAddMemory = () => useContext(Ctx);

/** The sheet's photos: read from the library each time it opens. */
type Shelf = { access: GalleryAccess; ids: string[]; today: boolean };

/** Reads the library while the sheet is open. The first open asks for photo access. */
function useShelf(visible: boolean) {
  const [shelf, setShelf] = useState<Shelf>();
  useEffect(() => {
    if (!visible) return;
    let live = true;
    (async () => {
      const access = await galleryAccess();
      const { ids, today } = access === 'denied' ? { ids: [], today: true } : await recentPhotos();
      if (live) setShelf({ access, ids, today });
    })().catch((error: unknown) => {
      console.warn('gallery_failed', error);
      if (live) setShelf({ access: 'denied', ids: [], today: true });
    });
    return () => {
      live = false;
    };
  }, [visible]);
  return shelf;
}

// Step 1 of "Anı ekle": pick a photo. Today's photos first, the first one preselected,
// so the fastest path is one tap on "Çiz". No questions after this. With no photo access,
// or no recent photo, only the system picker is offered.
export function AddMemoryProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - 40 - 16) / 3); // 3 columns, 20px gutters, 8px gaps
  const [visible, setVisible] = useState(false);
  const [picked, setPicked] = useState<string>();
  const [notebookId, setNotebookId] = useState<string>();
  const shelf = useShelf(visible);
  const shown = shelf?.ids.slice(0, SHEET_PHOTOS) ?? [];
  // The newest photo is preselected until another one is tapped.
  const selected = picked && shown.includes(picked) ? picked : shown[0];
  const noShelfPhoto = shelf !== undefined && shown.length === 0;

  /** `photo`: a gallery id (`ph://`) or a picked file URI. The server spends the brush. */
  const draw = (photo: string) => {
    setVisible(false);
    // Wait for the sheet to close before opening the next sheet or screen.
    setTimeout(() => (hasBrush() ? router.push(routes.add(photo, notebookId)) : noBrushes()), SHEET_SWAP_MS);
  };

  const drawFromGallery = async () => {
    const picked = await pickPhoto();
    const uri = picked && photoParam(picked);
    if (uri) draw(uri);
  };

  return (
    <Ctx.Provider
      value={{
        open: (id) => {
          setNotebookId(id);
          setPicked(undefined);
          setVisible(true);
        },
      }}>
      {children}
      <Sheet visible={visible} onClose={() => setVisible(false)}>
        <View style={styles.head}>
          <Text variant="sec">{shelf && !shelf.today ? 'Son çektiklerin' : 'Bugün çektiklerin'}</Text>
          {shelf && shelf.ids.length > 0 ? <Text variant="sub">{shelf.ids.length} fotoğraf</Text> : null}
        </View>
        {shown.length > 0 ? (
          <View style={styles.grid}>
            {shown.map((id, i) => {
              const on = id === selected;
              return (
                <Pressable
                  key={id}
                  onPress={() => setPicked(id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Fotoğraf ${i + 1}${on ? ', seçili' : ''}`}
                  style={[styles.cell, { width: cell, height: cell }]}>
                  <Image source={{ uri: id }} style={{ width: cell, height: cell }} contentFit="cover" />
                  {on ? (
                    <>
                      <View style={[StyleSheet.absoluteFill, styles.ring]} />
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>1</Text>
                      </View>
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : shelf ? (
          <Text variant="sub" style={styles.empty}>
            {shelf.access === 'denied'
              ? 'Galeri izni kapalı. Fotoğrafı aşağıdan seçebilir ya da Ayarlar’dan izin verebilirsin.'
              : shelf.access === 'limited'
                ? 'Sadece izin verdiğin fotoğrafları görebiliyorum, son günlerde yeni fotoğraf yok.'
                : 'Son günlerde çektiğin bir fotoğraf yok.'}
          </Text>
        ) : (
          <View style={[styles.grid, { height: cell }]} />
        )}
        {shelf?.access === 'denied' ? (
          <Button
            variant="secondary"
            label="Ayarlar’dan izin ver"
            size="m"
            style={{ marginTop: 16 }}
            onPress={openPhotoSettings}
          />
        ) : null}
        {/* No photo to preselect: the picker becomes the main button. */}
        <Button
          variant={noShelfPhoto ? 'primary' : 'secondary'}
          icon="img"
          label="Tüm fotoğraflar"
          size={noShelfPhoto ? 'l' : 'm'}
          style={{ marginTop: 16 }}
          onPress={drawFromGallery}
        />
        {noShelfPhoto ? null : (
          <Button
            icon="brush"
            label="Çiz · 1 fırça"
            disabled={!selected}
            style={{ marginTop: 14 }}
            onPress={() => selected && draw(selected)}
          />
        )}
      </Sheet>
    </Ctx.Provider>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  cell: { borderRadius: radius.thumb, overflow: 'hidden', backgroundColor: colors.empty },
  ring: { borderRadius: radius.thumb, borderWidth: 3, borderColor: colors.red },
  badge: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.heavy, fontSize: 12, color: colors.white },
  empty: { marginTop: 14 },
});
