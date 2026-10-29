import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { TOAST_MS, UNDO_TOAST_MS } from '@/constants';
import { colors, fonts, space } from '@/theme';

import { Countdown } from './countdown';
import { Icon } from './icon';
import { Text } from './text';

type ToastAction = { label: string; onPress: () => void };
type ToastState = { id: number; message: string; action?: ToastAction };

type ToastApi = {
  show: (message: string, action?: ToastAction) => void;
  /**
   * "Geri al" toast with the countdown ring. The caller's own work (for example a delete) must
   * become final after UNDO_TOAST_MS, the same time the toast stays.
   */
  undo: (message: string, onUndo: () => void) => void;
};

const Ctx = createContext<ToastApi>({ show: () => {}, undo: () => {} });

/** Shows a toast above the bottom bar. It outlives the screen that showed it. */
export const useToast = () => useContext(Ctx);

// One toast at a time: a new one replaces the old one. With an action ("Geri al")
// it stays longer, so there is time to tap it, and counts the seconds down.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.action ? UNDO_TOAST_MS : TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  const show = useCallback((message: string, action?: ToastAction) => {
    setToast({ id: Date.now(), message, action });
  }, []);
  const undo = useCallback(
    (message: string, onUndo: () => void) => show(message, { label: 'Geri al', onPress: onUndo }),
    [show],
  );
  const value = useMemo(() => ({ show, undo }), [show, undo]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          key={toast.id}
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(200)}
          style={styles.toast}
          accessibilityLiveRegion="polite">
          {toast.action ? (
            <Countdown duration={UNDO_TOAST_MS} />
          ) : (
            <Icon name="check" size={20} color={colors.okOnDark} strokeWidth={2.5} />
          )}
          <Text style={styles.text}>{toast.message}</Text>
          {toast.action ? <ActionButton action={toast.action} onDone={() => setToast(null)} /> : null}
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

function ActionButton({ action, onDone }: { action: ToastAction; onDone: () => void }) {
  return (
    <Pressable
      onPress={() => {
        action.onPress();
        onDone();
      }}
      hitSlop={12}
      accessibilityRole="button"
      style={({ pressed }) => pressed && { opacity: 0.6 }}>
      <Text style={styles.action}>{action.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.gutter,
    right: space.gutter,
    bottom: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  text: { flex: 1, fontFamily: fonts.bold, fontSize: 14, lineHeight: 19, color: colors.white },
  action: { fontFamily: fonts.heavy, fontSize: 14, lineHeight: 19, color: colors.redOnDark },
});
