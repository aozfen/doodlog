import { StyleSheet, View } from 'react-native';

import { colors, depth, fonts } from '@/theme';

import { Icon, type IconName } from './icon';
import { Raised } from './raised';
import { Text } from './text';

type Props = {
  label: string;
  selected?: boolean;
  icon?: IconName;
  /** Down arrow: tag opens a picker. */ chevron?: boolean;
  onPress?: () => void;
};

// Filter / choice tag. Selected = dark, others = light raised.
export function Tag({ label, selected, icon, chevron, onPress }: Props) {
  const fg = selected ? colors.white : colors.ink;
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={label}
      color={selected ? colors.ink : colors.chip}
      topColor={selected ? colors.inkTop : colors.surfaceTop}
      edgeColor={selected ? colors.inkEdge : colors.chipEdge}
      depth={depth.small}
      radius={18}
      style={styles.face}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={16} color={fg} /> : null}
        <Text style={[styles.label, { color: fg }]}>{label}</Text>
        {chevron ? (
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Icon name="back" size={14} color={fg} opacity={0.6} strokeWidth={2.5} />
          </View>
        ) : null}
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  face: { height: 36, paddingHorizontal: 14, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.heavy, fontSize: 13 },
});
