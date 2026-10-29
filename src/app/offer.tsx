import { router } from 'expo-router';
import { View } from 'react-native';

import { ExitOffer } from '@/components/paywall/exit-offer';
import { colors } from '@/theme';

// Exit offer opened from the home badge. Design: same as the onboarding offer step.
export default function OfferScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ExitOffer onClose={() => router.back()} />
    </View>
  );
}
