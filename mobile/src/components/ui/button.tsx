import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, depth, radius } from '@/theme';

import { Icon, type IconName } from './icon';
import { Raised } from './raised';
import { Text } from './text';

type Props = {
  /** Leave empty for a square 56px icon button (needs `icon` and `accessibilityLabel`). */
  label?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  /** primary = dark, secondary = light, danger = red */
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: IconName;
  /** l = full width 56px, m = full width 48px (secondary actions in sheets), s = small inline pill */
  size?: 'l' | 'm' | 's';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

// Full width 56px pill (size l) or small inline pill (size s, like "Bugünü çiz").
const LOOK = {
  primary: { color: colors.ink, top: colors.inkTop, edge: colors.inkEdge, fg: colors.white },
  secondary: { color: colors.secondary, top: colors.surfaceTop, edge: colors.edgeSoft, fg: colors.ink },
  danger: { color: colors.red, top: colors.redTop, edge: colors.redEdge, fg: colors.white },
};

export function Button({
  label,
  accessibilityLabel,
  onPress,
  variant = 'primary',
  icon,
  size = 'l',
  style,
  disabled,
}: Props) {
  const look = LOOK[variant];
  const big = size !== 's'; // full width
  const square = !label;

  return (
    <Raised
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel ?? label}
      color={look.color}
      topColor={look.top}
      edgeColor={look.edge}
      depth={size === 'l' ? depth.button : 4}
      radius={big ? radius.button : 22}
      containerStyle={[square ? null : big ? { alignSelf: 'stretch' } : { alignSelf: 'center' }, style]}
      style={square ? styles.square : big ? [styles.big, size === 'm' && { height: 48 }] : styles.small}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={big ? 20 : 16} color={look.fg} /> : null}
        {label ? (
          <Text variant="button" color={look.fg} style={!big && { fontSize: 14 }}>
            {label}
          </Text>
        ) : null}
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  square: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  big: { height: 56, alignItems: 'center', justifyContent: 'center' },
  small: { paddingVertical: 10, paddingHorizontal: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
