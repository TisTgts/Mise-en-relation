import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initAppSecurity } from './src/bootstrap/security';
import { AuthProvider } from './src/contexts/AuthContext';
import { CountryProvider } from './src/contexts/CountryContext';
import { AppDataProvider } from './src/contexts/AppDataContext';
import { ToastProvider } from './src/contexts/ToastContext';
import RootNavigator from './src/navigation/RootNavigator';
import MessageNotificationWatcher from './src/components/MessageNotificationWatcher';

initAppSecurity();

export default function App() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
