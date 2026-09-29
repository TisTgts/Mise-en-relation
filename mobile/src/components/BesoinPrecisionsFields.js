import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Chip, Field } from './ui';
import { colors, spacing } from '../config/theme';

export function missingRequiredPrecisions(fields, values) {
  const errors = {};
  (fields || []).forEach((f) => {
    if (f.required && !String(values?.[f.key] || '').trim()) {
      errors[f.key] = 'Réponse obligatoire';
    }
  });
  return errors;
}

export function cleanPrecisions(values) {
  return Object.fromEntries(
    Object.entries(values || {})
      .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      .filter(([, v]) => v !== '' && v != null)
  );
}

export default function BesoinPrecisionsFields({ fields, values, errors, onChange }) {
  return (fields || []).map((f) => {
    const label = `${f.label}${f.required ? ' *' : ''}`;
    const current = values?.[f.key] || '';
    if (Array.isArray(f.options) && f.options.length > 0) {
      const options = current && !f.options.includes(current) ? [current, ...f.options] : f.options;
      return (
        <View key={f.key} style={styles.question}>
          <Text style={styles.label}>{label}</Text>
          {f.help ? <Text style={styles.help}>{f.help}</Text> : null}
          <View style={styles.chips}>
            {options.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                selected={current === opt}
                onPress={() => onChange(f.key, current === opt ? '' : opt)}
              />
            ))}
          </View>
          {errors?.[f.key] ? <Text style={styles.error}>{errors[f.key]}</Text> : null}
        </View>
      );
    }
    return (
      <View key={f.key}>
        <Field
          label={label}
          value={current}
          onChangeText={(v) => onChange(f.key, v)}
          error={errors?.[f.key]}
          autoCapitalize="sentences"
          placeholder={f.placeholder || ''}
        />
        {f.help ? <Text style={[styles.help, styles.helpAfterField]}>{f.help}</Text> : null}
      </View>
    );
  });
}

const styles = StyleSheet.create({
  question: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  help: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs },
  helpAfterField: { marginTop: -spacing.xs, marginBottom: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { fontSize: 12, color: colors.danger, marginTop: 2 },
});
