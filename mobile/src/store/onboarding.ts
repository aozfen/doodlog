// Whether onboarding is finished, kept in AsyncStorage. It decides the first screen
// (onboarding or home), so it lives apart from the Evolu data.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';

type OnboardingState = {
  /** null: never saved here yet (an install from before this store); loadStore fills it. */
  onboarded: boolean | null;
  setOnboarded: (onboarded: boolean) => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboarded: null,
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: STORAGE_KEYS.onboarding,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ onboarded }) => ({ onboarded }),
      // loadStore() waits for this, so the first screen never sees an unread value.
      skipHydration: true,
    },
  ),
);

/** Reads the saved value. Call once at launch, before the first screen. */
export const loadOnboarding = () => useOnboardingStore.persist.rehydrate();

export const setOnboarded = (onboarded: boolean) => useOnboardingStore.getState().setOnboarded(onboarded);
