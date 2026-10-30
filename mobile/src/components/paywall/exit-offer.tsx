import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Reveal, StepLayout, StepTitle } from '@/components/onboarding/step-layout';
import { Button, Flat, Icon, IconButton, Sticker, Text } from '@/components/ui';
import { ART, EXIT_OFFER, PLAN_BRUSHES } from '@/constants';
import { formatClock, useCountdown } from '@/hooks/use-countdown';
import { useOfferEndsAt } from '@/hooks/use-store';
import { comingSoon } from '@/lib/alerts';
import { useFloat, usePopIn } from '@/lib/animations';
import { startOffer } from '@/store';
import { colors, fonts } from '@/theme';

import { LegalLinks } from './legal-links';

/**
 * One-time yearly discount. First shown when the onboarding paywall is closed, then
 * reachable from the home badge until it ends. The clock starts once and never resets.
 */
export function ExitOffer({ onClose }: { onClose: () => void }) {
  const endsAt = useOfferEndsAt();
  const left = useCountdown(endsAt);
  const pop = usePopIn(550);
  // The gift floats once it has popped in; the badge stays put on top.
  const float = useFloat({ delay: 550, duration: 2600, distance: 7 });

  useEffect(() => {
    startOffer(EXIT_OFFER.hours);
  }, []);

  return (
    <StepLayout
      foot={
        <>
          <Button
            label={`Teklifi al · ${EXIT_OFFER.price}`}
            onPress={() => comingSoon('Özel teklif', 'Yakında: App Store satın alma')}
          />
          <LegalLinks />
        </>
      }
      footOrder={5}>
      <View style={styles.top}>
        <IconButton icon="x" label="Kapat" onPress={onClose} />
      </View>
      <View style={styles.body}>
        <Animated.View style={[styles.art, pop]}>
          <Animated.View style={[StyleSheet.absoluteFill, float]}>
            <Sticker source={ART.exitOffer} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{EXIT_OFFER.badge}</Text>
          </View>
        </Animated.View>

        <Reveal order={0}>
          <StepTitle style={styles.title}>Gitmeden önce, sana özel</StepTitle>
          <Text variant="sub" style={styles.sub}>
            Yıllık plan bir defaya mahsus daha uygun.
          </Text>
        </Reveal>

        {/* The old prices stay readable, so the drop is clear. */}
        <Reveal order={1} style={styles.ladder}>
          {EXIT_OFFER.was.map((w, i) => (
            <View key={w.price} style={styles.ladderItem}>
              {i > 0 ? <Text style={styles.arrow}>›</Text> : null}
              <View style={{ alignItems: 'center' }}>
                <Struck>{w.price}</Struck>
                <Text variant="sub" style={styles.wasLabel}>
                  {w.label}
                </Text>
              </View>
            </View>
          ))}
        </Reveal>

        <Reveal order={2} style={{ alignItems: 'center' }}>
          <Text style={styles.price}>{EXIT_OFFER.price}</Text>
          <Text style={styles.saving}>{EXIT_OFFER.saving}</Text>
        </Reveal>

        <Reveal order={3}>
          <Flat radius={18} style={styles.timer}>
            <Icon name="cal" size={18} color={colors.red} />
            <Text style={styles.timerText}>Teklif bitiyor · {formatClock(left)}</Text>
          </Flat>
        </Reveal>

        <Reveal order={4}>
          <Text variant="sub" style={styles.same}>
            Aynı plan: her ay {PLAN_BRUSHES} fırça, filigransız paylaşım, istediğin an iptal.
          </Text>
        </Reveal>
      </View>
    </StepLayout>
  );
}

/** Old price with a hand-drawn looking red line across. */
function Struck({ children }: { children: string }) {
  return (
    <View>
      <Text style={styles.was}>{children}</Text>
      <View style={styles.strike} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  body: { flex: 1, justifyContent: 'center', paddingBottom: 16 },
  art: { width: 170, height: 170, alignSelf: 'center' },
  badge: {
    position: 'absolute',
    right: -34,
    bottom: 4,
    backgroundColor: colors.red,
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
    transform: [{ rotate: '-6deg' }],
  },
  badgeText: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 21, color: colors.white },
  title: { fontSize: 40, lineHeight: 44, textAlign: 'center', paddingLeft: 8, marginTop: 14 },
  sub: { textAlign: 'center', marginTop: 6, fontSize: 14, lineHeight: 20 },
  ladder: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  ladderItem: { flexDirection: 'row', alignItems: 'flex-start' },
  arrow: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 28, color: colors.inkMuted, marginHorizontal: 14 },
  was: { fontFamily: fonts.heavy, fontSize: 22, lineHeight: 28, color: colors.inkMuted },
  strike: {
    position: 'absolute',
    left: -4,
    right: -4,
    top: 13,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.red,
    transform: [{ rotate: '-8deg' }],
  },
  wasLabel: { fontSize: 11, lineHeight: 14, marginTop: 2 },
  price: {
    fontFamily: fonts.heavy,
    fontSize: 44,
    lineHeight: 54,
    letterSpacing: -0.9,
    color: colors.ink,
    marginTop: 8,
  },
  saving: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20, color: colors.red },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
  },
  timerText: {
    fontFamily: fonts.heavy,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  same: { textAlign: 'center', marginTop: 14, fontSize: 12, lineHeight: 17, paddingHorizontal: 12 },
});
