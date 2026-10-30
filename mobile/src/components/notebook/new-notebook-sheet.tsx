import { useState } from 'react';
import { StyleSheet, Switch, View, useWindowDimensions } from 'react-native';

import { KindOption } from '@/components/notebook/kind-option';
import { Button, Field, Sheet, Text } from '@/components/ui';
import { EVENTS, INVITE_SOURCES, NEW_NOTEBOOK_KINDS, NOTEBOOK_KINDS } from '@/constants';
import { track } from '@/lib/analytics';
import { createNotebook } from '@/store';
import { colors, fonts, radius, space } from '@/theme';
import type { Notebook, NotebookKind } from '@/types';

const COLUMNS = 3;
const GAP = 12;
const NAME_MAX = 30;

type Props = { visible: boolean; onClose: () => void; onCreate: (notebook: Notebook) => void };

// "Yeni defter": pick a kind, the name is prefilled, one tap opens the notebook.
// Design: design/a-defter.html (1). No notebook limit.
export function NewNotebookSheet({ visible, onClose, onCreate }: Props) {
  const { width } = useWindowDimensions();
  const cell = (width - space.gutter * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const [kind, setKind] = useState<NotebookKind | null>(null);
  const [name, setName] = useState('');
  const [together, setTogether] = useState(false);
  const [wasVisible, setWasVisible] = useState(visible);

  // Start fresh each time the sheet opens.
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setKind(null);
      setName('');
      setTogether(false);
    }
  }

  const info = kind ? NOTEBOOK_KINDS[kind] : null;
  const invite = info?.invite;
  const trimmed = name.trim();

  const pick = (next: NotebookKind) => {
    // Keep a name the user typed, replace a prefilled one.
    if (!kind || name === NOTEBOOK_KINDS[kind].defaultName) setName(NOTEBOOK_KINDS[next].defaultName);
    if (!NOTEBOOK_KINDS[next].invite) setTogether(false);
    else if (next !== kind) track(EVENTS.inviteSeen, { kind: next, source: INVITE_SOURCES.newNotebook });
    setKind(next);
  };

  const toggleTogether = (on: boolean) => {
    if (on && kind) track(EVENTS.inviteTapped, { kind, source: INVITE_SOURCES.newNotebook });
    setTogether(on);
  };

  const submit = () => {
    if (!kind || !trimmed) return;
    const notebook = createNotebook(trimmed, kind);
    track(EVENTS.notebookCreated, { kind });
    if (together) track(EVENTS.inviteNotify, { kind, source: INVITE_SOURCES.newNotebook });
    onCreate(notebook);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <Text variant="sec" style={{ fontSize: 24, lineHeight: 28 }}>
        Yeni defter
      </Text>
      <Text variant="sub" style={{ marginTop: 2 }}>
        Kimin anıları birikecek?
      </Text>

      <View style={styles.grid}>
        {NEW_NOTEBOOK_KINDS.map((k) => (
          <KindOption
            key={k}
            label={NOTEBOOK_KINDS[k].label}
            art={NOTEBOOK_KINDS[k].art}
            selected={k === kind}
            width={cell}
            onPress={() => pick(k)}
          />
        ))}
      </View>

      {info ? (
        <>
          <Text variant="label" style={{ marginTop: 20 }}>
            Defterin adı
          </Text>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={info.namePlaceholder}
            accessibilityLabel="Defterin adı"
            maxLength={NAME_MAX}
            autoFocus={!info.defaultName}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={{ marginTop: 8 }}
          />
        </>
      ) : null}

      {invite ? (
        <View style={styles.together}>
          <View style={{ flex: 1 }}>
            <Text style={styles.togetherTitle}>Birlikte doldur</Text>
            <Text variant="sub">{together ? 'Yakında. Hazır olunca ilk sana haber vereceğiz.' : invite.hint}</Text>
          </View>
          <Switch
            value={together}
            onValueChange={toggleTogether}
            trackColor={{ false: colors.edge, true: colors.ink }}
            accessibilityLabel="Birlikte doldur"
          />
        </View>
      ) : null}

      <Button label="Defteri aç" disabled={!trimmed} onPress={submit} style={{ marginTop: 18 }} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 16 },
  together: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  togetherTitle: { fontFamily: fonts.heavy, fontSize: 15, lineHeight: 20, color: colors.ink },
});
