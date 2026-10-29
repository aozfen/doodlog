import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { MonthGrid } from '@/components/calendar/month-grid';
import { LegalLinks } from '@/components/paywall/legal-links';
import { Button, CheckDot, Flat, Icon, IconButton, Raised, Sheet, Sticker, Text, type IconName } from '@/components/ui';
import { PLAN_BRUSHES, PLAN_ORDER, PLANS, SHEET_SWAP_MS, type PlanId } from '@/constants';
import { comingSoon } from '@/lib/alerts';
import { useFloat, usePopIn } from '@/lib/animations';
import { parseIsoDay } from '@/lib/date';
import { colors, fonts, radius } from '@/theme';
import type { Memory, Picture } from '@/types';

import { Reveal, StepLayout, StepTitle } from './step-layout';

type ReadyProps = {
  memory: Memory;
  notebookName: string;
  /** Goes on to the paywall. */
  onContinue: () => void;
  onShare: () => void;
};

/**
 * The first drawing is in. "Kaydet" opens a sheet that shows it landing in the calendar,
 * so saving clearly happened first and the paywall after it never looks like its price.
 * Closing the sheet another way leaves a "Devam et" button behind.
 */
export function ReadyStep({ memory, notebookName, onContinue, onShare }: ReadyProps) {
  const pop = usePopIn(500, 210);
  const [saved, setSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const today = parseIsoDay(memory.date);
  const byDay = new Map([[memory.date, memory]]);

  const save = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setSheetOpen(true);
  };
  const next = () => {
    setSheetOpen(false);
    setTimeout(onContinue, SHEET_SWAP_MS);
  };

  return (
    <StepLayout
      foot={
        <>
          {saved ? (
            <Button label="Devam et" onPress={onContinue} />
          ) : (
            <Button icon="check" label="Kaydet" onPress={save} />
          )}
          <Button variant="secondary" size="m" icon="share" label="Hikayende paylaş" onPress={onShare} />
        </>
      }
      footOrder={4}>
      <Reveal order={0}>
        <StepTitle style={styles.centerTitle}>İlk anın hazır</StepTitle>
      </Reveal>
      <Animated.View style={pop}>
        <Flat style={styles.art}>
          <Sticker source={memory.drawing} style={{ width: 260, height: 260 }} />
        </Flat>
      </Animated.View>
      <Reveal order={3}>
        <Flat radius={18} style={styles.coverNote}>
          <Icon name="nb" size={22} color={colors.red} />
          <Text style={styles.coverText}>
            <Text style={styles.strong}>{notebookName}</Text> defterinin kapağı oldu.
          </Text>
        </Flat>
      </Reveal>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <View style={styles.savedHead}>
          <View style={styles.savedCheck}>
            <Icon name="check" size={18} color={colors.white} strokeWidth={2.5} />
          </View>
          <Text variant="sec" style={{ fontSize: 24, lineHeight: 28 }}>
            Takvimine eklendi
          </Text>
        </View>
        <Text variant="sub" style={styles.savedSub}>
          Takviminin ilk günü doldu. Her yeni anı bir günü daha doldurur.
        </Text>
        <View style={{ marginTop: 16 }}>
          <MonthGrid
            year={today.getFullYear()}
            month={today.getMonth()}
            byDay={byDay}
            today={today}
            landingDay={memory.date}
          />
        </View>
        <Button label="Yeni anılar çizelim" icon="brush" onPress={next} style={{ marginTop: 20 }} />
      </Sheet>
    </StepLayout>
  );
}

const BENEFITS: { icon: IconName; title: string; detail: string }[] = [
  { icon: 'brush', title: `Her ay ${PLAN_BRUSHES} fırça`, detail: '1 fırça = 1 çizim, ayda 50 anı' },
  { icon: 'share', title: 'Filigransız paylaşım', detail: 'Hikayende sadece çizimin görünür' },
  { icon: 'check', title: 'İstediğin an iptal', detail: 'App Store ayarlarından, tek dokunuş' },
];

/** Soft paywall: no free trial, the gift brushes are the trial. Closing it keeps them. */
export function PaywallStep({ drawing, title, onClose }: { drawing: Picture; title: string; onClose: () => void }) {
  const [plan, setPlan] = useState<PlanId>('yearly');
  const pop = usePopIn(500);
  // Floats once it has popped in, like the welcome stickers.
  const float = useFloat({ delay: 500, duration: 2600, distance: 6 });
  const chosen = PLANS[plan];

  return (
    <StepLayout
      foot={
        <>
          <Button
            label={`Abone ol · ${chosen.price}`}
            onPress={() => comingSoon(`${chosen.label} plan`, 'Yakında: App Store satın alma')}
          />
          <LegalLinks />
        </>
      }
      footOrder={PLAN_ORDER.length + 3}>
      {/* X sits on the drawing's row, so the plans fit above the fold. */}
      <View style={styles.payTop}>
        <Animated.View style={pop}>
          <Animated.View style={float}>
            <Sticker source={drawing} style={styles.payArt} />
          </Animated.View>
        </Animated.View>
        <View style={styles.close}>
          <IconButton icon="x" label="Kapat" onPress={onClose} />
        </View>
      </View>
      <Reveal order={0}>
        <StepTitle style={[styles.centerTitle, styles.payTitle]}>{title}</StepTitle>
        <Text variant="sub" style={styles.paySub}>
          İlk anın kaydedildi. Abone ol, her ay yenileri gelsin.
        </Text>
      </Reveal>

      <Reveal order={1}>
        <Flat radius={22} style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefit}>
              <Icon name={b.icon} size={20} color={colors.red} />
              <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text variant="sub">{b.detail}</Text>
              </View>
            </View>
          ))}
        </Flat>
      </Reveal>

      <View style={styles.plans}>
        {PLAN_ORDER.map((id, i) => {
          const p = PLANS[id];
          const on = id === plan;
          return (
            <Reveal key={id} order={i + 2}>
              <Raised
                onPress={() => setPlan(id)}
                accessibilityLabel={`${p.label}, ${p.price}`}
                radius={radius.option}
                style={[styles.plan, on && styles.planOn]}>
                <CheckDot on={on} />
                <View style={{ flex: 1 }}>
                  <View style={styles.planHead}>
                    <Text style={styles.planLabel}>{p.label}</Text>
                    {p.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{p.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  {p.note ? <Text variant="sub">{p.note}</Text> : null}
                </View>
                <Text style={styles.planPrice}>{p.price}</Text>
              </Raised>
            </Reveal>
          );
        })}
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  centerTitle: { fontSize: 40, lineHeight: 44, textAlign: 'center', paddingLeft: 8 },
  art: { marginTop: 16, height: 300, alignItems: 'center', justifyContent: 'center' },
  coverNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  coverText: { flex: 1, fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.ink },
  strong: { fontFamily: fonts.heavy },
  savedHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savedCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.ok,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedSub: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  payTop: { alignItems: 'center' },
  close: { position: 'absolute', right: 0, top: 0 },
  payArt: { width: 104, height: 104 },
  payTitle: { fontSize: 34, lineHeight: 38, marginTop: 6 },
  paySub: { textAlign: 'center', marginTop: 6, fontSize: 14, lineHeight: 20, paddingHorizontal: 12 },
  benefits: { gap: 10, marginTop: 16, paddingVertical: 14, paddingHorizontal: 16 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitTitle: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20, color: colors.ink },
  plans: { gap: 10, marginTop: 14 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  planOn: { borderColor: colors.ink },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 21, color: colors.ink },
  planPrice: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 21, color: colors.ink },
  badge: { backgroundColor: colors.red, borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
  badgeText: { fontFamily: fonts.heavy, fontSize: 11, lineHeight: 15, color: colors.white },
});
