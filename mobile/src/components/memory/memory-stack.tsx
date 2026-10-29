import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Flat, Sticker } from '@/components/ui';
import { space } from '@/theme';
import type { Memory } from '@/types';

const CARD_H = 330;
const STICKER = 270;
/** Cards drawn behind the top one. */
const BEHIND = 2;
/** Each card behind sits this much lower and smaller. */
const STEP_Y = 12;
const STEP_SCALE = 0.05;
/** Resting tilt of the cards behind, so the stack looks like a pile. */
const BEHIND_TILT = [0, -3, 2.5];
/** Drag tilt at one screen width. */
const DRAG_TILT = 14;
/** Swipe counts when dragged this share of the width or flicked this fast. */
const SWIPE_SHARE = 0.25;
const SWIPE_VELOCITY = 800;
const FLY_MS = 220;

type Props = {
  memories: Memory[];
  index: number;
  /** A swipe either way shows the next memory, wrapping around at the end. */
  onChange: (index: number) => void;
};

/**
 * The day's memories as a pile of cards. The top card follows the finger and flies out
 * like a dating-app card; the card under it moves up into place.
 * Every card stays mounted and only its place in the pile changes, so drawings never
 * reload (a fresh Image starts empty and pops in).
 */
export function MemoryStack({ memories, index, onChange }: Props) {
  const { width } = useWindowDimensions();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  // The top card lives on the UI thread, so the pile and the drag reset change in one frame.
  const top = useSharedValue(index);
  const count = memories.length;
  const threshold = width * SWIPE_SHARE;

  useEffect(() => {
    if (top.get() !== index) top.set(index);
  }, [index, top]);

  const swiped = (next: number) => {
    Haptics.selectionAsync();
    onChange(next);
  };

  const pan = usePanGesture({
    // Horizontal drags only: vertical moves stay with the screen's scroll.
    activeOffsetX: [-10, 10],
    failOffsetY: [-14, 14],
    onUpdate: (e) => {
      'worklet';
      tx.set(e.translationX);
      ty.set(e.translationY * 0.3);
    },
    onDeactivate: (e) => {
      'worklet';
      const flung = Math.abs(e.velocityX) > SWIPE_VELOCITY;
      if (Math.abs(e.translationX) > threshold || flung) {
        const dir = Math.sign(e.translationX || e.velocityX);
        tx.set(
          withTiming(dir * width * 1.5, { duration: FLY_MS }, (finished) => {
            if (!finished) return;
            const next = (top.get() + 1) % count;
            top.set(next);
            tx.set(0);
            ty.set(0);
            scheduleOnRN(swiped, next);
          }),
        );
      } else {
        tx.set(withSpring(0));
        ty.set(withSpring(0));
      }
    },
  });

  return (
    <GestureDetector gesture={pan}>
      <View style={[styles.root, { height: CARD_H + STEP_Y * BEHIND }]}>
        {memories.map((memory, i) => (
          <StackCard
            key={memory.id}
            memory={memory}
            position={i}
            count={count}
            top={top}
            tx={tx}
            ty={ty}
            width={width}
            threshold={threshold}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

function StackCard({
  memory,
  position,
  count,
  top,
  tx,
  ty,
  width,
  threshold,
}: {
  memory: Memory;
  position: number;
  count: number;
  top: SharedValue<number>;
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  width: number;
  threshold: number;
}) {
  const style = useAnimatedStyle(() => {
    const depth = (position - top.get() + count) % count;
    if (depth === 0) {
      return {
        zIndex: count,
        opacity: 1,
        transform: [
          { translateX: tx.get() },
          { translateY: ty.get() },
          { rotate: `${(tx.get() / width) * DRAG_TILT}deg` },
          { scale: 1 },
        ],
      };
    }
    // Cards under the top one move one step up while it is dragged away.
    const p = interpolate(Math.abs(tx.get()), [0, threshold], [0, 1], 'clamp');
    const at = Math.min(depth, BEHIND + 1) - p;
    const tilt = interpolate(p, [0, 1], [BEHIND_TILT[depth] ?? 0, BEHIND_TILT[depth - 1] ?? 0]);
    return {
      zIndex: count - depth,
      // Deeper cards stay mounted but hidden until they come up.
      opacity: interpolate(at, [BEHIND, BEHIND + 1], [1, 0], 'clamp'),
      transform: [
        { translateX: 0 },
        { translateY: at * STEP_Y },
        { rotate: `${tilt}deg` },
        { scale: 1 - at * STEP_SCALE },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.card, style]}>
      <Flat style={styles.face}>
        <Sticker source={memory.drawing} style={{ width: STICKER, height: STICKER }} />
      </Flat>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 18 },
  card: { position: 'absolute', left: space.gutter / 2, right: space.gutter / 2, top: 0 },
  face: { height: CARD_H, alignItems: 'center', justifyContent: 'center' },
});
