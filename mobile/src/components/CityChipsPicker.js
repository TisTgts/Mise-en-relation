import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip } from './ui';
import { colors, spacing } from '../config/theme';
import { useCountry } from '../contexts/CountryContext';

export default function CityChipsPicker({ label, selected = [], onChange, multi = true }) {
  const { cities, loading } = useCountry();
  const selectedSet = new Set(selected || []);

  const toggle = (name) => {
    if (!multi) {
      onChange?.([name]);
      return;
    }
    if (selectedSet.has(name)) {
      onChange?.(selected.filter((v) => v !== name));
    } else {
      onChange?.([...(selected || []), name]);
    }
  };

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {loading && !cities.length ? (
        <Text style={styles.hint}>Chargement des villes…</Text>
      ) : (
        <View style={styles.chips}>
          {cities.map((city) => (
            <Chip
              key={city.name}
              label={city.name}
              selected={selectedSet.has(city.name)}
              onPress={() => toggle(city.name)}
            />
          ))}
        </View>
      )}
      {selected?.length ? (
        <Pressable onPress={() => onChange?.([])} style={styles.clearBtn}>
          <Text style={styles.clearText}>Effacer la sélection</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: { fontSize: 12, color: colors.textMuted },
  clearBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  clearText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
