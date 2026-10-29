import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fonts } from '@/theme';

import { Text } from './text';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  width?: number;
};

const EDGE = 2;

// Sunken track, selected segment is a light raised pill.
export function Segmented<T extends string>({ options, value, onChange, width = 150 }: Props<T>) {
  return (
    <View style={[styles.track, { width }]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync();
              onChange(o.value);
            }}
            style={styles.seg}>
            {/* Raised like the rest of the app: hard edge layer under the face, no one-sided border. */}
            {on ? (
              <>
                <View style={[StyleSheet.absoluteFill, styles.edge]} />
                <View style={[StyleSheet.absoluteFill, styles.face]} />
              </>
            ) : null}
            <Text style={[styles.label, { color: on ? colors.ink : colors.inkMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.empty, borderRadius: 16, padding: 3 },
  seg: { flex: 1, height: 32, paddingBottom: EDGE, alignItems: 'center', justifyContent: 'center' },
  edge: { top: EDGE, borderRadius: 13, backgroundColor: colors.edge },
  face: { bottom: EDGE, borderRadius: 13, backgroundColor: colors.surface },
  label: { fontFamily: fonts.heavy, fontSize: 13 },
});
