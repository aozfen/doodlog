import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { Raised, Text } from '@/components/ui';
import { colors, depth, fonts } from '@/theme';

/**
 * Thought bubble sticking out of the drawing card's top-right corner: a small dark box with
 * two dots trailing from its bottom-left corner toward the drawing. It shows the note itself,
 * like a thought of the people drawn, or "Not ekle..." when there is none. Tap to edit.
 */
export function NoteBubble({ note, onPress }: { note: string; onPress: () => void }) {
  const label = note || 'Not ekle...';
  // Pops in like a thought: the small dot, then the big dot, then the box.
  return (
    <View>
      <Animated.View entering={pop(DOT_MS, 0)} pointerEvents="none" style={[styles.dot, styles.small]} />
      <Animated.View entering={pop(DOT_MS, STEP_MS)} pointerEvents="none" style={[styles.dot, styles.big]} />
      <Animated.View entering={pop(BOX_MS, STEP_MS * 2)} style={styles.box}>
        <Raised
          onPress={onPress}
          accessibilityLabel={note ? `Not: ${note}. Düzenle` : 'Not ekle'}
          color={colors.ink}
          topColor={colors.inkTop}
          edgeColor={colors.inkEdge}
          depth={depth.small}
          radius={16}
          style={styles.face}>
          <Text style={styles.label} numberOfLines={NOTE_LINES}>
            {label}
          </Text>
        </Raised>
      </Animated.View>
    </View>
  );
}

/** Grows a little past full size, then settles. */
const pop = (duration: number, delay: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ scale: 0.4 }] },
    60: { opacity: 1, transform: [{ scale: 1.08 }] },
    100: { opacity: 1, transform: [{ scale: 1 }] },
  })
    .duration(duration)
    .delay(delay);

const DOT_MS = 260;
const BOX_MS = 360;
/** Gap between the small dot, the big dot and the box. */
const STEP_MS = 160;

/** Longer notes end with "…"; the whole note shows when editing. */
const NOTE_LINES = 2;

const styles = StyleSheet.create({
  // Grows out of its bottom-left corner, where the dots are.
  box: { transformOrigin: 'left bottom' },
  face: { paddingHorizontal: 11, paddingVertical: 6 },
  label: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 17, color: colors.white },
  dot: { position: 'absolute', backgroundColor: colors.ink },
  // Right at the box's bottom-left corner, then one step further down-left.
  big: { width: 9, height: 9, borderRadius: 5, bottom: -7, left: -5 },
  small: { width: 5, height: 5, borderRadius: 3, bottom: -15, left: -13 },
});
