import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../contexts/AppDataContext';
import { BootstrapScreen } from '../components/ui';
import PushNotificationHandler from '../components/PushNotificationHandler';
import { colors } from '../config/theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

import ClientHomeScreen from '../screens/client/HomeScreen';
import BesoinsListScreen from '../screens/client/BesoinsListScreen';
import BesoinCreateScreen from '../screens/client/BesoinCreateScreen';
import BesoinEditScreen from '../screens/client/BesoinEditScreen';
import BesoinDetailScreen from '../screens/client/BesoinDetailScreen';
import BesoinMatchingScreen from '../screens/client/BesoinMatchingScreen';

import FournisseurHomeScreen from '../screens/fournisseur/HomeScreen';
import PrestationsListScreen from '../screens/fournisseur/PrestationsListScreen';
import PrestationCreateScreen from '../screens/fournisseur/PrestationCreateScreen';
import PrestationMatchingScreen from '../screens/fournisseur/PrestationMatchingScreen';
import PrestationEditScreen from '../screens/fournisseur/PrestationEditScreen';
import PrestationDetailScreen from '../screens/fournisseur/PrestationDetailScreen';

import CollaborationsScreen from '../screens/shared/CollaborationsScreen';
import CollaborationDetailScreen from '../screens/shared/CollaborationDetailScreen';
import MessageThreadScreen from '../screens/shared/MessageThreadScreen';
import MessagesScreen from '../screens/common/MessagesScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const ClientTab = createBottomTabNavigator();
const FournisseurTab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

export const navigationRef = createNavigationContainerRef();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.primary,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

function tabIcon(name, focusedName) {
  return ({ color, size, focused }) => (
    <Ionicons name={focused ? focusedName || name : name} size={size} color={color} />
  );
}

const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primaryDark,
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

/** Évite le chevauchement avec la barre système Android / iPhone. */
function useTabBarStyle() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  return {
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    height: 52 + bottom,
    paddingTop: 6,
    paddingBottom: bottom,
  };
}

function tabBadge(count) {
  if (!count || count <= 0) return undefined;
  return count > 9 ? '9+' : count;
}

function ClientTabs() {
  const tabBarStyle = useTabBarStyle();
  const { unreadMessages, collabActions } = useAppData();
  return (
    <ClientTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <ClientTab.Screen
        name="HomeTab"
        component={ClientHomeScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <ClientTab.Screen
        name="BesoinsTab"
        component={BesoinsListScreen}
        options={{
          title: 'Besoins',
          tabBarIcon: tabIcon('construct-outline', 'construct'),
        }}
      />
      <ClientTab.Screen
        name="CollabTab"
        component={CollaborationsScreen}
        options={{
          title: 'Collab.',
          tabBarIcon: tabIcon('people-outline', 'people'),
          tabBarBadge: tabBadge(collabActions),
        }}
      />
      <ClientTab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles'),
          tabBarBadge: tabBadge(unreadMessages),
        }}
      />
      <ClientTab.Screen
        name="ProfilTab"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </ClientTab.Navigator>
  );
}

function FournisseurTabs() {
  const tabBarStyle = useTabBarStyle();
  const { unreadMessages, collabActions } = useAppData();
  return (
    <FournisseurTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle,
        tabBarLabelStyle: { fontWeight: '600', fontSize: 11 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <FournisseurTab.Screen
        name="HomeTab"
        component={FournisseurHomeScreen}
        options={{
          title: 'Accueil',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <FournisseurTab.Screen
        name="PrestationsTab"
        component={PrestationsListScreen}
        options={{
          title: 'Prestations',
          tabBarIcon: tabIcon('briefcase-outline', 'briefcase'),
        }}
      />
      <FournisseurTab.Screen
        name="CollabTab"
        component={CollaborationsScreen}
        options={{
          title: 'Collab.',
          tabBarIcon: tabIcon('people-outline', 'people'),
          tabBarBadge: tabBadge(collabActions),
        }}
      />
      <FournisseurTab.Screen
        name="MessagesTab"
        component={MessagesScreen}
        options={{
          title: 'Messages',
          tabBarIcon: tabIcon('chatbubbles-outline', 'chatbubbles'),
          tabBarBadge: tabBadge(unreadMessages),
        }}
      />
      <FournisseurTab.Screen
        name="ProfilTab"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </FournisseurTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppStacks({ role }) {
  const Tabs = role === 'fournisseur' ? FournisseurTabs : ClientTabs;
  return (
    <RootStack.Navigator screenOptions={stackScreenOptions}>
      <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <RootStack.Screen name="BesoinCreate" component={BesoinCreateScreen} options={{ title: 'Nouveau besoin' }} />
      <RootStack.Screen name="BesoinEdit" component={BesoinEditScreen} options={{ title: 'Modifier le besoin' }} />
      <RootStack.Screen name="BesoinDetail" component={BesoinDetailScreen} options={{ title: 'Détail besoin' }} />
      <RootStack.Screen name="BesoinMatching" component={BesoinMatchingScreen} options={{ title: 'Matching' }} />
      <RootStack.Screen name="PrestationCreate" component={PrestationCreateScreen} options={{ title: 'Nouvelle prestation' }} />
      <RootStack.Screen name="PrestationMatching" component={PrestationMatchingScreen} options={{ title: 'Besoins correspondants' }} />
      <RootStack.Screen name="PrestationEdit" component={PrestationEditScreen} options={{ title: 'Modifier la prestation' }} />
      <RootStack.Screen name="PrestationDetail" component={PrestationDetailScreen} options={{ title: 'Prestation' }} />
      <RootStack.Screen name="CollaborationDetail" component={CollaborationDetailScreen} options={{ title: 'Collaboration' }} />
      <RootStack.Screen name="MessageThread" component={MessageThreadScreen} options={{ title: 'Messages' }} />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, bootstrapping, type_utilisateur, user } = useAuth();

  if (bootstrapping) {
    return <BootstrapScreen />;
  }

  const role = type_utilisateur || user?.type_utilisateur;

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      {isAuthenticated ? <PushNotificationHandler navigationRef={navigationRef} /> : null}
      {!isAuthenticated ? <AuthNavigator /> : <AppStacks role={role} />}
    </NavigationContainer>
  );
}
