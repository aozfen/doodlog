import { useEffect } from 'react';
import {
  Easing,
  Keyframe,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Drawing arrival (TEMA.md): small tilt and scale, settles with a light overshoot. */
export const drawingPop = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.85 }, { rotate: '-3deg' }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }], easing: Easing.bezier(0.2, 0.9, 0.3, 1.2) },
}).duration(700);

/**
 * Same pop as `drawingPop`, driven by a shared value. Use it inside a view that has its own
 * `entering` animation: Reanimated skips nested entering animations.
 */
export function usePopIn(duration = 500, delay = 0) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.2, 0.9, 0.3, 1.2) })));
  }, [p, duration, delay]);
  return useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(p.value, [0, 1], [0.85, 1]) },
      { rotate: `${interpolate(p.value, [0, 1], [-3, 0])}deg` },
    ],
  }));
}

/** Fade in while sliding up a little. Same nested `entering` caveat as `usePopIn`. */
export function useFadeUp(delay = 0, duration = 400, distance = 14) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) })));
  }, [p, duration, delay]);
  return useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: interpolate(p.value, [0, 1], [distance, 0]) }],
  }));
}

/**
 * Endless slow float up and down with a small tilt, after `delay`.
 * `direction` 1 or -1 lets neighbours move against each other.
 */
export function useFloat({ delay = 0, duration = 2400, distance = 9, tilt = 1.5, direction = 1 } = {}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)));
  }, [p, delay, duration]);
  return useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(p.value, [0, 1], [0, -distance * direction]) },
      { rotate: `${interpolate(p.value, [0, 1], [0, tilt * direction])}deg` },
    ],
  }));
}
