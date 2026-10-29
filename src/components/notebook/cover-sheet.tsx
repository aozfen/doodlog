import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Sheet, Text } from '@/components/ui';
import { colors, space } from '@/theme';
import type { Memory, Picture } from '@/types';

const COLUMNS = 3;
const GAP = 10;
const MAX_OPTIONS = 9;

// Pick the cover from this notebook's drawings, newest first. Design: a-defter-ayar.html (3).
export function CoverSheet({
  visible,
  memories,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  memories: Memory[];
  selected?: Picture;
  onSelect: (cover: Picture) => void;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const cell = (width - space.gutter * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const options = [...new Set(memories.map((m) => m.drawing).reverse())].slice(0, MAX_OPTIONS);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="sec" style={styles.center}>
        Kapak
      </Text>
      <Text variant="sub" style={[styles.center, { marginTop: 4 }]}>
        Bu defterin çizimlerinden birini seç
      </Text>
      <View style={styles.grid}>
        {options.map((src, i) => {
          const on = src === selected;
          return (
            <Pressable
              key={i}
              onPress={() => onSelect(src)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Çizim ${i + 1}, kapak yap`}
              style={({ pressed }) => [
                styles.cell,
                { width: cell, height: cell },
                on && styles.on,
                pressed && { opacity: 0.7 },
              ]}>
              <Image source={src} style={{ flex: 1 }} contentFit="contain" />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 18 },
  cell: { backgroundColor: colors.surface, borderRadius: 16, padding: 6, borderWidth: 1.5, borderColor: colors.line },
  on: { borderWidth: 2.5, borderColor: colors.ink },
});
