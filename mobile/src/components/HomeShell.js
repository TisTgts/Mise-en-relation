import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows, spacing } from '../config/theme';

export function HomeHero({
  firstName,
  subtitle,
  ctaLabel,
  onCta,
  roleLabel,
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, [fade, slide]);

  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary, '#3B82F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.orbA} />
      <View style={styles.orbB} />

      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <Text style={styles.brand}>Toghinis</Text>
        <Text style={styles.role}>{roleLabel}</Text>
        <Text style={styles.hello}>
          Bonjour{firstName ? `, ${firstName}` : ''}
        </Text>
        <Text style={styles.heroSub}>{subtitle}</Text>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCta();
          }}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] }]}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
        </Pressable>
      </Animated.View>
    </LinearGradient>
  );
}

export function ActivityStrip({ items }) {
  return (
    <View style={[styles.strip, shadows.card]}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? <View style={styles.stripDivider} /> : null}
          <View style={styles.stripItem}>
            <Text style={styles.stripValue}>{item.value}</Text>
            <Text style={styles.stripLabel}>{item.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

export function ShortcutRow({ icon, label, hint, onPress }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.shortcut, pressed && { backgroundColor: colors.primaryMuted }]}
    >
      <View style={styles.shortcutIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.shortcutLabel}>{label}</Text>
        {hint ? <Text style={styles.shortcutHint}>{hint}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

export function ActivityItem({ title, meta, badge, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.activityItem, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.activityDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle} numberOfLines={2}>
          {title}
        </Text>
        {meta ? <Text style={styles.activityMeta}>{meta}</Text> : null}
      </View>
      {badge}
    </Pressable>
  );
}

export function HomeSection({ title, actionLabel, onAction, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function QuietEmpty({ icon, title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={28} color={colors.primaryMid} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 8,
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -40,
    right: -30,
  },
  orbB: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(14,165,233,0.22)',
    bottom: 20,
    left: -40,
  },
  brand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  role: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
  },
  hello: {
    marginTop: spacing.md,
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.9,
    lineHeight: 40,
  },
  heroSub: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 320,
  },
  cta: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    height: 48,
    borderRadius: radii.md,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  strip: {
    marginTop: -22,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  stripItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  stripDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  stripValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  stripLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  shortcutHint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  activityMeta: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptySub: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: spacing.md,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontWeight: '700',
    color: colors.primaryDark,
    fontSize: 13,
  },
});
