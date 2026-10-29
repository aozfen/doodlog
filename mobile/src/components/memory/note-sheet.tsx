import { useState } from 'react';

import { Button, Field, Sheet, Text } from '@/components/ui';
import { NOTE_MAX } from '@/constants';
import { colors } from '@/theme';

type Props = {
  visible: boolean;
  note: string;
  onClose: () => void;
  onSave: (note: string) => void;
};

export function NoteSheet({ visible, note, onClose, onSave }: Props) {
  const [text, setText] = useState(note);
  const [wasVisible, setWasVisible] = useState(visible);
  // Start from the current note each time the sheet opens.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setText(note);
  }

  const save = () => onSave(text.trim());
  const full = text.length >= NOTE_MAX;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="sec" style={{ fontSize: 24, lineHeight: 30 }}>
        {note ? 'Notu düzenle' : 'Not ekle'}
      </Text>
      <Field
        icon="chat"
        placeholder="Bu anıya bir not yaz"
        accessibilityLabel="Not"
        value={text}
        onChangeText={setText}
        maxLength={NOTE_MAX}
        multiline
        autoFocus
        style={{ marginTop: 14 }}
      />
      <Text variant="sub" style={{ textAlign: 'right', marginTop: 6, color: full ? colors.red : undefined }}>
        {text.length} / {NOTE_MAX}
      </Text>
      <Button label="Kaydet" icon="check" style={{ marginTop: 12 }} onPress={save} />
    </Sheet>
  );
}
