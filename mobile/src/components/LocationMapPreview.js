import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { openInMaps, staticMapUrl } from '../utils/location';

export default function LocationMapPreview({ latitude, longitude, title, height = 160 }) {
  const url = staticMapUrl(latitude, longitude);
  if (!url) return null;

  const onOpen = () => {
    const mapsUrl = openInMaps(latitude, longitude, title);
    if (mapsUrl) Linking.openURL(mapsUrl);
  };

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.92 }]}>
        <Image source={{ uri: url }} style={[styles.map, { height }]} resizeMode="cover" />
        <View style={styles.overlay}>
          <Ionicons name="map-outline" size={16} color="#fff" />
          <Text style={styles.overlayText}>Ouvrir la carte</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: spacing.sm },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  mapBtn: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { width: '100%', backgroundColor: colors.background },
  overlay: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  overlayText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
