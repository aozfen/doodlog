import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, depth as depths, opacity, radius as radii } from '@/theme';

type Props = {
  children?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Face color at the bottom of the gradient. */
  color?: string;
  /** Face color at the top of the gradient. */
  topColor?: string;
  /** Hard bottom edge color. */
  edgeColor?: string;
  depth?: number;
  radius?: number;
  /** Layout of the face (padding, min height, alignment). */
  style?: StyleProp<ViewStyle>;
  /** Outer layout (margins, width, flex). */
  containerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Faded and not tappable. */
  disabled?: boolean;
};

/**
 * 3D surface from TEMA.md: light top gradient + hard solid edge below, no blur.
 * Only tappable things are raised. On press the face moves down and the edge shrinks.
 * Children may overflow the face (stickers stick out of cards).
 */
export function Raised({
  children,
  onPress,
  onLongPress,
  color = colors.surface,
  topColor = colors.surfaceTop,
  edgeColor = colors.edge,
  depth = depths.card,
  radius = radii.card,
  style,
  containerStyle,
  accessibilityLabel,
  disabled = false,
}: Props) {
  const sink = depth - depths.pressed;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => Haptics.selectionAsync()}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[{ paddingBottom: depth }, disabled && { opacity: opacity.disabled }, containerStyle]}>
      {({ pressed }) => (
        <>
          <View style={[StyleSheet.absoluteFill, { top: depth, borderRadius: radius, backgroundColor: edgeColor }]} />
          {/* Gradient sits behind as its own layer: LinearGradient clips its children
              on iOS, and stickers must stick out of the card. */}
          <View style={[{ borderRadius: radius }, style, { transform: [{ translateY: pressed ? sink : 0 }] }]}>
            <LinearGradient colors={[topColor, color]} style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />
            {children}
          </View>
        </>
      )}
    </Pressable>
  );
}

/** Info card that is not tappable: flat surface with a thin border. */
export function Flat({
  children,
  style,
  radius = radii.card,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius },
        style,
      ]}>
      {children}
    </View>
  );
}
