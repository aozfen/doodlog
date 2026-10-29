import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';
import type { Picture } from '@/types';

// White die-cut edge around a drawing, like a sticker (TEMA.md "Çıkartma").
// The drawing PNG has a transparent background. We draw white-tinted copies
// offset in 8 directions behind it. Later this edge can be baked into the PNG
// when the drawing is saved, so the list renders one image per sticker.
const EDGE = 2.5;
const D = EDGE * 0.7071;
const OFFSETS = [
  [EDGE, 0],
  [-EDGE, 0],
  [0, EDGE],
  [0, -EDGE],
  [D, D],
  [-D, D],
  [D, -D],
  [-D, -D],
];

type Props = {
  source: Picture;
  style?: StyleProp<ViewStyle>;
  /** Fit inside the box. Default contain. */
  contentFit?: 'contain' | 'cover';
};

export function Sticker({ source, style, contentFit = 'contain' }: Props) {
  return (
    <View style={[styles.shadow, style]} pointerEvents="none">
      {OFFSETS.map(([x, y], i) => (
        <Image
          key={i}
          source={source}
          contentFit={contentFit}
          tintColor={colors.white}
          style={[StyleSheet.absoluteFill, { transform: [{ translateX: x }, { translateY: y }] }]}
        />
      ))}
      <Image source={source} contentFit={contentFit} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  // iOS draws the shadow from the image alpha because the view has no background.
  shadow: {
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 5 },
  },
});
