import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAppSecurity } from './src/bootstrap/security';
import ErrorBoundary from './src/components/ErrorBoundary';
import MessageNotificationWatcher from './src/components/MessageNotificationWatcher';
import { AuthProvider } from './src/contexts/AuthContext';
import { CountryProvider } from './src/contexts/CountryContext';
import { AppDataProvider } from './src/contexts/AppDataContext';
import { ToastProvider } from './src/contexts/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';

initAppSecurity();

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <CountryProvider>
            <AppDataProvider>
              <ToastProvider>
                <StatusBar style="dark" />
                <MessageNotificationWatcher />
                <RootNavigator />
              </ToastProvider>
            </AppDataProvider>
          </CountryProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
