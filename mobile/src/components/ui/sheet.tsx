import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  Keyframe,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, radius } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /**
   * Name of the page shown, for sheets with more than one page. When it changes, the new page
   * fades in over the old one and the sheet grows or shrinks to it smoothly.
   */
  step?: string;
  children: ReactNode;
};

// Bottom sheet: dim fades in, sheet slides up. Tap the dim to close.
// It stays mounted until the close animation ends. It rises above the keyboard.
export function Sheet({ visible, onClose, step, children }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const p = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  // Mount right away when opened (state update during render is allowed for this).
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      p.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    } else {
      p.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible, p]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: p.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(p.value, [0, 1], [height * 0.6, 0]) }],
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.frame}
        pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) + 14 }, sheetStyle]}>
          <View style={styles.grab} />
          {step === undefined ? children : <Pages step={step}>{children}</Pages>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const PAGE_MS = 240;
const PAGE_IN = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 18 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }], easing: Easing.out(Easing.cubic) },
}).duration(PAGE_MS);
const PAGE_OUT = FadeOut.duration(PAGE_MS / 2);

/**
 * Pages of a sheet. Each page lies on top of the box, so the old one can fade out while the
 * new one comes in. The box takes the new page's height with an animation.
 */
function Pages({ step, children }: { step: string; children: ReactNode }) {
  /** -1 until the first page is measured: that one is shown at once. */
  const height = useSharedValue(-1);
  const box = useAnimatedStyle(() => (height.get() < 0 ? {} : { height: height.get() }));
  const measure = (next: number) =>
    height.set(height.get() < 0 ? next : withTiming(next, { duration: PAGE_MS, easing: Easing.out(Easing.cubic) }));

  return (
    <Animated.View style={[styles.pages, box]}>
      <Animated.View
        key={step}
        entering={PAGE_IN}
        exiting={PAGE_OUT}
        style={styles.page}
        onLayout={(e) => measure(e.nativeEvent.layout.height)}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pages: { overflow: 'hidden' },
  page: { position: 'absolute', top: 0, left: 0, right: 0 },
  dim: { backgroundColor: colors.scrim },
  frame: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.grab, alignSelf: 'center', marginBottom: 18 },
});
