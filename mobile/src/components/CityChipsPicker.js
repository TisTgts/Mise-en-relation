import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chip, Field } from './ui';
import { colors, spacing } from '../config/theme';
import { useCountry } from '../contexts/CountryContext';

export default function CityChipsPicker({ label, selected = [], onChange, multi = true }) {
  const { cities, loading, refresh } = useCountry();
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
      ) : !cities.length ? (
        <>
          <View style={styles.unavailable}>
            <Text style={styles.hint}>Liste des villes indisponible.</Text>
            <Pressable onPress={refresh} hitSlop={8}>
              <Text style={styles.retry}>Réessayer</Text>
            </Pressable>
          </View>
          <Field
            label={multi ? 'Villes (séparées par des virgules)' : 'Ville'}
            value={(selected || []).join(', ')}
            onChangeText={(v) =>
              onChange?.(
                v
                  .split(',')
                  .map((s) => s.trimStart())
                  .filter((s, i, arr) => s || i === arr.length - 1)
              )
            }
            autoCapitalize="words"
            placeholder="Ex. Lomé, Sokodé"
          />
        </>
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
      {selected?.length && cities.length ? (
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
  unavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  retry: { fontSize: 13, fontWeight: '700', color: colors.primary },
  clearBtn: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  clearText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
