import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, CheckDot, ListGroup, ListItem, Sheet, Text, TextButton } from '@/components/ui';

// Delete: offer to move the memories first so nothing is lost. Design: a-defter-ayar.html (4).
export function DeleteNotebookSheet({
  visible,
  name,
  count,
  moveToName,
  onClose,
  onDelete,
}: {
  visible: boolean;
  name: string;
  count: number;
  /** Notebook that receives the memories. Without one, only "delete all" is offered. */
  moveToName?: string;
  onClose: () => void;
  onDelete: (moveMemories: boolean) => void;
}) {
  const [move, setMove] = useState(Boolean(moveToName));

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="sec" style={styles.title}>
        {name} silinsin mi?
      </Text>
      {count ? (
        <>
          <Text variant="sub" style={styles.body}>
            İçinde {count} anı var. Bunlar ne olsun?
          </Text>
          <ListGroup style={{ marginTop: 18 }}>
            {moveToName ? (
              <ListItem
                label="Başka deftere taşı"
                detail={`${moveToName} · anılar ve çizimler kalır`}
                left={<CheckDot on={move} />}
                onPress={() => setMove(true)}
              />
            ) : null}
            <ListItem
              label="Anılarla birlikte sil"
              detail={`${count} çizim ve not bu telefondan silinir`}
              left={<CheckDot on={!move} />}
              onPress={() => setMove(false)}
            />
          </ListGroup>
        </>
      ) : null}
      <Button variant="danger" label="Defteri sil" style={{ marginTop: 22 }} onPress={() => onDelete(move)} />
      <TextButton label="Vazgeç" onPress={onClose} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, lineHeight: 30, textAlign: 'center' },
  body: { textAlign: 'center', marginTop: 8 },
});
