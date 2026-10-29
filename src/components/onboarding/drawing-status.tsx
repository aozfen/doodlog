import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Flat, Icon, ProgressBar, ProgressFill, Text } from '@/components/ui';
import { colors, fonts, radius } from '@/theme';
import type { Picture } from '@/types';

const THUMB = 64;

type Props = {
  photo?: Picture;
  drawing: Picture;
  /** 0-1 drawing progress, shared across steps so the bar never jumps back. */
  progress: SharedValue<number>;
  label: string;
  done: boolean;
  failed?: boolean;
};

/** Small drawing state on top of the steps asked while the first drawing is made. */
export function DrawingStatus({ photo, drawing, progress, label, done, failed }: Props) {
  const photoStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0.2, 0.9], [1, 0], 'clamp') }));
  const drawingStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0.2, 0.9], [0, 1], 'clamp') }));
  const barStyle = useAnimatedStyle(() => ({ width: `${interpolate(progress.value, [0, 1], [4, 100], 'clamp')}%` }));

  return (
    <Flat radius={20} style={styles.card}>
      <View style={styles.thumb}>
        {photo ? (
          <Animated.View style={[styles.photo, photoStyle]}>
            <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Animated.View>
        ) : null}
        <Animated.View style={[StyleSheet.absoluteFill, drawingStyle]}>
          <Image source={drawing} style={StyleSheet.absoluteFill} contentFit="contain" />
        </Animated.View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.row}>
          {done || failed ? <Icon name={done ? 'check' : 'x'} size={18} color={colors.red} /> : null}
          <Text style={styles.label}>{done ? 'Çizimin hazır' : failed ? 'Bu sefer olmadı' : label}</Text>
        </View>
        <ProgressBar style={styles.bar}>
          <Animated.View style={[{ height: '100%' }, barStyle]}>
            <ProgressFill />
          </Animated.View>
        </ProgressBar>
      </View>
    </Flat>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  thumb: { width: THUMB, height: THUMB },
  photo: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: radius.thumb - 4,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20, color: colors.ink },
  bar: { height: 8, marginTop: 6 },
});
