import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Raised, Sticker, Text } from '@/components/ui';
import type { Memory } from '@/types';
import { colors } from '@/theme';

const SIZES = {
  s: { art: 130, left: -4, top: -14, pad: 132, minHeight: 96 },
  m: { art: 156, left: -6, top: -38, pad: 150, minHeight: 128 },
};

type Props = {
  memory: Memory;
  label: string;
  /** Red label, e.g. "1 yıl önce bugün". */
  accent?: boolean;
  size?: keyof typeof SIZES;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

// Memory card with the drawing sticking out on the left and the note on the right.
export function SideMemoryCard({ memory, label, accent, size = 's', onPress, style }: Props) {
  const s = SIZES[size];
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={`${label}, ${memory.note}`}
      containerStyle={style}
      style={[styles.card, { minHeight: s.minHeight, paddingLeft: s.pad }]}>
      <Sticker
        source={memory.drawing}
        style={{ position: 'absolute', left: s.left, top: s.top, width: s.art, height: s.art }}
      />
      <Text variant="label" color={accent ? colors.red : undefined}>
        {label}
      </Text>
      <Text variant="note" style={{ marginTop: 2 }}>
        {memory.note}
      </Text>
    </Raised>
  );
}

const styles = StyleSheet.create({
  card: { justifyContent: 'flex-end', paddingVertical: 18, paddingRight: 20 },
});
