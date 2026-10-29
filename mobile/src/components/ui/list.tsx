import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '@/theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

// Flat grouped list with hairline dividers (menus, settings).
export function ListGroup({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children);
  return (
    <View style={[styles.group, style]}>
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={styles.divider} /> : null}
          {c}
        </Fragment>
      ))}
    </View>
  );
}

type ItemProps = {
  label: string;
  detail?: string;
  icon?: IconName;
  left?: ReactNode;
  right?: ReactNode;
  /** Short value on the right, e.g. "21:00". */
  value?: string;
  valueColor?: string;
  /** Show a ">" arrow: the row opens another screen. */
  chevron?: boolean;
  danger?: boolean;
  onPress?: () => void;
};

export function ListItem({ label, detail, icon, left, right, value, valueColor, chevron, danger, onPress }: ItemProps) {
  const color = danger ? colors.red : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.empty }]}>
      {left ?? (icon ? <Icon name={icon} size={20} color={color} opacity={danger ? 1 : 0.65} /> : null)}
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {detail ? (
          <Text variant="sub" style={{ fontSize: 12, lineHeight: 16 }}>
            {detail}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.value, valueColor ? { color: valueColor, opacity: 1 } : null]}>{value}</Text>
      ) : null}
      {right}
      {chevron ? <Chevron /> : null}
    </Pressable>
  );
}

export function Chevron() {
  return (
    <View style={{ transform: [{ rotate: '180deg' }] }}>
      <Icon name="back" size={16} color={colors.chevron} strokeWidth={2.5} />
    </View>
  );
}

/** Small uppercase title above a group. */
export function Section({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ marginTop: 22 }, style]}>
      {title ? (
        <Text variant="label" style={{ marginHorizontal: 4, marginBottom: 8 }}>
          {title}
        </Text>
      ) : null}
      <ListGroup>{children}</ListGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 20,
    overflow: 'hidden',
  },
  divider: { height: 1.5, backgroundColor: colors.line },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 54,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
  value: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink, opacity: 0.55 },
});
