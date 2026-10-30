import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { KindOption } from '@/components/notebook/kind-option';
import { Button, Field, Icon, IconButton, Sticker, Text, TextButton } from '@/components/ui';
import {
  GIFT_BRUSHES,
  NOTEBOOK_KINDS,
  ONBOARDING_COPY,
  ONBOARDING_KINDS,
  SAMPLE_DRAWINGS,
  SAMPLE_PHOTOS,
  type OnboardingKind,
  type SampleKey,
} from '@/constants';
import { comingSoon } from '@/lib/alerts';
import { useFadeUp, useFloat } from '@/lib/animations';
import { colors, fonts, space } from '@/theme';

import { Reveal, StepLayout, StepTitle } from './step-layout';

const NAME_MAX = 30;

// Loose sticker pile on the welcome step, one per kind of notebook.
// Order is the entrance order: top left, top right, bottom left, bottom right.
const PILE: { art: SampleKey; style: ViewStyle; rotate: string }[] = [
  { art: 'couple01', style: { width: 200, height: 200, left: 10, top: 10 }, rotate: '-6deg' },
  { art: 'dog01', style: { width: 130, height: 130, right: 24, top: 30 }, rotate: '8deg' },
  { art: 'self01', style: { width: 130, height: 130, left: 30, top: 210 }, rotate: '5deg' },
  { art: 'self05', style: { width: 170, height: 170, right: 10, top: 180 }, rotate: '-4deg' },
];

const RISE_MS = 550;
const RISE_GAP_MS = 250;
const FIRST_DELAY_MS = 200;
// Text comes in while the last sticker settles, the buttons right after.
const TEXT_DELAY_MS = FIRST_DELAY_MS + (PILE.length - 1) * RISE_GAP_MS + 250;
const TEXT_GAP_MS = 150;

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const titleIn = useFadeUp(TEXT_DELAY_MS);
  const subIn = useFadeUp(TEXT_DELAY_MS + TEXT_GAP_MS);
  const footIn = useFadeUp(TEXT_DELAY_MS + TEXT_GAP_MS * 2);
  return (
    <StepLayout
      foot={
        <Animated.View style={[styles.welcomeFoot, footIn]}>
          <Button label="Başla" onPress={onNext} />
          {/* No sign up: the account is made silently. This only restores an old one. */}
          <TextButton label="Zaten hesabın var mı? Giriş yap" onPress={() => comingSoon('Giriş yap')} />
        </Animated.View>
      }>
      <View style={styles.pile}>
        {PILE.map(({ art, style, rotate }, i) => (
          <FloatingSticker key={art} art={art} index={i} style={style} rotate={rotate} />
        ))}
      </View>
      <Animated.View style={titleIn}>
        <StepTitle style={styles.welcomeTitle}>Anıların çizime dönüşsün</StepTitle>
      </Animated.View>
      <Animated.View style={subIn}>
        <Text variant="sub" style={styles.welcomeSub}>
          Bir fotoğraf seç, gerisini biz çizelim.
        </Text>
      </Animated.View>
    </StepLayout>
  );
}

/**
 * Welcome sticker: rises from below one after another, then floats slowly up and down.
 * Driven by shared values, not an `entering` animation: the step itself fades in with
 * `entering`, and Reanimated skips nested entering animations, so all stickers popped at once.
 */
type FloatingProps = { art: SampleKey; index: number; style: ViewStyle; rotate: string };

function FloatingSticker({ art, index, style, rotate }: FloatingProps) {
  const rise = useSharedValue(0);
  const delay = FIRST_DELAY_MS + index * RISE_GAP_MS;

  useEffect(() => {
    rise.set(withDelay(delay, withTiming(1, { duration: RISE_MS, easing: Easing.out(Easing.back(1.6)) })));
  }, [rise, delay]);
  // Different speed per sticker, so they never move in step.
  const floatStyle = useFloat({
    delay: delay + RISE_MS,
    duration: 2400 + index * 450,
    direction: index % 2 ? -1 : 1,
  });

  const riseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rise.value, [0, 0.4], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(rise.value, [0, 1], [90, 0]) }],
  }));

  return (
    <Animated.View style={[styles.pileItem, style, riseStyle]}>
      <View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Animated.View style={[StyleSheet.absoluteFill, floatStyle]}>
          <Sticker source={SAMPLE_DRAWINGS[art]} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

type KindProps = {
  kind: OnboardingKind | null;
  name: string;
  onKind: (kind: OnboardingKind) => void;
  onName: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function KindStep({ kind, name, onKind, onName, onBack, onNext }: KindProps) {
  const { width } = useWindowDimensions();
  const cell = (width - space.gutter * 2 - space.l) / 2;
  const ready = kind !== null && name.trim() !== '';

  return (
    <StepLayout
      foot={<Button label="Devam" disabled={!ready} onPress={onNext} />}
      footOrder={ONBOARDING_KINDS.length + 2}>
      <BackRow onBack={onBack} />
      <Reveal order={0}>
        <StepTitle style={{ marginTop: 14 }}>İlk defterin kimin için?</StepTitle>
        <Text variant="sub" style={{ marginTop: 8 }}>
          Sonra istediğin kadar defter açabilirsin.
        </Text>
      </Reveal>

      <View style={styles.kinds}>
        {ONBOARDING_KINDS.map((k, i) => (
          <Reveal key={k} order={i + 1}>
            <KindOption
              label={ONBOARDING_COPY[k].label}
              art={ONBOARDING_COPY[k].sample}
              selected={k === kind}
              width={cell}
              height={150}
              onPress={() => onKind(k)}
            />
          </Reveal>
        ))}
      </View>

      {/* Fades up when a kind is picked: the reveal runs on mount. */}
      {kind ? (
        <Reveal>
          <Text variant="label" style={{ marginTop: 22 }}>
            Defterin adı
          </Text>
          <Field
            value={name}
            onChangeText={onName}
            placeholder={NOTEBOOK_KINDS[kind].namePlaceholder}
            accessibilityLabel="Defterin adı"
            maxLength={NAME_MAX}
            autoFocus={!NOTEBOOK_KINDS[kind].defaultName}
            returnKeyType="done"
            onSubmitEditing={() => ready && onNext()}
            style={{ marginTop: 8 }}
          />
          <Text variant="sub" style={{ marginTop: 8, fontSize: 12 }}>
            İstersen değiştir. Başka bir şey için kendi adını yaz.
          </Text>
        </Reveal>
      ) : null}
    </StepLayout>
  );
}

type PhotoProps = {
  kind: OnboardingKind;
  /** Missing on a retry: the notebook already exists, so there is no way back. */
  onBack?: () => void;
  onPick: () => void;
};

export function PhotoStep({ kind, onBack, onPick }: PhotoProps) {
  const retry = !onBack;
  const copy = ONBOARDING_COPY[kind];
  const photo = SAMPLE_PHOTOS[copy.sample];

  return (
    <StepLayout
      foot={
        <>
          <Button icon="img" label="Fotoğraf seç" onPress={onPick} />
          <Text variant="sub" style={{ textAlign: 'center', fontSize: 12 }}>
            Sadece seçtiğin fotoğrafı görürüz.
          </Text>
        </>
      }
      footOrder={5}>
      {onBack ? <BackRow onBack={onBack} /> : null}
      {retry ? null : (
        <Reveal order={0} style={styles.gift}>
          <Icon name="brush" size={15} color={colors.white} />
          <Text style={styles.giftText}>{GIFT_BRUSHES} fırça hediye</Text>
        </Reveal>
      )}
      <Reveal order={1}>
        <StepTitle style={{ marginTop: 14 }}>{retry ? 'Bir daha deneyelim' : 'İlk anını çizelim'}</StepTitle>
        <Text variant="sub" style={styles.lead}>
          {copy.ask}
        </Text>
      </Reveal>

      {/* Before and after: the photo comes in, then what it becomes. */}
      <View style={styles.sample}>
        {photo ? (
          <Reveal order={2} style={styles.samplePhotoBox}>
            <Image source={photo} style={styles.samplePhoto} contentFit="cover" />
          </Reveal>
        ) : null}
        <Reveal order={3} style={[styles.sampleDrawing, !photo && styles.sampleAlone]}>
          <Sticker source={SAMPLE_DRAWINGS[copy.sample]} style={StyleSheet.absoluteFill} />
        </Reveal>
      </View>

      <Reveal order={4} style={styles.tip}>
        <Icon name="check" size={18} color={colors.red} />
        <Text style={styles.tipText}>{copy.tip}</Text>
      </Reveal>
    </StepLayout>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <IconButton icon="back" label="Geri" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  pile: { height: 380, marginHorizontal: -space.gutter },
  pileItem: { position: 'absolute' },
  welcomeTitle: { fontSize: 48, lineHeight: 52, textAlign: 'center', paddingLeft: 8 },
  welcomeFoot: { gap: space.m },
  welcomeSub: { textAlign: 'center', marginTop: 10, fontSize: 15, lineHeight: 22 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: space.l, marginTop: 26 },
  gift: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 18,
    backgroundColor: colors.red,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  giftText: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 17, color: colors.white },
  lead: { marginTop: 8, fontSize: 15, lineHeight: 22 },
  sample: { height: 300 },
  samplePhotoBox: { position: 'absolute', left: 10, top: 24, width: 170, height: 210 },
  samplePhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 5,
    borderColor: colors.white,
    transform: [{ rotate: '-6deg' }],
  },
  sampleDrawing: { position: 'absolute', right: -6, top: 60, width: 220, height: 220 },
  sampleAlone: { right: undefined, alignSelf: 'center', top: 30, width: 250, height: 250 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  tipText: { flex: 1, fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.ink },
});
