import { StyleSheet, View } from 'react-native';

import { Button, Sheet, Sticker, Text } from '@/components/ui';
import { ART } from '@/constants';
import type { Picture } from '@/types';

// Fake door: shared notebooks are not built, this only measures interest.
// Design: design/a-davet-yakinda.html (2). Shows the notebook's cover, or the shared
// "two hands, one notebook" art when it has none yet.
export function InviteSheet({
  visible,
  body,
  cover,
  onClose,
  onNotify,
}: {
  visible: boolean;
  body: string;
  cover?: Picture;
  onClose: () => void;
  onNotify: () => void;
}) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.head}>
        <Sticker source={cover ?? ART.inviteTogether} style={styles.art} />
        <Text variant="sec" style={styles.title}>
          Birlikte doldurmak yakında
        </Text>
        <Text variant="sub" style={styles.body}>
          {body}
        </Text>
      </View>
      <Button label="Hazır olunca haber ver" style={{ marginTop: 22 }} onPress={onNotify} />
      <Button variant="secondary" size="m" label="Daha sonra" style={{ marginTop: 12 }} onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center' },
  art: { width: 140, height: 140, transform: [{ rotate: '-4deg' }] },
  title: { fontSize: 24, lineHeight: 30, textAlign: 'center', marginTop: 10 },
  body: { textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
