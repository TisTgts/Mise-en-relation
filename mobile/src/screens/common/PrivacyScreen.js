import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/ui';
import { colors, radii, spacing } from '../../config/theme';
import { PRIVACY_POLICY_URL } from '../../config/legal';

const SECTIONS = [
  {
    title: 'Données collectées',
    body: 'Compte (nom, email, téléphone), profil entreprise ou fournisseur, besoins, prestations, messages et pièces jointes échangés dans le cadre d’une collaboration.',
  },
  {
    title: 'Utilisation',
    body: 'Ces données servent uniquement à la mise en relation, au matching, au suivi des collaborations et au support. Elles ne sont pas vendues à des tiers.',
  },
  {
    title: 'Stockage et sécurité',
    body: 'Les jetons de session sont stockés de façon sécurisée sur l’appareil. Les échanges avec l’API passent en HTTPS en production.',
  },
  {
    title: 'Vos droits',
    body: 'Vous pouvez consulter et mettre à jour votre profil dans l’app, et supprimer votre compte depuis Profil (anonymisation).',
  },
];

export default function PrivacyScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <Text style={styles.lead}>
          Résumé de la façon dont Toghinis traite vos données dans l’application mobile.
        </Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}
        <Pressable
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
          style={styles.linkRow}
        >
          <Text style={styles.linkText}>Version complète sur le site</Text>
          <Ionicons name="open-outline" size={16} color={colors.primary} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  cardBody: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
