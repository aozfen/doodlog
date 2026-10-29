import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Button, CheckDot, ListGroup, ListItem, Sheet, Text, TextButton } from '@/components/ui';
import type { Notebook } from '@/types';

// The toast offers undo for a few seconds, then the delete is for good.
// With memories inside, the user picks move or delete first; move then asks which notebook.
// Design: a-defter-ayar.html (4).
type Choice = 'move' | 'delete' | null;

export function DeleteNotebookSheet({
  visible,
  name,
  count,
  targets,
  onClose,
  onDelete,
}: {
  visible: boolean;
  name: string;
  count: number;
  /** Notebooks that can take the memories. Without any, only "delete all" is offered. */
  targets: Pick<Notebook, 'id' | 'name'>[];
  onClose: () => void;
  /** `moveTo`: the notebook that takes the memories, undefined to delete them too. */
  onDelete: (moveTo?: string) => void;
}) {
  // Nothing is picked up front: with memories inside, the user must choose move or delete.
  const [choice, setChoice] = useState<Choice>(null);
  const [moveTo, setMoveTo] = useState<string>();
  /** Showing the notebook list, after "Başka deftere taşı". */
  const [picking, setPicking] = useState(false);

  // Every opening starts fresh (state adjusted during render).
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setChoice(null);
      setMoveTo(undefined);
      setPicking(false);
    }
  }

  const target = targets.find((t) => t.id === moveTo);
  const pickMove = () => {
    // One other notebook: nothing to pick.
    if (targets.length === 1) {
      setMoveTo(targets[0].id);
      setChoice('move');
    } else setPicking(true);
  };
  const ready = !count || choice === 'delete' || (choice === 'move' && target);

  const pickPage = (
    <>
      <Text variant="sec" style={styles.title}>
        Hangi deftere taşınsın?
      </Text>
      <Text variant="sub" style={styles.body}>
        {count} anı ve çizimleri bu deftere geçer.
      </Text>
      <ListGroup style={{ marginTop: 18 }}>
        {targets.map((t) => (
          <ListItem
            key={t.id}
            label={t.name}
            left={<CheckDot on={moveTo === t.id} />}
            onPress={() => {
              setMoveTo(t.id);
              setChoice('move');
              setPicking(false);
            }}
          />
        ))}
      </ListGroup>
      <TextButton label="Geri" onPress={() => setPicking(false)} />
    </>
  );

  return (
    <Sheet visible={visible} onClose={onClose} step={picking ? 'pick' : 'choice'}>
      {picking ? (
        pickPage
      ) : (
        <>
          <Text variant="sec" style={styles.title}>
            {name} silinsin mi?
          </Text>
          {count ? (
            <>
              <Text variant="sub" style={styles.body}>
                İçinde {count} anı var. Bunlar ne olsun?
              </Text>
              <ListGroup style={{ marginTop: 18 }}>
                {targets.length ? (
                  <ListItem
                    label="Başka deftere taşı"
                    detail={target ? `${target.name} · anılar ve çizimler kalır` : 'Anılar ve çizimler kalır'}
                    left={<CheckDot on={choice === 'move'} />}
                    chevron={targets.length > 1}
                    onPress={pickMove}
                  />
                ) : null}
                <ListItem
                  label="Anılarla birlikte sil"
                  detail={`${count} çizim ve not kalıcı olarak silinir`}
                  left={<CheckDot on={choice === 'delete'} />}
                  onPress={() => setChoice('delete')}
                />
              </ListGroup>
            </>
          ) : null}
          <Text variant="sub" style={styles.warn}>
            {count && choice === 'delete' ? 'Defter ve anıları' : 'Defter'} kalıcı olarak silinir.
          </Text>
          <Button
            variant="danger"
            label={choice === 'move' ? 'Taşı ve defteri sil' : 'Kalıcı olarak sil'}
            style={{ marginTop: 16 }}
            disabled={!ready}
            onPress={() => onDelete(choice === 'move' ? target?.id : undefined)}
          />
          <TextButton label="Vazgeç" onPress={onClose} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, lineHeight: 30, textAlign: 'center' },
  body: { textAlign: 'center', marginTop: 8 },
  warn: { textAlign: 'center', marginTop: 18, lineHeight: 20 },
});
