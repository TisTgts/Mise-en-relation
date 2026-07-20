import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';
import { hapticLight } from '../utils/haptics';

function ActionRow({ icon, label, subtitle, onPress, danger, disabled }) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        hapticLight();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
      disabled={disabled}
    >
      <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

/**
 * Bottom sheet d’actions (remplace Alert.alert pour le menu ⋮).
 */
export default function ActionSheet({
  visible,
  onClose,
  title,
  subtitle,
  badge,
  actions = [],
}) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.header}>
            {badge ? <View style={styles.badgeWrap}>{badge}</View> : null}
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
            ) : null}
          </View>

          <ScrollView bounces={false} style={styles.list}>
            {actions.map((action) => {
              const { key, ...rest } = action;
              return <ActionRow key={key || rest.label} {...rest} />;
            })}
          </ScrollView>

          <Pressable
            onPress={() => {
              hapticLight();
              onClose?.();
            }}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelText}>Fermer</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    maxHeight: '78%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  badgeWrap: { alignSelf: 'flex-start', marginBottom: 8 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 24,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  list: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: { opacity: 0.85 },
  rowDisabled: { opacity: 0.45 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: colors.dangerSoft },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowLabelDanger: { color: colors.danger },
  rowSub: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  cancelText: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
});
