import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, Flat, ListGroup, ProgressBar, Raised, Text } from '@/components/ui';
import { BRUSH_PACKS } from '@/constants';
import { comingSoon } from '@/lib/alerts';
import { useUser } from '@/hooks/use-store';
import { brushMoves } from '@/mock';
import { colors, fonts, space } from '@/theme';

const formatDelta = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

// Brushes. Opens from the brush chip and from settings. Design: design/a-ayarlar.html (3).
export default function BrushesScreen() {
  const insets = useSafeAreaInsets();
  const user = useUser();
  const { brushes } = user;
  const ratio = brushes.subscriptionMax ? brushes.subscription / brushes.subscriptionMax : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}>
      <BackButton />
      <Text variant="hand" style={styles.title}>
        Fırçalarım
      </Text>
      <Text variant="sub" style={{ marginTop: 4 }}>
        1 çizim = 1 fırça. Önce abonelik fırçası harcanır.
      </Text>

      <Flat radius={22} style={styles.balance}>
        {user.subscriber ? (
          <>
            <View style={styles.row}>
              <Text style={styles.strong}>Abonelik</Text>
              <Text style={styles.strong}>
                {brushes.subscription} / {brushes.subscriptionMax}
              </Text>
            </View>
            <ProgressBar value={ratio} style={{ marginTop: 8 }} />
            <Text variant="sub" style={{ marginTop: 6 }}>
              {brushes.renewsOn}’da {brushes.subscriptionMax}’ye yenilenir. Kalanlar devretmez.
            </Text>
            <View style={styles.divider} />
          </>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.strong}>Paket</Text>
          <Text style={styles.strong}>{brushes.pack}</Text>
        </View>
        <Text variant="sub" style={{ marginTop: 4 }}>
          Süresi dolmaz.
        </Text>
      </Flat>

      <View style={styles.packs}>
        {BRUSH_PACKS.map((p) => (
          <Raised
            key={p.amount}
            radius={22}
            containerStyle={{ flex: 1 }}
            style={styles.pack}
            accessibilityLabel={`${p.amount} fırça, ${p.price}`}
            onPress={() => comingSoon(`+${p.amount} fırça`, 'Yakında: App Store satın alma')}>
            <Text style={styles.strong}>+{p.amount} fırça</Text>
            <Text variant="sub">{p.price}</Text>
          </Raised>
        ))}
      </View>

      <Text variant="label" style={styles.section}>
        Son hareketler
      </Text>
      <ListGroup>
        {brushMoves.map((m, i) => (
          <View key={i} style={styles.move}>
            <View style={{ flex: 1 }}>
              <Text style={styles.strong}>{m.title}</Text>
              <Text variant="sub" style={{ fontSize: 12, lineHeight: 16 }}>
                {m.when}
              </Text>
            </View>
            <Text style={[styles.delta, m.delta > 0 && { color: colors.ok }]}>{formatDelta(m.delta)}</Text>
          </View>
        ))}
      </ListGroup>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter },
  title: { fontSize: 44, lineHeight: 48, marginTop: 14 },
  balance: { marginTop: 18, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  strong: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20, color: colors.ink },
  divider: { height: 1.5, backgroundColor: colors.line, marginVertical: 14 },
  packs: { flexDirection: 'row', gap: 12, marginTop: 16 },
  pack: { paddingVertical: 12, paddingHorizontal: 16, gap: 2 },
  section: { marginTop: 22, marginHorizontal: 4, marginBottom: 8 },
  move: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  delta: { fontFamily: fonts.heavy, fontSize: 15, color: colors.ink },
});
