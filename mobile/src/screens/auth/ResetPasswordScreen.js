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
import { colors, radii, spacing } from '../../config/theme';
import { confirmPasswordReset, extractErrorMessage } from '../../services/authService';
import { hapticSuccess, hapticError } from '../../utils/haptics';

export default function ResetPasswordScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const initialEmail = route.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(route.params?.devCode || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email requis');
      return;
    }
    if (!code.trim()) {
      setError('Code requis');
      return;
    }
    if (password.length < 8) {
      setError('Mot de passe : 8 caractères minimum');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(email.trim(), code.trim(), password);
      hapticSuccess();
      navigation.navigate('Login');
    } catch (e) {
      hapticError();
      setError(extractErrorMessage(e, 'Réinitialisation impossible'));
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.brand}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>Saisissez le code reçu et votre nouveau mot de passe.</Text>
          </View>

          <View style={styles.form}>
            <ErrorBanner message={error} />

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="6 chiffres"
            />
            <PasswordField
              label="Nouveau mot de passe"
              value={password}
              onChangeText={setPassword}
              placeholder="8 caractères minimum"
            />
            <PasswordField
              label="Confirmer"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              placeholder="Répétez le mot de passe"
            />

            <Button title="Enregistrer" onPress={onSubmit} loading={loading} style={styles.submitBtn} />

            <Pressable onPress={() => navigation.navigate('Login')} style={styles.link}>
              <Text style={styles.linkText}>Retour à la connexion</Text>
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
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: spacing.md },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  submitBtn: { marginTop: spacing.sm },
  link: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});
