import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components/ui';
import { routes } from '@/constants';
import { colors, fonts } from '@/theme';

type TabName = '(notebooks)' | 'calendar';

const TABS: Record<TabName, { label: string; icon: IconName }> = {
  '(notebooks)': { label: 'Defterler', icon: 'nb' },
  calendar: { label: 'Takvim', icon: 'cal' },
};

type Props = BottomTabBarProps & { onAdd?: () => void };

// Floating dark pill: Defterler | Anı ekle | Takvim. A fade sits behind it.
export function BottomBar({ state, navigateToTab, onAdd }: Props) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  const go = (name: TabName) => {
    Haptics.selectionAsync();
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    if (name !== current) return navigateToTab(route.key);
    // Tapping the active tab inside a notebook page goes back to the list.
    const nested = (route as { state?: { index?: number } }).state;
    if ((nested?.index ?? 0) > 0) router.navigate(routes.home);
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        pointerEvents="none"
        colors={[colors.bgClear, colors.bg, colors.bg]}
        locations={[0, 0.62, 1]}
        style={styles.fade}
      />
      <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 20) + 4 }]}>
        <View style={styles.edge}>
          <LinearGradient colors={[colors.barTop, colors.bar]} style={styles.bar}>
            <Tab name="(notebooks)" active={current === '(notebooks)'} onPress={go} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Anı ekle"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAdd?.();
              }}>
              {({ pressed }) => (
                // Size stays fixed while pressed: only the face moves down over the edge,
                // so the bar around it does not shrink.
                <View style={styles.addWrap}>
                  <View style={[StyleSheet.absoluteFill, styles.addEdge]} />
                  <LinearGradient
                    colors={[colors.barAddTop, colors.barAdd]}
                    style={[styles.add, pressed && { transform: [{ translateY: 2 }] }]}>
                    <Icon name="plus" size={24} color={colors.bar} />
                    <Text style={styles.addLabel}>Anı ekle</Text>
                  </LinearGradient>
                </View>
              )}
            </Pressable>
            <Tab name="calendar" active={current === 'calendar'} onPress={go} />
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

function Tab({ name, active, onPress }: { name: TabName; active: boolean; onPress: (n: TabName) => void }) {
  const t = TABS[name];
  const c = active ? colors.white : colors.barIcon;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t.label}
      onPress={() => onPress(name)}
      style={styles.tab}>
      <Icon name={t.icon} size={22} color={c} />
      <Text style={[styles.tabLabel, { color: c }]}>{t.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  edge: {
    borderRadius: 34,
    backgroundColor: colors.black,
    paddingBottom: 6,
    shadowColor: colors.black,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 7, borderRadius: 34 },
  tab: {
    minWidth: 64,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
  tabLabel: { fontFamily: fonts.heavy, fontSize: 10, lineHeight: 13 },
  addWrap: { paddingBottom: 3 },
  addEdge: { top: 3, borderRadius: 26, backgroundColor: colors.barAddEdge },
  add: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 16,
    paddingRight: 20,
  },
  addLabel: { fontFamily: fonts.heavy, fontSize: 15, color: colors.bar },
});
