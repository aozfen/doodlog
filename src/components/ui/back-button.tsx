import { router } from 'expo-router';
import { View } from 'react-native';

import { IconButton } from './chip';

// Back button on its own row. The row keeps it from stretching in a column layout.
export function BackButton({ icon = 'back' }: { icon?: 'back' | 'x' }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <IconButton icon={icon} label={icon === 'x' ? 'Kapat' : 'Geri'} onPress={() => router.back()} />
    </View>
  );
}
