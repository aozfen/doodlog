import { StyleSheet, View } from 'react-native';

import { colors, depth, radius } from '@/theme';

import { Icon, type IconName } from './icon';
import { Raised } from './raised';
import { Text } from './text';

// Small raised chip, e.g. the brush balance. Icon is red (the single accent).
export function Chip({ label, icon, onPress }: { label: string; icon?: IconName; onPress?: () => void }) {
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={label}
      color={colors.chip}
      edgeColor={colors.chipEdge}
      depth={depth.small}
      radius={radius.chip}
      style={styles.face}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={16} color={colors.red} /> : null}
        <Text variant="body" style={styles.label}>
          {label}
        </Text>
      </View>
    </Raised>
  );
}

// Round 42px icon button (back, share, more).
export function IconButton({ icon, onPress, label }: { icon: IconName; onPress?: () => void; label: string }) {
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={label}
      color={colors.chip}
      edgeColor={colors.chipEdge}
      depth={depth.small}
      radius={21}
      style={styles.icon}>
      <Icon name={icon} size={22} />
    </Raised>
  );
}

const styles = StyleSheet.create({
  face: { paddingVertical: 6, paddingLeft: 9, paddingRight: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  icon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});
