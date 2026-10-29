import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Sticker, Text, type IconName } from '@/components/ui';
import { WATERMARK } from '@/constants';
import { comingSoon } from '@/lib/alerts';
import { drawingPop } from '@/lib/animations';
import { fullDate, parseIsoDay } from '@/lib/date';
import { useUser } from '@/hooks/use-store';
import { getMemory } from '@/mock';
import { colors, fonts } from '@/theme';
import type { Memory } from '@/types';

type Format = 'story' | 'square' | 'drawing';

const FORMATS: { value: Format; label: string; caption: string }[] = [
  { value: 'story', label: 'Hikaye', caption: 'Hikaye · 9:16' },
  { value: 'square', label: 'Kare', caption: 'Kare · 1:1' },
  { value: 'drawing', label: 'Sadece çizim', caption: 'Sadece çizim · şeffaf' },
];

const ACTIONS: { icon: IconName; label: string }[] = [
  { icon: 'share', label: 'Hikaye' },
  { icon: 'chat', label: 'Mesaj' },
  { icon: 'dl', label: 'Kaydet' },
  { icon: 'more', label: 'Diğer' },
];

// Share. Design: design/a-takvim.html (4).
export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [format, setFormat] = useState<Format>('story');
  const memory = getMemory(id);
  const caption = FORMATS.find((f) => f.value === format)?.caption;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
            hitSlop={8}
            style={styles.close}>
            <Icon name="x" size={22} color={colors.white} />
          </Pressable>
          <Text variant="sub" color={colors.white} style={{ opacity: 0.7 }}>
            {caption}
          </Text>
          <View style={{ width: 42 }} />
        </View>

        <View style={styles.stage}>
          {memory ? (
            <Animated.View key={format} entering={drawingPop}>
              <Preview memory={memory} format={format} />
            </Animated.View>
          ) : (
            <Text variant="sec" color={colors.white}>
              Anı bulunamadı
            </Text>
          )}
        </View>

        <View style={styles.formats}>
          {FORMATS.map((f) => {
            const on = f.value === format;
            return (
              <Pressable
                key={f.value}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  if (on) return;
                  Haptics.selectionAsync();
                  setFormat(f.value);
                }}
                style={[styles.format, on && { backgroundColor: colors.white }]}>
                <Text style={[styles.formatLabel, { color: on ? colors.ink : colors.white }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          {ACTIONS.map((a) => (
            <ActionButton key={a.label} icon={a.icon} label={a.label} onPress={() => comingSoon(a.label)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Preview({ memory, format }: { memory: Memory; format: Format }) {
  const date = fullDate(parseIsoDay(memory.date));
  const user = useUser();
  const mark = user.subscriber ? null : (
    <Text variant="sub" style={{ fontSize: 11 }}>
      {WATERMARK}
    </Text>
  );

  if (format === 'drawing') {
    // Transparent PNG of the drawing only. The checkerboard hint is left out on purpose: keep it calm.
    return <Sticker source={memory.drawing} style={{ width: 280, height: 280 }} />;
  }

  if (format === 'square') {
    return (
      <Card style={styles.square}>
        <Text variant="hand" style={{ fontSize: 26, lineHeight: 30 }}>
          {date}
        </Text>
        <Sticker source={memory.drawing} style={{ width: 190, height: 190 }} />
        {mark}
      </Card>
    );
  }

  return (
    <Card style={styles.story}>
      <Text variant="hand" style={{ fontSize: 30, lineHeight: 34 }}>
        {date}
      </Text>
      <Sticker source={memory.drawing} style={{ width: 220, height: 220 }} />
      <Text style={styles.storyNote}>{memory.note}</Text>
      {mark}
    </Card>
  );
}

function Card({ style, children }: { style: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <View style={styles.cardWrap}>
      <View style={[StyleSheet.absoluteFill, styles.cardEdge]} />
      <View style={[styles.card, style]}>{children}</View>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Haptics.selectionAsync()}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.action}>
      {({ pressed }) => (
        <>
          <View style={styles.circleWrap}>
            <View style={[StyleSheet.absoluteFill, styles.circleEdge]} />
            <LinearGradient
              colors={[colors.surfaceTop, colors.secondary]}
              style={[styles.circle, pressed && { transform: [{ translateY: 3 }] }]}>
              <Icon name={icon} size={24} />
            </LinearGradient>
          </View>
          <Text style={styles.actionLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  stage: { height: 470, marginTop: 18, alignItems: 'center', justifyContent: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    alignItems: 'center',
  },
  // Hard edge under the card, no blur (TEMA.md).
  cardWrap: { paddingBottom: 5 },
  cardEdge: { top: 5, borderRadius: 22, backgroundColor: colors.inkEdge },
  story: { width: 250, height: 444, paddingVertical: 22, paddingHorizontal: 18, justifyContent: 'space-between' },
  square: { width: 300, height: 300, padding: 18, justifyContent: 'space-between' },
  storyNote: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 19, textAlign: 'center', color: colors.ink },
  formats: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 20 },
  format: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: colors.onDarkSoft,
  },
  formatLabel: { fontFamily: fonts.heavy, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  action: { width: 72, alignItems: 'center', gap: 6 },
  circleWrap: { paddingBottom: 4 },
  circleEdge: { top: 4, borderRadius: 28, backgroundColor: colors.inkEdge },
  circle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fonts.heavy, fontSize: 12, color: colors.white },
});
