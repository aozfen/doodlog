import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Sticker, Text } from '@/components/ui';
import { ART } from '@/constants';
import { dayMonth, isSameDay, parseIsoDay } from '@/lib/date';
import { colors, radius } from '@/theme';
import type { Notebook } from '@/types';

// A notebook with no memories yet: calls for the first one. Design: design/a-defter.html (2).
export function EmptyNotebook({ notebook, today, onAdd }: { notebook: Notebook; today: Date; onAdd: () => void }) {
  const created = parseIsoDay(notebook.createdAt);
  const opened = isSameDay(created, today) ? 'Bugün açıldı' : `${dayMonth(created)} açıldı`;

  return (
    <View>
      <Text variant="hand" style={styles.title} numberOfLines={1}>
        {notebook.name}
      </Text>
      <Text variant="sub">{opened} · 0 anı</Text>

      {/* Dashed = empty spot, so it fades on tap instead of sinking (like "Bugün henüz boş"). */}
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="İlk anıyı ekle"
        style={({ pressed }) => [styles.cover, pressed && { opacity: 0.7 }]}>
        <Sticker source={ART.emptyCover} style={styles.art} />
        <Text variant="note">İlk anı kapak olur</Text>
        <Text variant="sub" style={styles.hint}>
          Galeriden eski bir fotoğraf da seçebilirsin. Tarihi kendi gelir.
        </Text>
      </Pressable>

      <Button icon="plus" label="İlk anıyı ekle · 1 fırça" onPress={onAdd} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 46, lineHeight: 52, marginTop: 16 },
  cover: {
    marginTop: 20,
    paddingVertical: 22,
    borderRadius: radius.card,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  art: { width: 120, height: 120, marginBottom: 4, transform: [{ rotate: '-3deg' }] },
  hint: { textAlign: 'center', maxWidth: 240 },
});
