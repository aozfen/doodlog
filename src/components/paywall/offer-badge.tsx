import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon, Raised, Text } from '@/components/ui';
import { ART, EXIT_OFFER, routes } from '@/constants';
import { formatClock, useCountdown } from '@/hooks/use-countdown';
import { useOfferEndsAt, useUser } from '@/hooks/use-store';
import { colors, depth, fonts } from '@/theme';

/**
 * Full width red strip above the home "Bugün" card while the exit offer runs:
 * gift, discount, time left. Opens the offer. Gone when it ends or the user subscribes.
 */
export function OfferBadge() {
  const endsAt = useOfferEndsAt();
  const left = useCountdown(endsAt);
  const { subscriber } = useUser();
  if (subscriber || left === 0) return null;

  return (
    <Raised
      onPress={() => router.push(routes.offer)}
      accessibilityLabel={`${EXIT_OFFER.badge}, ${formatClock(left)} kaldı`}
      color={colors.red}
      topColor={colors.redTop}
      edgeColor={colors.redEdge}
      depth={depth.small}
      radius={18}
      containerStyle={styles.container}
      style={styles.face}>
      <Image source={ART.exitOffer} style={styles.gift} contentFit="contain" />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{EXIT_OFFER.badge} · sana özel</Text>
        <Text style={styles.clock}>{formatClock(left)} sonra biter</Text>
      </View>
      <View style={styles.chevron}>
        <Icon name="back" size={18} color={colors.white} strokeWidth={2.5} />
      </View>
    </Raised>
  );
}

const styles = StyleSheet.create({
  // Cards below bring their own top margin (36); pull them closer so the strip reads as theirs.
  container: { marginTop: 22, marginBottom: -18 },
  face: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14 },
  // The art has wide transparent margins, so it is drawn larger than it looks.
  gift: { width: 44, height: 44, marginVertical: -6 },
  title: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20, color: colors.white },
  clock: {
    fontFamily: fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
    opacity: 0.85,
    fontVariant: ['tabular-nums'],
  },
  chevron: { transform: [{ rotate: '180deg' }] },
});
