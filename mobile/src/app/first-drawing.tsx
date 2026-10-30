import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PaywallStep, ReadyStep } from '@/components/onboarding/finish-steps';
import { ONBOARDING_COPY, isOnboardingKind, routes } from '@/constants';
import { useDrawJob, useNotebooks, useTodayMemory } from '@/hooks/use-store';
import { drawings } from '@/mock';
import { colors } from '@/theme';

// The end of onboarding for those who went home before the first drawing landed.
// Home opens it once the drawing is in: first the drawing ("İlk anın hazır"),
// then the paywall they skipped. Closing the paywall leads to the one-time offer.
export default function FirstDrawingScreen() {
  const [step, setStep] = useState<'ready' | 'paywall'>('ready');
  const job = useDrawJob();
  const notebook = useNotebooks().find((n) => n.id === job?.notebookId);
  const copy = ONBOARDING_COPY[notebook && isOnboardingKind(notebook.kind) ? notebook.kind : 'partner'];
  const drawing = job?.drawing ?? drawings[copy.sample];
  const memory = useTodayMemory();

  return (
    <View style={styles.root}>
      <Animated.View
        key={step}
        entering={FadeIn.duration(260)}
        exiting={FadeOut.duration(160)}
        style={StyleSheet.absoluteFill}>
        {step === 'ready' && memory ? (
          <ReadyStep
            memory={memory}
            notebookName={notebook?.name ?? ''}
            onContinue={() => setStep('paywall')}
            onShare={() => router.push(routes.share(memory.id))}
          />
        ) : (
          <PaywallStep drawing={drawing} title={copy.paywallTitle} onClose={() => router.replace(routes.offer)} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
