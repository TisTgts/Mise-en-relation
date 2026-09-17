import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'toghinis_onboarding_done_v1';

export async function hasCompletedOnboarding() {
  try {
    return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function markOnboardingDone() {
  try {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
  } catch {
    /* ignore */
  }
}
