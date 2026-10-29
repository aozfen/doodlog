import { useEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { colors, radius } from '@/theme';

type Props = { visible: boolean; onClose: () => void; children: ReactNode };

// Bottom sheet: dim fades in, sheet slides up. Tap the dim to close.
// It stays mounted until the close animation ends. It rises above the keyboard.
export function Sheet({ visible, onClose, children }: Props) {
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
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
