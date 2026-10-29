// When the first drawing goes wrong: it takes too long, or it fails.
// Design: design/a-onboarding.html (10, 12).
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, fonts } from '@/theme';
import type { Picture } from '@/types';

import { Reveal, StepLayout, StepTitle } from './step-layout';

type SlowProps = { status: ReactNode; onHome: () => void; onStay: () => void };

/** Past LONG_WAIT_MS: waiting is optional, the drawing finishes in the background. */
export function SlowStep({ status, onHome, onStay }: SlowProps) {
  return (
    <StepLayout
      foot={
        <>
          <Button label="Ana sayfaya geç" onPress={onHome} />
          <Button variant="secondary" size="m" label="Burada bekle" onPress={onStay} />
        </>
      }
      footOrder={2}>
      {status}
      <Reveal order={0}>
        <StepTitle style={{ marginTop: 70 }}>Biraz uzun sürüyor</StepTitle>
      </Reveal>
      <Reveal order={1}>
        <Text variant="sub" style={styles.lead}>
          Çizimini özenle yapıyoruz. Beklemek zorunda değilsin, bitince haber vereceğiz.
        </Text>
      </Reveal>
    </StepLayout>
  );
}

type FailedProps = { photo?: Picture; drawing: Picture; onRetry: () => void; onOtherPhoto: () => void };

/**
 * The drawing failed (timeout, service error). Any photo can be drawn, so the copy never
 * blames the photo: same photo again is the first choice. The brush is back, no gift.
 */
export function FailedStep({ photo, drawing, onRetry, onOtherPhoto }: FailedProps) {
  return (
    <StepLayout
      foot={
        <>
          <Button icon="redo" label="Tekrar dene" onPress={onRetry} />
          <Button variant="secondary" size="m" icon="img" label="Başka fotoğraf seç" onPress={onOtherPhoto} />
        </>
      }
      footOrder={2}>
      <Reveal order={0} style={styles.photoBox}>
        {/* Faded and tilted: the photo that is still waiting for its drawing. */}
        <Image source={photo ?? drawing} style={styles.photo} contentFit={photo ? 'cover' : 'contain'} />
        <View style={styles.gift}>
          <Text style={styles.giftText}>Fırçan iade edildi</Text>
        </View>
      </Reveal>
      <Reveal order={1}>
        <StepTitle style={styles.title}>Bu sefer olmadı</StepTitle>
        <Text variant="sub" style={styles.centerSub}>
          Çizim yarıda kaldı, bazen oluyor.{'\n'}Aynı fotoğrafla bir daha deneyebilirsin.
        </Text>
      </Reveal>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  lead: { marginTop: 10, fontSize: 15, lineHeight: 22 },
  photoBox: { width: 170, height: 200, alignSelf: 'center', marginTop: 40 },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 5,
    borderColor: colors.white,
    opacity: 0.6,
    transform: [{ rotate: '-4deg' }],
  },
  gift: {
    position: 'absolute',
    right: -34,
    bottom: -12,
    backgroundColor: colors.red,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  giftText: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 17, color: colors.white },
  title: { fontSize: 44, lineHeight: 48, textAlign: 'center', paddingLeft: 8, marginTop: 34 },
  centerSub: { textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 20 },
});
