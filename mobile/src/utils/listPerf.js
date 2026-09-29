/** Props FlatList communes — moins de travail au premier paint. */
import { Platform } from 'react-native';

export const LIST_PERF = {
  initialNumToRender: 8,
  maxToRenderPerBatch: 8,
  windowSize: 7,
  // Sur Android, removeClippedSubviews provoque parfois cellules vides / taps fantômes.
  ...(Platform.OS === 'ios' ? { removeClippedSubviews: true } : {}),
};
