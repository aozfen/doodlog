import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { WEEKDAYS, daysInMonth, isSameDay, isoDay, mondayIndex } from '@/lib/date';
import { colors, fonts, radius, space } from '@/theme';
import type { Memory } from '@/types';

const GAP = 4;
const ROW_GAP = 8;

type Props = {
  year: number;
  month: number; // 0-based
  byDay: Map<string, Memory>;
  today: Date;
  onDayPress?: (m: Memory) => void;
  /** ISO day whose drawing lands in with an animation (just saved). */
  landingDay?: string;
};

// Month page. Empty day = flat pit, filled day = raised with a crop of the
// drawing (face area) and a number badge, today = red border, future = faint number.
export function MonthGrid({ year, month, byDay, today, onDayPress, landingDay }: Props) {
  const { width } = useWindowDimensions();
  const cell = (width - space.gutter * 2 - GAP * 6) / 7;
  const lead = mondayIndex(new Date(year, month, 1));
  const days = daysInMonth(year, month);

  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(<View key={`l${i}`} style={{ width: cell }} />);
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    const iso = isoDay(year, month, d);
    const mem = byDay.get(iso);
    cells.push(
      <Day
        key={d}
        day={d}
        size={cell}
        memory={mem}
        today={isSameDay(date, today)}
        future={date > today}
        onPress={onDayPress}
        landing={iso === landingDay}
      />,
    );
  }

  return (
    <View>
      <View style={styles.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.weekday, { width: cell }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>{cells}</View>
    </View>
  );
}

function Day({
  day,
  size,
  memory,
  today,
  future,
  onPress,
  landing = false,
}: {
  day: number;
  size: number;
  memory?: Memory;
  today: boolean;
  future: boolean;
  onPress?: (m: Memory) => void;
  landing?: boolean;
}) {
  const h = size * 1.15;

  if (future) {
    return (
      <View style={[styles.day, { width: size, height: h, opacity: 0.3 }]}>
        <Text style={styles.num}>{day}</Text>
      </View>
    );
  }

  if (!memory) {
    return (
      <View
        style={[
          styles.day,
          { width: size, height: h, backgroundColor: colors.empty },
          today && { borderWidth: 2, borderColor: colors.red },
        ]}>
        <Text style={styles.num}>{day}</Text>
      </View>
    );
  }

  if (landing) return <LandingDay day={day} size={size} memory={memory} />;

  const edge = today ? colors.redEdge : colors.edgeSoft;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${day}, ${memory.note}`}
      onPressIn={() => Haptics.selectionAsync()}
      onPress={() => onPress?.(memory)}
      style={{ width: size, height: h + 3 }}>
      {({ pressed }) => (
        <>
          <View style={[StyleSheet.absoluteFill, { top: 3, borderRadius: radius.day, backgroundColor: edge }]} />
          <View style={[styles.day, styles.filled, { height: h, transform: [{ translateY: pressed ? 2 : 0 }] }]}>
            <Image
              source={memory.drawing}
              contentFit="cover"
              contentPosition="top"
              style={[StyleSheet.absoluteFill, styles.crop]}
            />
            {today ? <View style={[StyleSheet.absoluteFill, styles.todayRing]} /> : null}
            <View style={styles.badge}>
              <Text style={styles.badgeNum}>{day}</Text>
            </View>
          </View>
        </>
      )}
    </Pressable>
  );
}

const LAND_DELAY_MS = 450; // after the sheet has slid up
const LAND_MS = 700;
const GLOW_MS = 1000;
const GLOW_TIMES = 2;

/**
 * Today's first drawing arriving, kept soft: the empty pit waits, the filled day fades in
 * while it grows a little into place, then a light red ring breathes twice.
 */
function LandingDay({ day, size, memory }: { day: number; size: number; memory: Memory }) {
  const h = size * 1.15;
  const land = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    land.set(withDelay(LAND_DELAY_MS, withTiming(1, { duration: LAND_MS, easing: Easing.out(Easing.cubic) })));
    glow.set(
      withDelay(
        LAND_DELAY_MS + LAND_MS * 0.6,
        withRepeat(withTiming(1, { duration: GLOW_MS, easing: Easing.inOut(Easing.sin) }), GLOW_TIMES * 2, true),
      ),
    );
  }, [land, glow]);

  const cellStyle = useAnimatedStyle(() => ({
    opacity: land.value,
    transform: [{ scale: interpolate(land.value, [0, 1], [0.8, 1]) }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 0.45]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.06]) }],
  }));

  return (
    <View style={{ width: size, height: h + 3, zIndex: 1 }}>
      {/* The empty pit it lands in. */}
      <View style={[styles.day, styles.pit, { height: h }]} />
      <Animated.View pointerEvents="none" style={[styles.glow, { height: h + 8 }, glowStyle]} />
      <Animated.View style={[StyleSheet.absoluteFill, cellStyle]}>
        <View
          style={[StyleSheet.absoluteFill, { top: 3, borderRadius: radius.day, backgroundColor: colors.redEdge }]}
        />
        <View style={[styles.day, styles.filled, { height: h }]}>
          <Image
            source={memory.drawing}
            contentFit="cover"
            contentPosition="top"
            style={[StyleSheet.absoluteFill, styles.crop]}
          />
          <View style={[StyleSheet.absoluteFill, styles.todayRing]} />
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>{day}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, paddingBottom: 4 },
  weekday: { fontFamily: fonts.bold, fontSize: 11, textAlign: 'center', opacity: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: ROW_GAP, marginTop: 4 },
  day: { borderRadius: radius.day },
  filled: { backgroundColor: colors.surface, overflow: 'hidden' },
  // Zoom on the upper part of the drawing, where faces usually are.
  crop: { transform: [{ scale: 1.35 }], transformOrigin: '50% 18%' },
  todayRing: { borderRadius: radius.day, borderWidth: 2, borderColor: colors.red },
  pit: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.empty,
    borderWidth: 2,
    borderColor: colors.red,
  },
  glow: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: -4,
    borderRadius: radius.day + 4,
    borderWidth: 2,
    borderColor: colors.red,
  },
  num: { fontFamily: fonts.heavy, fontSize: 11, position: 'absolute', top: 4, left: 6 },
  badge: {
    position: 'absolute',
    top: 3,
    left: 3,
    backgroundColor: colors.badge,
    borderRadius: 7,
    paddingHorizontal: 4,
  },
  badgeNum: { fontFamily: fonts.heavy, fontSize: 11, lineHeight: 15 },
});
