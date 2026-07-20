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
import { Button, ErrorBanner, Field } from '../../components/ui';
import { colors, radii, spacing } from '../../config/theme';
import { requestPasswordReset } from '../../services/authService';
import { extractErrorMessage } from '../../services/authService';
import { hapticSuccess, hapticError } from '../../utils/haptics';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Email requis');
      return;
    }
    setLoading(true);
    try {
      const data = await requestPasswordReset(email.trim());
      hapticSuccess();
      const msg = data.message || 'Code envoyé si le compte existe.';
      const withDev = data.dev_code ? `${msg}\n\nCode (dev) : ${data.dev_code}` : msg;
      setInfo(withDev);
      navigation.navigate('ResetPassword', {
        email: email.trim(),
        devCode: data.dev_code || '',
      });
    } catch (e) {
      hapticError();
      setError(extractErrorMessage(e, 'Demande impossible'));
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
            <Text style={styles.brand}>Mot de passe oublié</Text>
            <Text style={styles.subtitle}>
              Entrez votre email pour recevoir un code de réinitialisation.
            </Text>
          </View>

          <View style={styles.form}>
            <ErrorBanner message={error} />
            {info ? <Text style={styles.info}>{info}</Text> : null}

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              autoCapitalize="none"
              placeholder="vous@exemple.com"
            />

            <Button title="Envoyer le code" onPress={onSubmit} loading={loading} style={styles.submitBtn} />

            <Pressable onPress={() => navigation.goBack()} style={styles.link}>
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
  info: {
    marginBottom: spacing.md,
    color: colors.success,
    fontSize: 13,
    lineHeight: 18,
  },
  link: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm },
  linkText: { fontSize: 14, color: colors.primary, fontWeight: '700' },
});
