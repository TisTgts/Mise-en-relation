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
import { hapticLight, hapticSuccess, hapticError } from '../../utils/haptics';

const DEMO_ACCOUNTS = [
  { label: 'Client', email: 'client@demo.local', password: 'demo1234' },
  { label: 'Fournisseur', email: 'fournisseur@demo.local', password: 'demo1234' },
];

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fillDemo = (account) => {
    hapticLight();
    clearError();
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
  };

  const onSubmit = async () => {
    clearError();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Email requis';
    if (!password) nextErrors.password = 'Mot de passe requis';
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await login(email.trim(), password);
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
            <Text style={styles.brand}>AppName</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          <View style={styles.form}>
            <ErrorBanner message={error} />

            <Field
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (fieldErrors.email) setFieldErrors((e) => ({ ...e, email: null }));
              }}
              error={fieldErrors.email}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="vous@exemple.com"
            />
            <PasswordField
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: null }));
              }}
              error={fieldErrors.password}
              placeholder="Mot de passe"
              onSubmitEditing={onSubmit}
            />

            <Pressable
              onPress={() => {
                clearError();
                navigation.navigate('ForgotPassword');
              }}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>

            <Button title="Se connecter" onPress={onSubmit} loading={loading} style={styles.submitBtn} />

            <Pressable
              onPress={() => {
                clearError();
                navigation.navigate('Register');
              }}
              style={styles.registerLink}
            >
              <Text style={styles.registerText}>
                Pas de compte ? <Text style={styles.registerTextBold}>Créer un compte</Text>
              </Text>
            </Pressable>
          </View>

          {__DEV__ ? (
            <View style={styles.demoBlock}>
              <Text style={styles.demoLabel}>Comptes démo (demo1234)</Text>
              <View style={styles.demoRow}>
                {DEMO_ACCOUNTS.map((account) => (
                  <Pressable
                    key={account.label}
                    onPress={() => fillDemo(account)}
                    style={({ pressed }) => [styles.demoBtn, pressed && styles.demoBtnPressed]}
                  >
                    <Text style={styles.demoBtnText}>{account.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  submitBtn: { marginTop: spacing.sm },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  registerLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  registerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  registerTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
  demoBlock: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  demoRow: { flexDirection: 'row', gap: 8 },
  demoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoBtnPressed: { opacity: 0.85 },
  demoBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
