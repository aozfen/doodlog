import { Pressable, StyleSheet } from 'react-native';

import { Text } from './text';

// Quiet text action under a sheet's main button, e.g. "Vazgeç".
export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      hitSlop={6}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}>
      <Text variant="sub">{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'center', marginTop: 14, height: 32, justifyContent: 'center', paddingHorizontal: 16 },
});
