import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

import { Icon } from './icon';

// Round check mark. `on` = filled with a check, off = empty ring (radio).
export function CheckDot({ on = true }: { on?: boolean }) {
  return (
    <View style={[styles.dot, on && styles.on]}>
      {on ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.5} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.radio,
    alignItems: 'center',
    justifyContent: 'center',
  },
  on: { backgroundColor: colors.ink, borderColor: colors.ink },
});
