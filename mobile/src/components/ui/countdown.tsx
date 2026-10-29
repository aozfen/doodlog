import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { colors, fonts } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 26;
const STROKE = 2.5;
const RADIUS = (SIZE - STROKE) / 2;
const LENGTH = 2 * Math.PI * RADIUS;
/** How far a digit travels when it rolls in or out. */
const ROLL = 12;

// A new digit drops in from above while the old one drops out below.
const DIGIT_IN = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -ROLL }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
}).duration(260);
const DIGIT_OUT = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }] },
  100: { opacity: 0, transform: [{ translateY: ROLL }] },
}).duration(260);

/** Seconds left as a rolling number inside a ring that empties over `duration`. */
export function Countdown({ duration }: { duration: number }) {
  const [left, setLeft] = useState(Math.ceil(duration / 1000));
  const spent = useSharedValue(0);

  useEffect(() => {
    spent.set(withTiming(1, { duration, easing: Easing.linear }));
    const start = Date.now();
    const id = setInterval(() => setLeft(Math.max(1, Math.ceil((duration - (Date.now() - start)) / 1000))), 200);
    return () => clearInterval(id);
  }, [duration, spent]);

  const ring = useAnimatedProps(() => ({ strokeDashoffset: LENGTH * spent.get() }));

  return (
    <View style={styles.root} accessibilityLabel={`${left} saniye`}>
      <Svg width={SIZE} height={SIZE} style={styles.ring}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.white}
          strokeOpacity={0.2}
          strokeWidth={STROKE}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.white}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={LENGTH}
          animatedProps={ring}
          fill="none"
        />
      </Svg>
      <Animated.Text key={left} entering={DIGIT_IN} exiting={DIGIT_OUT} style={styles.digit}>
        {left}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  // Start at the top and empty clockwise.
  ring: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  digit: {
    position: 'absolute',
    fontFamily: fonts.heavy,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
    includeFontPadding: false,
  },
});
