import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, labelStatut, radii, shadows, spacing, statusColors } from '../config/theme';
import { hapticLight } from '../utils/haptics';

export function BootstrapScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <View style={styles.bootstrap}>
      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: 'center' }}>
        <View style={styles.bootstrapLogo}>
          <Ionicons name="hand-left-outline" size={36} color="#fff" />
        </View>
        <Text style={styles.bootstrapBrand}>AppName</Text>
        <Text style={styles.bootstrapTagline}>Mise en relation simple et locale</Text>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
      </Animated.View>
    </View>
  );
}

export function InlineError({ message, onRetry, retryLabel = 'Réessayer' }) {
  if (!message) return null;
  return (
    <View style={styles.inlineError}>
      <Ionicons name="cloud-offline-outline" size={22} color={colors.danger} />
      <View style={{ flex: 1 }}>
        <Text style={styles.inlineErrorText}>{message}</Text>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.inlineRetry}>
            <Text style={styles.inlineRetryText}>{retryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <View style={styles.skeletonWrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.skeletonCard}>
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

export function Screen({ children, style, edges = ['top', 'left', 'right'] }) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
}

/** En-tête listes / onglets — style mobile (titre large + méta + FAB optionnel). */
export function PageHeader({
  eyebrow = 'AppName',
  title,
  meta,
  onAdd,
  addLabel = 'Ajouter',
  style,
}) {
  return (
    <View style={[styles.pageHeader, style]}>
      <View style={styles.pageHeaderLeft}>
        {eyebrow ? <Text style={styles.pageEyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        {meta ? <Text style={styles.pageMeta}>{meta}</Text> : null}
      </View>
      {onAdd ? (
        <Pressable onPress={onAdd} style={styles.pageFab} accessibilityLabel={addLabel}>
          <Ionicons name="add" size={26} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Alias : même look que PageHeader (plus de bandeau dégradé). */
export function HeroHeader({ title, subtitle, right, eyebrow = 'AppName', onAdd, addLabel }) {
  return (
    <View style={styles.heroCompat}>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        meta={subtitle}
        onAdd={onAdd}
        addLabel={addLabel}
        style={{ marginBottom: 0 }}
      />
      {right}
    </View>
  );
}

export function Title({ children }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Field({ label, multiline, style, error, ...props }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error && styles.inputError,
          style,
        ]}
        autoCapitalize="none"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function PasswordField({ label = 'Mot de passe', value, onChangeText, error, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.passwordWrap}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.passwordInput, error && styles.inputError]}
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          {...props}
        />
        <Pressable
          onPress={() => setVisible((v) => !v)}
          style={styles.passwordToggle}
          accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
        </Pressable>
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Button({ title, onPress, loading, variant = 'primary', disabled, icon, style }) {
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';
  const isDanger = variant === 'danger';
  const handlePress = () => {
    if (disabled || loading) return;
    hapticLight();
    onPress?.();
  };
  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.buttonSecondary,
        isGhost && styles.buttonGhost,
        isDanger && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            isGhost
              ? colors.button.ghostText
              : isSecondary
                ? colors.button.secondaryText
                : '#fff'
          }
        />
      ) : (
        <View style={styles.buttonInner}>
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={
                isGhost
                  ? colors.button.ghostText
                  : isSecondary
                    ? colors.button.secondaryText
                    : '#fff'
              }
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              (isSecondary || isGhost) && styles.buttonTextSecondary,
              isGhost && styles.buttonTextGhost,
              isDanger && styles.buttonTextDanger,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: spacing.md, minWidth: 180 }} />
      ) : null}
    </View>
  );
}

export function Card({ children, onPress, style }) {
  const content = <View style={[styles.card, shadows.card, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }}>
      {content}
    </Pressable>
  );
}

export function StatusBadge({ value }) {
  const key = String(value || '').toLowerCase();
  const palette = statusColors[key] || { bg: colors.primarySoft, fg: colors.primary };
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.badgeText, { color: palette.fg }]}>{labelStatut(value)}</Text>
    </View>
  );
}

export function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function StatPill({ label, value }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function LoadingBlock() {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Fab({ onPress, icon = 'add' }) {
  const insets = useSafeAreaInsets();
  // Au-dessus de la tab bar (~52) + zone système
  const bottom = 52 + Math.max(insets.bottom, 8) + spacing.md;
  return (
    <Pressable onPress={onPress} style={[styles.fab, shadows.card, { bottom }]}>
      <Ionicons name={icon} size={28} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  pageHeaderLeft: { flex: 1, paddingRight: 12 },
  pageEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  pageMeta: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  pageFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...shadows.card,
  },
  heroCompat: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.button.secondaryBorder,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  buttonDanger: { backgroundColor: colors.button.fillDanger },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.9 },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonTextSecondary: { color: colors.button.secondaryText },
  buttonTextGhost: { color: colors.button.ghostText },
  buttonTextDanger: { color: colors.button.text },
  errorBanner: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: colors.danger, fontSize: 14, flex: 1 },
  empty: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  sectionAction: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  loadingBlock: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  chipTextSelected: { color: '#fff' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  bootstrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  bootstrapLogo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  bootstrapBrand: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  bootstrapTagline: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  inlineErrorText: { color: colors.danger, fontSize: 14, lineHeight: 20 },
  inlineRetry: { marginTop: 8 },
  inlineRetryText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  skeletonWrap: { paddingVertical: spacing.sm },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonLineWide: {
    height: 14,
    width: '70%',
    borderRadius: 7,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  skeletonLine: {
    height: 12,
    width: '45%',
    borderRadius: 6,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 10,
    width: '30%',
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  inputError: { borderColor: colors.danger },
  fieldError: { marginTop: 4, fontSize: 12, color: colors.danger, fontWeight: '500' },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
