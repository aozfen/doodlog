import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Sticker } from '@/components/ui';
import { ART } from '@/constants';
import { opacity } from '@/theme';
import type { Picture } from '@/types';

// Notebook cover sticker. A new notebook has no cover until its first memory, so it
// shows the blank polaroid art, small and faded: empty notebooks stay quiet next to
// real drawings, and several of them in a row do not look like a template.
export function NotebookCover({ cover, style }: { cover?: Picture; style?: StyleProp<ViewStyle> }) {
  if (cover) return <Sticker source={cover} style={style} />;
  return (
    <View style={[style, styles.center]}>
      <Sticker source={ART.emptyCover} style={styles.empty} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  empty: { width: '70%', height: '70%', opacity: opacity.placeholderArt },
});
