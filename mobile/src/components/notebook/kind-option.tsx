import { StyleSheet } from 'react-native';

import { Icon, Raised, Sticker, Text } from '@/components/ui';
import { SAMPLE_DRAWINGS, type SampleKey } from '@/constants';
import { colors, fonts, radius } from '@/theme';

type Props = {
  label: string;
  /** Sample drawing. Without it the option is a dashed "+" ("Başka"). */
  art?: SampleKey;
  selected: boolean;
  width: number;
  height?: number;
  onPress: () => void;
};

/** Notebook kind option with a sample drawing. Used in "Yeni defter" and onboarding. */
export function KindOption({ label, art, selected, width, height = 112, onPress }: Props) {
  const box = { width };
  const face = [styles.option, { height }, selected && styles.selected];

  // No sample drawing ("Başka"): dashed placeholder, still tappable.
  if (!art) {
    const tint = selected ? colors.ink : colors.dashedText;
    return (
      <Raised
        onPress={onPress}
        accessibilityLabel={label}
        depth={0}
        color="transparent"
        topColor="transparent"
        edgeColor="transparent"
        radius={radius.option}
        containerStyle={box}
        style={[face, styles.dashed, selected && styles.selected]}>
        <Icon name="plus" size={26} color={tint} />
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </Raised>
    );
  }

  return (
    <Raised onPress={onPress} accessibilityLabel={label} radius={radius.option} containerStyle={box} style={face}>
      <Sticker source={SAMPLE_DRAWINGS[art]} style={[styles.art, { height: height * 0.6 }]} />
      <Text style={styles.label}>{label}</Text>
    </Raised>
  );
}

const styles = StyleSheet.create({
  option: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 6,
    paddingBottom: 10,
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  dashed: { borderStyle: 'dashed', borderColor: colors.dashed, justifyContent: 'center', paddingBottom: 0 },
  selected: { borderStyle: 'solid', borderColor: colors.ink },
  art: { width: '100%' },
  label: { fontFamily: fonts.heavy, fontSize: 13, lineHeight: 16, color: colors.ink },
});
