// Steps asked while the first drawing is made, so the wait feels short.
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { MonthGrid } from '@/components/calendar/month-grid';
import { Button, Field, Icon, Raised, Text, TextButton } from '@/components/ui';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { DRAW_STAGES, GOAL_ORDER, GOALS, REMINDER_TIMES } from '@/constants';
import { MONTH_NAMES } from '@/lib/date';
import { toUpperCaseTr } from '@/lib/text';
import { mockToday } from '@/mock';
import { colors, fonts, radius } from '@/theme';
import type { Goal, Memory } from '@/types';

import { Reveal, StepLayout, StepTitle } from './step-layout';

const NAME_MAX = 24;
const NO_MEMORIES = new Map<string, Memory>();

type NameProps = {
  status: ReactNode;
  name: string;
  onName: (name: string) => void;
  onNext: () => void;
  onSkip: () => void;
};

export function NameStep({ status, name, onName, onNext, onSkip }: NameProps) {
  const ready = name.trim() !== '';
  // Skip is hidden while typing: room for the field on small screens.
  const keyboard = useKeyboardVisible();
  return (
    <StepLayout
      foot={
        <>
          <Button label="Devam" disabled={!ready} onPress={onNext} />
          {keyboard ? null : <TextButton label="Atla" onPress={onSkip} />}
        </>
      }
      footOrder={3}>
      {status}
      <Reveal order={0}>
        <StepTitle style={{ marginTop: 40 }}>Bu arada, sana nasıl hitap edelim?</StepTitle>
      </Reveal>
      <Reveal order={1}>
        <Field
          value={name}
          onChangeText={onName}
          placeholder="Adın"
          accessibilityLabel="Adın"
          autoFocus
          autoCapitalize="words"
          textContentType="givenName"
          maxLength={NAME_MAX}
          returnKeyType="done"
          onSubmitEditing={() => ready && onNext()}
          style={styles.nameField}
        />
      </Reveal>
      <Reveal order={2}>
        <Text variant="sub" style={{ marginTop: 10 }}>
          Sadece selamlamada kullanırız.
        </Text>
      </Reveal>
    </StepLayout>
  );
}

type GoalProps = {
  status: ReactNode;
  question: string;
  goal: Goal;
  onGoal: (goal: Goal) => void;
  onNext: () => void;
};

export function GoalStep({ status, question, goal, onGoal, onNext }: GoalProps) {
  return (
    <StepLayout foot={<Button label="Devam" onPress={onNext} />} footOrder={GOAL_ORDER.length + 2}>
      {status}
      <Reveal order={0}>
        <StepTitle style={{ marginTop: 40 }}>{question}</StepTitle>
      </Reveal>
      <View style={styles.goals}>
        {GOAL_ORDER.map((g, i) => (
          <Reveal key={g} order={i + 1}>
            <Raised
              onPress={() => onGoal(g)}
              accessibilityLabel={GOALS[g].label}
              radius={radius.option}
              style={[styles.goal, g === goal && styles.selected]}>
              <Text style={styles.goalLabel}>{GOALS[g].label}</Text>
              <Text variant="sub">{GOALS[g].hint}</Text>
            </Raised>
          </Reveal>
        ))}
      </View>
      <Reveal order={GOAL_ORDER.length + 1}>
        <Text variant="sub" style={{ marginTop: 14, fontSize: 12 }}>
          Hatırlatmaları buna göre ayarlarız. Sonra değiştirebilirsin.
        </Text>
      </Reveal>
    </StepLayout>
  );
}

type ReminderProps = {
  /** Missing when asked at the end, after the drawing is done. */
  status?: ReactNode;
  goal: Goal;
  time: string;
  onTime: (time: string) => void;
  onAnswer: (time: string | null) => void;
};

export function ReminderStep({ status, goal, time, onTime, onAnswer }: ReminderProps) {
  const pickTime = () =>
    Alert.alert('Hatırlatma saati', undefined, [
      ...REMINDER_TIMES.map((t) => ({ text: t, onPress: () => onTime(t) })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);

  return (
    <StepLayout
      foot={
        <>
          <Button label="Hatırlat" onPress={() => onAnswer(time)} />
          <Button variant="secondary" size="m" label="Gerek yok" onPress={() => onAnswer(null)} />
        </>
      }
      footOrder={4}>
      {status}
      <View style={styles.center}>
        <Reveal order={0}>
          <StepTitle style={{ textAlign: 'center', paddingLeft: 8 }}>Akşam hatırlatalım mı?</StepTitle>
        </Reveal>
        <Reveal order={1}>
          <Text variant="sub" style={styles.days}>
            {GOALS[goal].label} hedefin için:{'\n'}
            {GOALS[goal].days}
          </Text>
        </Reveal>
        <Reveal order={2} style={{ marginTop: 22 }}>
          <Raised onPress={pickTime} accessibilityLabel={`Saat ${time}, değiştir`} radius={22} style={styles.time}>
            <Text style={styles.timeText}>{time}</Text>
          </Raised>
        </Reveal>
        <Reveal order={3}>
          <Text variant="sub" style={{ marginTop: 12, fontSize: 12 }}>
            Saate dokun, değiştir
          </Text>
        </Reveal>
      </View>
    </StepLayout>
  );
}

/** Stage index (0-2) from drawing progress. */
const stageOf = (p: number) => {
  'worklet';
  return p < 0.35 ? 0 : p < 0.7 ? 1 : 2;
};

/** Only when the questions ran out before the drawing: today waits for the first memory. */
export function WaitStep({ notebookName, progress }: { notebookName: string; progress: SharedValue<number> }) {
  const [stage, setStage] = useState(() => stageOf(progress.value));
  useAnimatedReaction(
    () => stageOf(progress.value),
    (next, prev) => {
      if (next !== prev) scheduleOnRN(setStage, next);
    },
  );
  const monthLabel = `${MONTH_NAMES[mockToday.getMonth()]} ${mockToday.getFullYear()}`;

  return (
    <StepLayout>
      <Reveal order={0}>
        <Text variant="label" style={{ marginTop: 8 }}>
          {toUpperCaseTr(`${notebookName} · ${monthLabel}`)}
        </Text>
        <StepTitle style={{ fontSize: 40, lineHeight: 44, marginTop: 6 }}>İlk anın buraya gelecek</StepTitle>
      </Reveal>
      <Reveal order={1} style={{ marginTop: 22 }}>
        <MonthGrid year={mockToday.getFullYear()} month={mockToday.getMonth()} byDay={NO_MEMORIES} today={mockToday} />
      </Reveal>
      <View style={styles.stages}>
        {DRAW_STAGES.map((label, i) => (
          <Reveal key={label} order={i + 2} style={styles.stage}>
            {i < stage ? (
              <Icon name="check" size={20} color={colors.red} />
            ) : i === stage ? (
              <ActivityIndicator size="small" color={colors.red} style={styles.stageMark} />
            ) : (
              <View style={[styles.stageMark, styles.stageRing]} />
            )}
            <Text style={[styles.stageText, i > stage && { color: colors.placeholder }]}>
              {i === stage ? `${label}…` : label}
            </Text>
          </Reveal>
        ))}
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  nameField: { marginTop: 24, minHeight: 60 },
  goals: { gap: 14, marginTop: 22 },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.ink },
  goalLabel: { fontFamily: fonts.heavy, fontSize: 16, lineHeight: 21, color: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  days: { textAlign: 'center', marginTop: 10, fontSize: 14, lineHeight: 20 },
  time: { paddingVertical: 6, paddingHorizontal: 26 },
  timeText: { fontFamily: fonts.heavy, fontSize: 44, lineHeight: 56, letterSpacing: -0.9, color: colors.ink },
  stages: { gap: 12, marginTop: 26 },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageMark: { width: 20, height: 20 },
  stageRing: { borderRadius: 10, borderWidth: 2.5, borderColor: colors.grab },
  stageText: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
});
