import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useKeyboardVisible } from '@/hooks/use-keyboard-visible';
import { useFadeUp } from '@/lib/animations';
import { space } from '@/theme';

const REVEAL_START_MS = 120;
const REVEAL_GAP_MS = 90;

type Props = {
  children: ReactNode;
  /** Buttons pinned to the bottom. */
  foot?: ReactNode;
  /** Reveal order of the foot. Leave empty when the step animates the foot itself. */
  footOrder?: number;
};

/** One onboarding step: scrolling content and a bottom action area that rises with the keyboard. */
export function StepLayout({ children, foot, footOrder }: Props) {
  const insets = useSafeAreaInsets();
  // Above the keyboard the home indicator inset is not needed: give that room to the content.
  const keyboard = useKeyboardVisible();
  const footBottom = keyboard ? space.m : Math.max(insets.bottom, 20) + 10;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        {children}
      </ScrollView>
      {foot ? (
        <View style={{ paddingBottom: footBottom }}>
          {footOrder === undefined ? (
            <View style={styles.foot}>{foot}</View>
          ) : (
            <Reveal order={footOrder} style={styles.foot}>
              {foot}
            </Reveal>
          )}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/**
 * Step content that fades up in turn: order 0 first, then every 90 ms.
 * Keep transforms (tilt) on a child: the reveal owns this view's transform.
 */
export function Reveal({
  order = 0,
  children,
  style,
}: {
  order?: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const fade = useFadeUp(REVEAL_START_MS + order * REVEAL_GAP_MS);
  return <Animated.View style={[style, fade]}>{children}</Animated.View>;
}

/** The one Caveat title of a step. */
export function StepTitle({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text variant="hand" style={[styles.title, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: space.gutter, paddingBottom: space.xxl },
  foot: { paddingHorizontal: space.gutter, paddingTop: space.s, gap: space.m },
  title: { fontSize: 42, lineHeight: 46 },
});
