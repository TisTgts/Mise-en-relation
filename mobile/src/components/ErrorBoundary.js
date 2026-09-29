import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './ui';
import { colors, spacing } from '../config/theme';

/**
 * Empêche un crash de rendu d’afficher un écran blanc total.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('ErrorBoundary', error, info?.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.sub}>
            Réessayez. Si le problème continue, fermez puis rouvrez l’application.
          </Text>
          <Button title="Réessayer" onPress={this.handleRetry} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sub: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
