import { Image } from 'expo-image';
import { router } from 'expo-router';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Button, Sheet, Text } from '@/components/ui';
import { SHEET_SWAP_MS, routes } from '@/constants';
import { comingSoon } from '@/lib/alerts';
import { photos, todayPhotos, type DrawingKey } from '@/mock';
import { colors, fonts, radius } from '@/theme';

const Ctx = createContext<{ open: (notebookId?: string) => void }>({ open: () => {} });

/**
 * Opens the photo picker from anywhere under the tabs (bottom bar, "Bugünü çiz").
 * Pass a notebook id to add straight into that notebook.
 */
export const useAddMemory = () => useContext(Ctx);

// Step 1 of "Anı ekle": pick a photo. Today's photos first, the first one preselected,
// so the fastest path is one tap on "Çiz". No questions after this.
export function AddMemoryProvider({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const cell = Math.floor((width - 40 - 16) / 3); // 3 columns, 20px gutters, 8px gaps
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState<DrawingKey>(todayPhotos[0]);
  const [notebookId, setNotebookId] = useState<string>();

  const draw = () => {
    setVisible(false);
    // Wait for the sheet to close before opening the next modal screen.
    setTimeout(() => router.push(routes.add(selected, notebookId)), SHEET_SWAP_MS);
  };

  return (
    <Ctx.Provider
      value={{
        open: (id) => {
          setNotebookId(id);
          setVisible(true);
        },
      }}>
      {children}
      <Sheet visible={visible} onClose={() => setVisible(false)}>
        <View style={styles.head}>
          <Text variant="sec">Bugün çektiklerin</Text>
          <Text variant="sub">{todayPhotos.length} fotoğraf</Text>
        </View>
        <View style={styles.grid}>
          {todayPhotos.map((key, i) => {
            const on = key === selected;
            return (
              <Pressable
                key={key}
                onPress={() => setSelected(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Fotoğraf ${i + 1}${on ? ', seçili' : ''}`}
                style={[styles.cell, { width: cell, height: cell }]}>
                <Image source={photos[key]} style={{ width: cell, height: cell }} contentFit="cover" />
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
        <Button
          variant="secondary"
          icon="img"
          label="Tüm fotoğraflar"
          size="m"
          style={{ marginTop: 16 }}
          onPress={() => comingSoon('Tüm fotoğraflar', 'Yakında: galeri açılır')}
        />
        <Button icon="brush" label="Çiz · 1 fırça" style={{ marginTop: 14 }} onPress={draw} />
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
});
