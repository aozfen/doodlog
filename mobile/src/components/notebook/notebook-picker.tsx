import { StyleSheet, View } from 'react-native';

import { CheckDot, Icon, ListGroup, ListItem, Sheet, Text } from '@/components/ui';
import { useNotebooks } from '@/hooks/use-store';
import { notebookStatus } from '@/lib/notebook-stats';
import { statsOf } from '@/mock';

import { NotebookCover } from './notebook-cover';
import { colors } from '@/theme';

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onNew?: () => void;
  footnote?: string;
};

// "Hangi deftere?" sheet. Works for any number of notebooks.
// Design: design/a-ani-menu.html (4). Also used later by "Başka deftere taşı".
export function NotebookPicker({ visible, selected, onSelect, onClose, onNew, footnote }: Props) {
  const notebooks = useNotebooks();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="sec" style={{ textAlign: 'center' }}>
        Hangi deftere?
      </Text>
      <ListGroup style={{ marginTop: 16 }}>
        {notebooks.map((n) => (
          <ListItem
            key={n.id}
            label={n.name}
            detail={n.id === selected ? 'Seçili' : notebookStatus(statsOf(n.id))}
            left={<NotebookCover cover={n.cover} style={styles.cover} />}
            right={n.id === selected ? <CheckDot /> : null}
            onPress={() => {
              onSelect(n.id);
              onClose();
            }}
          />
        ))}
        <ListItem
          label="Yeni defter"
          left={
            <View style={styles.newBox}>
              <Icon name="plus" size={20} color={colors.dashedText} />
            </View>
          }
          onPress={onNew}
        />
      </ListGroup>
      {footnote ? (
        <Text variant="sub" style={{ textAlign: 'center', marginTop: 14, fontSize: 12 }}>
          {footnote}
        </Text>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cover: { width: 44, height: 44 },
  newBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
