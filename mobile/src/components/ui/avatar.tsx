import { StyleSheet, View } from 'react-native';

import { initialOf } from '@/lib/text';
import { colors, depth, fonts } from '@/theme';

import { Icon } from './icon';
import { Raised } from './raised';
import { Text } from './text';

// Initial in a dark circle. With onPress it is raised (tappable), without it it is flat.
export function Avatar({
  name,
  size = 42,
  onPress,
  label,
}: {
  name: string;
  size?: number;
  onPress?: () => void;
  label?: string;
}) {
  // No name (skipped in onboarding): a person icon instead of an initial.
  const initial = name ? (
    <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initialOf(name)}</Text>
  ) : (
    <Icon name="me" size={size * 0.5} color={colors.white} />
  );
  const box = { width: size, height: size, alignItems: 'center' as const, justifyContent: 'center' as const };

  if (!onPress) {
    return <View style={[box, { borderRadius: size / 2, backgroundColor: colors.ink }]}>{initial}</View>;
  }
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={label ?? (name || 'Profil')}
      color={colors.ink}
      topColor={colors.inkTop}
      edgeColor={colors.inkEdge}
      depth={depth.small}
      radius={size / 2}
      style={box}>
      {initial}
    </Raised>
  );
}

const styles = StyleSheet.create({
  initial: { fontFamily: fonts.heavy, color: colors.white },
});
