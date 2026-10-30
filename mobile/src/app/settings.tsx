import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Avatar,
  BackButton,
  Button,
  Chevron,
  Chip,
  Flat,
  Icon,
  ListItem,
  Raised,
  Section,
  Sheet,
  Text,
  TextButton,
} from '@/components/ui';
import { APP_NAME, DEFAULT_REMINDER, GOAL_ORDER, GOALS, REMINDER_TIMES, routes } from '@/constants';
import { useSheet } from '@/hooks/use-sheet';
import { comingSoon } from '@/lib/alerts';
import {
  cancelReminders,
  ensureNotificationPermission,
  scheduleReminders,
  showNotificationsOff,
} from '@/lib/notifications';
import { useUser } from '@/hooks/use-store';
import {
  eraseEverything,
  restartOnboarding,
  restoreDeletedDrawings,
  setGoal,
  setReminderAt,
  totalBrushes,
} from '@/store';
import { colors, fonts, space } from '@/theme';

const version = Constants.expoConfig?.version ?? '1.0.0';

// Settings. Opens from the profile circle on home. Design: design/a-ayarlar.html (1, 2, 4).
export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useUser();
  const reminder = user.reminderAt !== null;
  const toggleReminder = async (on: boolean) => {
    if (!on) {
      setReminderAt(null);
      cancelReminders();
      return;
    }
    if (!(await ensureNotificationPermission())) {
      showNotificationsOff();
      return;
    }
    setReminderAt(DEFAULT_REMINDER);
    scheduleReminders(user.goal, DEFAULT_REMINDER);
  };
  // Same option alerts as the onboarding reminder step. Every change reschedules.
  const pickTime = () =>
    Alert.alert('Hatırlatma saati', undefined, [
      ...REMINDER_TIMES.map((time) => ({
        text: time,
        onPress: () => {
          setReminderAt(time);
          scheduleReminders(user.goal, time);
        },
      })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  const pickGoal = () =>
    Alert.alert('Hedef', 'Hatırlatma günleri buna göre ayarlanır.', [
      ...GOAL_ORDER.map((goal) => ({
        text: `${GOALS[goal].label} · ${GOALS[goal].days}`,
        onPress: () => {
          setGoal(goal);
          if (user.reminderAt) scheduleReminders(goal, user.reminderAt);
        },
      })),
      { text: 'Vazgeç', style: 'cancel' as const },
    ]);
  const sheet = useSheet<'confirmDelete'>();
  const { brushes } = user;
  const total = totalBrushes(user);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        <BackButton />
        <Text variant="hand" style={styles.title}>
          Ayarlar
        </Text>

        {/* Profile and plan: info only, the chip is the action. */}
        <Flat style={styles.profile} radius={22}>
          <Avatar name={user.name} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.big}>{user.name || 'Sen'}</Text>
            <Text variant="sub">{user.subscriber ? `${user.plan} · ${user.planUntil}` : 'Ücretsiz'}</Text>
          </View>
          <Chip label={user.subscriber ? 'Yönet' : 'Abone ol'} onPress={() => comingSoon('Abonelik')} />
        </Flat>

        <Raised
          onPress={() => router.push(routes.brushes)}
          radius={22}
          containerStyle={{ marginTop: 16 }}
          style={styles.brush}
          accessibilityLabel={`${total} fırça, ayrıntılar`}>
          <Icon name="brush" size={24} color={colors.red} />
          <View style={{ flex: 1 }}>
            <Text style={styles.big}>{total} fırça</Text>
            <Text variant="sub">
              {user.subscriber
                ? `${brushes.subscription} abonelik · ${brushes.pack} paket · ${brushes.renewsOn}’da yenilenir`
                : `${brushes.pack} paket · süresi dolmaz`}
            </Text>
          </View>
          <Chevron />
        </Raised>

        <Section title="Hatırlatma">
          <ListItem
            label="Anı hatırlatması"
            right={
              <Switch
                value={reminder}
                onValueChange={toggleReminder}
                trackColor={{ false: colors.edgeSoft, true: colors.ink }}
                ios_backgroundColor={colors.edgeSoft}
                accessibilityLabel="Anı hatırlatması"
              />
            }
          />
          {/* An array, not a fragment: ListGroup puts dividers between array items. */}
          {reminder
            ? [
                <ListItem
                  key="saat"
                  label="Saat"
                  value={user.reminderAt ?? DEFAULT_REMINDER}
                  chevron
                  onPress={pickTime}
                />,
                <ListItem key="hedef" label="Hedef" value={GOALS[user.goal].label} chevron onPress={pickGoal} />,
              ]
            : null}
        </Section>

        <Section title="Anıların">
          <ListItem label="Sadece bu telefonda" detail="Fotoğrafların çizim için gider, saklanmaz." />
          {/* iOS does not tell apps whether iCloud backup is on, only that an account is signed in. */}
          <ListItem label="iCloud hesabı" value="Bağlı" valueColor={colors.ok} />
          <ListItem icon="dl" label="Tüm çizimleri dışa aktar" chevron onPress={() => comingSoon('Dışa aktar')} />
        </Section>

        <Section title="Hesap">
          <ListItem
            icon="me"
            label="Apple ile bağla"
            detail="Fırçan ve aboneliğin yeni telefona taşınsın"
            chevron
            onPress={() => comingSoon('Apple ile bağla')}
          />
          <ListItem icon="redo" label="Satın alımları geri yükle" chevron onPress={() => comingSoon('Geri yükle')} />
        </Section>

        <Section title="Destek">
          <ListItem icon="chat" label="Bize yaz" chevron onPress={() => comingSoon('Bize yaz')} />
          <ListItem label="Uygulamayı değerlendir" chevron onPress={() => comingSoon('Değerlendir')} />
          <ListItem label="Gizlilik" chevron onPress={() => comingSoon('Gizlilik')} />
          <ListItem label="Kullanım şartları" chevron onPress={() => comingSoon('Kullanım şartları')} />
        </Section>

        <Section>
          <ListItem label="Verilerimi sil" danger onPress={() => sheet.open('confirmDelete')} />
        </Section>

        {/* Development builds only, never in the store app. */}
        {__DEV__ ? (
          <Section title="Geliştirici">
            <ListItem
              icon="redo"
              label="Onboarding'i baştan başlat"
              detail="İlk çizim mevcut verinin yerine geçer"
              chevron
              onPress={() => {
                restartOnboarding();
                router.replace(routes.onboarding);
              }}
            />
            <ListItem
              icon="img"
              label="Silinen çizimlerimi geri getir"
              detail="Kendi çizdiğin silinmiş anılar ve defterleri"
              chevron
              onPress={async () => {
                const count = await restoreDeletedDrawings();
                Alert.alert(count ? `${count} anı geri geldi` : 'Geri getirilecek çizim yok');
              }}
            />
          </Section>
        ) : null}

        <Text variant="sub" style={styles.version}>
          {APP_NAME} {version}
        </Text>
      </ScrollView>

      <Sheet visible={sheet.is('confirmDelete')} onClose={sheet.close}>
        <Text variant="sec" style={{ fontSize: 24, lineHeight: 30, textAlign: 'center' }}>
          Her şey silinsin mi?
        </Text>
        <Text variant="sub" style={styles.sheetText}>
          Bu telefondaki tüm defterler ve anılar silinir. Hesabın ve kalan {total} fırçan da silinir. Geri alınamaz.
        </Text>
        {user.subscriber ? (
          <Flat radius={16} style={styles.note}>
            <Text style={styles.noteText}>
              Aboneliğin Apple üzerinden devam eder. İptal için: Ayarlar › Apple Kimliği › Abonelikler.
            </Text>
          </Flat>
        ) : null}
        <Button
          variant="secondary"
          icon="dl"
          label="Önce çizimleri dışa aktar"
          size="m"
          style={{ marginTop: 20 }}
          onPress={() => comingSoon('Dışa aktar')}
        />
        <Button
          variant="danger"
          label="Her şeyi sil"
          style={{ marginTop: 14 }}
          // Everything on the phone goes and the app starts over at onboarding.
          onPress={() =>
            sheet.then(() => {
              eraseEverything();
              cancelReminders();
              router.replace(routes.onboarding);
            })
          }
        />
        <TextButton label="Vazgeç" onPress={sheet.close} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.gutter },
  title: { fontSize: 44, lineHeight: 48, marginTop: 14 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  big: { fontFamily: fonts.heavy, fontSize: 17, lineHeight: 22, color: colors.ink },
  brush: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  version: { textAlign: 'center', marginTop: 22, fontSize: 12 },
  sheetText: { textAlign: 'center', marginTop: 10, lineHeight: 20 },
  note: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 14 },
  noteText: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18, color: colors.ink },
});
