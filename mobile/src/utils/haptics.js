import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function canHaptic() {
  return Platform.OS !== 'web';
}

export async function hapticLight() {
  if (!canHaptic()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* ignore */
  }
}

export async function hapticMedium() {
  if (!canHaptic()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* ignore */
  }
}

export async function hapticSuccess() {
  if (!canHaptic()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* ignore */
  }
}

export async function hapticError() {
  if (!canHaptic()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    /* ignore */
  }
}
