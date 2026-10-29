import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DrawingStatus } from '@/components/onboarding/drawing-status';
import { PaywallStep, ReadyStep } from '@/components/onboarding/finish-steps';
import { KindStep, PhotoStep, WelcomeStep } from '@/components/onboarding/intro-steps';
import { FailedStep, SlowStep } from '@/components/onboarding/problem-steps';
import { GoalStep, NameStep, ReminderStep, WaitStep } from '@/components/onboarding/question-steps';
import { ExitOffer } from '@/components/paywall/exit-offer';
import {
  DEFAULT_GOAL,
  DEFAULT_REMINDER,
  EVENTS,
  LONG_WAIT_MS,
  NOTEBOOK_KINDS,
  ONBOARDING_COPY,
  routes,
  type OnboardingKind,
} from '@/constants';
import { track } from '@/lib/analytics';
import { pickPhoto as pickFromGallery } from '@/lib/photos';
import { ensureNotificationPermission, scheduleReminders } from '@/lib/notifications';
import { useDrawJob } from '@/hooks/use-store';
import {
  drawings,
  finishOnboarding,
  setPaywallDue,
  getTodayMemory,
  photos,
  startFirstDrawing,
  startJournal,
} from '@/mock';
import { colors } from '@/theme';
import type { Goal } from '@/types';

type Step =
  | 'welcome'
  | 'kind'
  | 'photo'
  | 'name'
  | 'goal'
  | 'reminder'
  | 'wait'
  | 'slow'
  | 'failed'
  | 'ready'
  | 'paywall'
  | 'offer';

/** Steps that only wait for the drawing: they move on by themselves when it ends. */
const WAITING: Step[] = ['wait', 'slow'];

// Labels on the drawing status, one per question, so it feels like it moves on.
const STATUS_LABEL: Partial<Record<Step, string>> = {
  name: 'Çiziliyor…',
  goal: 'Çizgiler atılıyor…',
  reminder: 'Neredeyse bitti…',
};

// First launch. Design: design/a-onboarding.html.
// The notebook kind picked first personalizes every later step. Name, goal and
// reminder are asked while the first drawing is made. No sign up screen.
export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>('welcome');
  const [kind, setKind] = useState<OnboardingKind | null>(null);
  const [notebookName, setNotebookName] = useState('');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<Goal>(DEFAULT_GOAL);
  const [time, setTime] = useState(DEFAULT_REMINDER);
  /** undefined = not asked yet. */
  const [reminderAt, setReminderAt] = useState<string | null | undefined>(undefined);
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [paywallSeen, setPaywallSeen] = useState(false);
  /** "Burada bekle" was tapped: do not offer to leave again. */
  const [stayed, setStayed] = useState(false);
  const progress = useSharedValue(0);

  // The drawing lives in the store (the backend in the real app), not in this screen.
  const job = useDrawJob();
  const drawn = job?.status === 'done';
  const failed = job?.status === 'failed';
  const copy = kind ? ONBOARDING_COPY[kind] : null;

  // The drawing ended while only waiting for it: move on (state adjusted during render).
  const [seenStatus, setSeenStatus] = useState(job?.status);
  if (job?.status !== seenStatus) {
    setSeenStatus(job?.status);
    if (WAITING.includes(step) && (drawn || failed)) setStep(drawn ? 'ready' : 'failed');
  }

  useEffect(() => {
    if (failed) cancelAnimation(progress);
  }, [failed, progress]);

  // Waiting too long: offer to go home instead.
  useEffect(() => {
    if (step !== 'wait' || stayed || job?.status !== 'drawing') return;
    const id = setTimeout(() => setStep('slow'), Math.max(0, job.startedAt + LONG_WAIT_MS - Date.now()));
    return () => clearTimeout(id);
  }, [step, stayed, job]);

  useEffect(() => {
    track(EVENTS.onboardingStep, { step });
  }, [step]);

  useEffect(() => () => cancelAnimation(progress), [progress]);

  const pickKind = (next: OnboardingKind) => {
    // Keep a name the user typed, replace a prefilled one.
    if (!kind || notebookName === NOTEBOOK_KINDS[kind].defaultName) setNotebookName(NOTEBOOK_KINDS[next].defaultName);
    setKind(next);
  };

  // The picked photo is drawn in the background while the questions are asked.
  // A retry (after a failure) keeps the notebook and skips the questions already answered.
  // Developer only: `skip` uses the sample photo and drawing, without the gallery or the server.
  const pickPhoto = async (skip = false) => {
    if (!kind) return;
    const sample = ONBOARDING_COPY[kind].sample;
    const photo = skip ? (photos[sample] ?? drawings[sample]) : await pickFromGallery();
    if (!photo) return;
    const retry = notebookId !== null;
    const id = notebookId ?? startJournal(notebookName.trim(), kind).id;
    setNotebookId(id);
    const started = startFirstDrawing(id, photo, skip ? drawings[sample] : undefined);
    progress.set(0);
    progress.set(withTiming(1, { duration: started.endsAt - started.startedAt, easing: Easing.inOut(Easing.quad) }));
    setStayed(false);
    setStep(!retry ? 'name' : reminderAt === undefined ? 'reminder' : 'wait');
  };

  /** Where to go once the questions run out. */
  const afterQuestions = (): Step => (drawn ? 'ready' : failed ? 'failed' : 'wait');

  const finish = (reminder: string | null) => {
    finishOnboarding({ name: name.trim(), goal, reminderAt: reminder });
    if (reminder) scheduleReminders(goal, reminder);
    track(EVENTS.onboardingDone, { kind: kind ?? '', goal, reminder: reminder !== null });
    // Home may already sit under onboarding (restart from settings, redirect on launch).
    // dismissTo goes back to it instead of stacking a second home that can be swiped back to.
    router.dismissTo(routes.home);
  };

  // The reminder is asked during the drawing. If the drawing wins, it moves after the paywall.
  const afterGoal = () => setStep(drawn || failed ? afterQuestions() : 'reminder');
  // "Hatırlat" opens the system prompt right away, while the reason is on screen.
  // A "no" there counts as no reminder.
  const answerReminder = async (wanted: string | null) => {
    const answer = wanted && (await ensureNotificationPermission()) ? wanted : null;
    setReminderAt(answer);
    if (paywallSeen) finish(answer);
    else setStep(afterQuestions());
  };
  // Closing the paywall shows the one-time offer, closing that moves on.
  const closePaywall = () => {
    setPaywallSeen(true);
    setStep('offer');
  };
  const closeOffer = () => {
    if (reminderAt === undefined) setStep('reminder');
    else finish(reminderAt);
  };

  const memory = drawn ? getTodayMemory() : undefined;
  // The paywall shows the user's own drawing; the sample stands in only if there is none.
  const paywallDrawing = memory?.drawing ?? job?.drawing ?? (copy ? drawings[copy.sample] : undefined);

  const status =
    copy && !paywallSeen ? (
      <DrawingStatus
        photo={photos[copy.sample]}
        drawing={drawings[copy.sample]}
        progress={progress}
        label={STATUS_LABEL[step] ?? 'Çiziliyor…'}
        done={drawn}
        failed={failed}
      />
    ) : null;

  const render = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep onNext={() => setStep('kind')} />;
      case 'kind':
        return (
          <KindStep
            kind={kind}
            name={notebookName}
            onKind={pickKind}
            onName={setNotebookName}
            onBack={() => setStep('welcome')}
            onNext={() => setStep('photo')}
          />
        );
      case 'photo':
        return (
          kind && (
            <PhotoStep
              kind={kind}
              onBack={notebookId ? undefined : () => setStep('kind')}
              onPick={() => pickPhoto()}
              onDevSkip={__DEV__ ? () => pickPhoto(true) : undefined}
            />
          )
        );
      case 'name':
        return (
          <NameStep
            status={status}
            name={name}
            onName={setName}
            onNext={() => setStep('goal')}
            onSkip={() => {
              setName('');
              setStep('goal');
            }}
          />
        );
      case 'goal':
        return (
          copy && (
            <GoalStep status={status} question={copy.goalQuestion} goal={goal} onGoal={setGoal} onNext={afterGoal} />
          )
        );
      case 'reminder':
        return <ReminderStep status={status} goal={goal} time={time} onTime={setTime} onAnswer={answerReminder} />;
      case 'wait':
        return <WaitStep notebookName={notebookName.trim()} progress={progress} />;
      case 'slow':
        return (
          <SlowStep
            status={status}
            // The drawing keeps going; home shows it as "çiziliyor", then the paywall.
            onHome={() => {
              setPaywallDue(true);
              finish(reminderAt ?? null);
            }}
            onStay={() => {
              setStayed(true);
              setStep('wait');
            }}
          />
        );
      case 'failed':
        return (
          copy && (
            <FailedStep
              photo={photos[copy.sample]}
              drawing={drawings[copy.sample]}
              onRetry={pickPhoto}
              onOtherPhoto={() => setStep('photo')}
            />
          )
        );
      case 'ready':
        return (
          memory && (
            <ReadyStep
              memory={memory}
              notebookName={notebookName.trim()}
              onContinue={() => setStep('paywall')}
              onShare={() => router.push(routes.share(memory.id))}
            />
          )
        );
      case 'offer':
        return <ExitOffer onClose={closeOffer} />;
      case 'paywall':
        return (
          copy &&
          paywallDrawing && <PaywallStep drawing={paywallDrawing} title={copy.paywallTitle} onClose={closePaywall} />
        );
    }
  };

  return (
    <View style={styles.root}>
      {/* Keyed by step: the old step fades out over the new one. */}
      <Animated.View
        key={step}
        entering={FadeIn.duration(260)}
        exiting={FadeOut.duration(160)}
        style={StyleSheet.absoluteFill}>
        {render()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
