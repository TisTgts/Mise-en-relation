import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip, Field } from './ui';
import { colors, spacing } from '../config/theme';
import { useCountry } from '../contexts/CountryContext';
import { formatLieuIntervention } from '../utils/location';

export default function LocationPicker({
  value,
  onChange,
  showQuartier = true,
  showAdresse = false,
  label = 'Lieu',
}) {
  const { cities, copy, loading } = useCountry();
  const ville = value?.ville || '';
  const quartier = value?.quartier || '';
  const adresse = value?.adresse || '';

  const selectedCity = useMemo(
    () => cities.find((c) => c.name === ville) || null,
    [cities, ville]
  );
  const quartiers = selectedCity?.quartiers || [];

  const update = (patch) => {
    const next = { ville, quartier, adresse, ...patch };
    onChange?.({
      ...next,
      label: formatLieuIntervention(next),
    });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>{label}</Text>
      {loading && !cities.length ? (
        <Text style={styles.hint}>Chargement des villes…</Text>
      ) : (
        <>
          <Text style={styles.label}>Ville</Text>
          <View style={styles.chips}>
            {cities.map((city) => (
              <Chip
                key={city.name}
                label={city.name}
                selected={ville === city.name}
                onPress={() => update({ ville: city.name, quartier: '' })}
              />
            ))}
          </View>

          {showQuartier && quartiers.length > 0 ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.sm }]}>Quartier</Text>
              <View style={styles.chips}>
                {quartiers.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    selected={quartier === q}
                    onPress={() => update({ quartier: q })}
                  />
                ))}
              </View>
            </>
          ) : null}

          {showAdresse ? (
            <Field
              label="Adresse précise (optionnel)"
              value={adresse}
              onChangeText={(v) => update({ adresse: v })}
              autoCapitalize="words"
              placeholder="Rue, repère…"
            />
          ) : null}

          {!ville && copy?.cities_placeholder ? (
            <Text style={styles.hint}>{copy.cities_placeholder}</Text>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  section: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
