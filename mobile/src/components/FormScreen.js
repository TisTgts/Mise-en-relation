import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Screen } from './ui';
import { spacing } from '../config/theme';

// Android est en softwareKeyboardLayoutMode "pan" : la fenêtre n'est pas redimensionnée,
// il faut un espace sous le contenu pour pouvoir défiler au-dessus du clavier.
export function useAndroidKeyboardHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setHeight(e?.endCoordinates?.height || 0);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return height;
}

export default function FormScreen({ children, style, contentStyle, edges }) {
  const keyboardHeight = useAndroidKeyboardHeight();
  return (
    <Screen style={[styles.pad, style]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, contentStyle]}
        >
          {children}
          {keyboardHeight > 0 ? <View style={{ height: keyboardHeight }} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { flex: 1 },
  content: { paddingBottom: 48, paddingHorizontal: spacing.lg },
});
