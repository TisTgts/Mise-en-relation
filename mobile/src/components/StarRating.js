import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../config/theme';

export default function StarRating({ value = 0, onChange, size = 22, showValue = false }) {
  const interactive = typeof onChange === 'function';

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const icon = filled ? 'star' : 'star-outline';
        const color = filled ? colors.warning : colors.border;
        if (interactive) {
          return (
            <Pressable key={star} onPress={() => onChange(star)} hitSlop={8} style={styles.starBtn}>
              <Ionicons name={icon} size={size} color={color} />
            </Pressable>
          );
        }
        return <Ionicons key={star} name={icon} size={size} color={color} style={styles.star} />;
      })}
      {showValue && value ? (
        <Text style={styles.value}>{Number(value).toFixed(1)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starBtn: { padding: 2 },
  star: { marginHorizontal: 1 },
  value: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
