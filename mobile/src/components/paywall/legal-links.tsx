import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/alerts';

const LEGAL_LINKS = ['Geri yükle', 'Gizlilik', 'Kullanım şartları'];

/** App Store needs restore and legal links on every paywall. Closing is the X. */
export function LegalLinks() {
  return (
    <View style={styles.row}>
      {LEGAL_LINKS.map((label, i) => (
        <Fragment key={label}>
          {i > 0 ? <Text variant="sub">·</Text> : null}
          <Text variant="sub" style={styles.link} onPress={() => comingSoon(label)} suppressHighlighting>
            {label}
          </Text>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  link: { fontSize: 12, textDecorationLine: 'underline' },
});
