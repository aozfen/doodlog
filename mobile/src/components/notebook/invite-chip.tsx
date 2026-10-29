import { StyleSheet, View } from 'react-native';

import { Icon, Raised, Text } from '@/components/ui';
import { initialOf } from '@/lib/text';
import { colors, depth, fonts } from '@/theme';

// Invite button: the owner's initial next to an empty dashed seat.
export function InviteChip({ label, ownerName, onPress }: { label: string; ownerName: string; onPress: () => void }) {
  return (
    <Raised
      onPress={onPress}
      accessibilityLabel={label}
      color={colors.chip}
      edgeColor={colors.chipEdge}
      depth={depth.small}
      radius={21}
      style={styles.chip}>
      <View style={styles.seats}>
        <View style={styles.seat}>
          <Text style={styles.initial}>{initialOf(ownerName)}</Text>
        </View>
        <View style={[styles.seat, styles.empty]}>
          <Icon name="plus" size={14} color={colors.dashedText} strokeWidth={2.5} />
        </View>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Raised>
  );
}

/** Shown instead of the chip after the user asked to be notified. Info only, so flat. */
export function WaitlistBadge() {
  return (
    <View style={styles.badge}>
      <Icon name="check" size={16} color={colors.ok} strokeWidth={2.5} />
      <Text style={styles.label}>Listedesin</Text>
    </View>
  );
}

const SEAT = 30;

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingLeft: 5, paddingRight: 14 },
  seats: { flexDirection: 'row' },
  seat: {
    width: SEAT,
    height: SEAT,
    borderRadius: SEAT / 2,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { marginLeft: -10, backgroundColor: colors.empty, borderStyle: 'dashed', borderColor: colors.dashed },
  initial: { fontFamily: fonts.heavy, fontSize: 12, color: colors.white },
  label: { fontFamily: fonts.heavy, fontSize: 13, color: colors.ink },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 42, paddingHorizontal: 12 },
});
