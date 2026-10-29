import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

/** Red gradient fill, used inside a progress track. */
export function ProgressFill({ style }: { style?: StyleProp<ViewStyle> }) {
  return <LinearGradient colors={[colors.redLight, colors.red]} style={[styles.fill, style]} />;
}

/**
 * 12px rounded track. Pass `value` (0-1) for a static bar, or `children`
 * for an animated fill (wrap ProgressFill in an Animated.View).
 */
export function ProgressBar({
  value,
  children,
  style,
}: {
  value?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.track, style]}>
      {children ?? <ProgressFill style={{ width: `${Math.round((value ?? 0) * 100)}%` }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 12, borderRadius: 6, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
});
