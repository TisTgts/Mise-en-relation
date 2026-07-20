import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';

/**
 * Indicateur d'étapes pour les wizards de création.
 * @param {{ steps: string[], current: number, onStepPress?: (index: number) => void }} props
 */
export default function FormStepper({ steps, current, onStepPress }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <React.Fragment key={label}>
              {index > 0 ? (
                <View style={[styles.line, (done || active) && styles.lineOn]} />
              ) : null}
              <Pressable
                onPress={() => {
                  if (onStepPress && index < current) onStepPress(index);
                }}
                disabled={!onStepPress || index >= current}
                style={styles.step}
                accessibilityLabel={`Étape ${index + 1} : ${label}`}
              >
                <View
                  style={[
                    styles.dot,
                    done && styles.dotDone,
                    active && styles.dotActive,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.dotText, active && styles.dotTextActive]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.label, (active || done) && styles.labelOn]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
      <Text style={styles.meta}>
        Étape {current + 1} sur {steps.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    maxWidth: 72,
    zIndex: 1,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 15,
    marginHorizontal: -4,
  },
  lineOn: {
    backgroundColor: colors.primary,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  dotTextActive: {
    color: '#fff',
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  labelOn: {
    color: colors.primaryDark,
  },
  meta: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
