import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorBanner, Field, PasswordField } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing } from '../../config/theme';
import { hapticSuccess, hapticError } from '../../utils/haptics';

const ROLES = [
  { value: 'client', label: 'Client', hint: 'Je publie des besoins' },
  { value: 'fournisseur', label: 'Fournisseur', hint: 'Je propose des prestations' },
];

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { register, loading, error, clearError } = useAuth();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    telephone: '',
    type_utilisateur: 'client',
  });
  const [fieldError, setFieldError] = useState(null);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async () => {
    clearError();
    setFieldError(null);

    if (!form.email.trim()) {
      setFieldError('Email requis');
      return;
    }
    if (form.password.length < 8) {
      setFieldError('Mot de passe : 8 caractères minimum');
      return;
    }
    if (form.password !== form.password_confirm) {
      setFieldError('Les mots de passe ne correspondent pas');
      return;
    }

    const result = await register({
      ...form,
      email: form.email.trim(),
      username: form.username.trim() || form.email.trim().split('@')[0],
    });
    if (result?.success) hapticSuccess();
    else hapticError();
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.brand}>Créer un compte</Text>
            <Text style={styles.subtitle}>Rejoignez Toghinis en tant que client ou fournisseur.</Text>
          </View>

          <View style={styles.form}>
            <ErrorBanner message={error || fieldError} />

            <Text style={styles.section}>Je suis</Text>
            <View style={styles.roles}>
              {ROLES.map((role) => {
                const active = form.type_utilisateur === role.value;
                return (
                  <Pressable
                    key={role.value}
                    onPress={() => set('type_utilisateur', role.value)}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                  >
                    <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>
                      {role.label}
                    </Text>
                    <Text style={styles.roleHint}>{role.hint}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Field label="Prénom" value={form.first_name} onChangeText={(v) => set('first_name', v)} autoCapitalize="words" />
            <Field label="Nom" value={form.last_name} onChangeText={(v) => set('last_name', v)} autoCapitalize="words" />
            <Field
              label="Email"
              value={form.email}
              onChangeText={(v) => set('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Téléphone"
              value={form.telephone}
              onChangeText={(v) => set('telephone', v)}
              keyboardType="phone-pad"
            />
            <PasswordField
              label="Mot de passe"
              value={form.password}
              onChangeText={(v) => set('password', v)}
              placeholder="8 caractères minimum"
            />
            <PasswordField
              label="Confirmer"
              value={form.password_confirm}
              onChangeText={(v) => set('password_confirm', v)}
            />

            <Button title="Créer mon compte" onPress={onSubmit} loading={loading} icon="person-add-outline" />

            <Pressable
              onPress={() => {
                clearError();
                navigation.goBack();
              }}
              style={styles.link}
            >
              <Text style={styles.linkText}>
                Déjà un compte ? <Text style={styles.linkBold}>Se connecter</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  logo: { width: 64, height: 64, borderRadius: 16, marginBottom: spacing.md },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  section: { fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  roles: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  roleCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleLabel: { fontWeight: '800', color: colors.text, marginBottom: 4 },
  roleLabelActive: { color: colors.primaryDark },
  roleHint: { fontSize: 12, color: colors.textMuted },
  link: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontSize: 14, color: colors.textMuted },
  linkBold: { color: colors.primary, fontWeight: '700' },
});
