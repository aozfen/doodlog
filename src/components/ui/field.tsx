import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { Icon, type IconName } from './icon';

// Flat input field with an optional leading icon.
export function Field({ icon, style, ...rest }: TextInputProps & { icon?: IconName }) {
  return (
    <View style={[styles.field, style]}>
      {icon ? <Icon name={icon} size={20} opacity={0.5} /> : null}
      <TextInput placeholderTextColor={colors.placeholder} selectionColor={colors.red} style={styles.input} {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.field,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.ink, paddingVertical: 14 },
});
