import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';

import { AuthProvider, useAuth, useHasAccess } from './src/context/AuthContext';
import {
  HomeScreen,
  SpeakScreen,
  RecordingScreen,
  FeedbackScreen,
  ListenReadScreen,
  ArticleDetailScreen,
  ChatScreen,
  ProfileScreen,
} from './src/screens';
import AuthScreen from './src/screens/AuthScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import type {
  TabParamList,
  SpeakStackParamList,
  ListenReadStackParamList,
} from './src/types';

// Theme colors
const COLORS = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  tabBar: '#6B7280', // Even lighter gray tab bar
  primary: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#9CA3AF',
  border: '#4B5563',
};

// Navigation types
type RootStackParamList = {
  Home: undefined;
  MainTabs: undefined;
};

type MainTabParamList = TabParamList;

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const SpeakStack = createNativeStackNavigator<SpeakStackParamList>();
const ListenReadStack = createNativeStackNavigator<ListenReadStackParamList>();

// Speak Tab Stack Navigator
function SpeakStackNavigator() {
  return (
    <SpeakStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <SpeakStack.Screen name="SpeakHome" component={SpeakScreen} />
      <SpeakStack.Screen name="Recording" component={RecordingScreen} />
      <SpeakStack.Screen name="Feedback" component={FeedbackScreen} />
    </SpeakStack.Navigator>
  );
}

// Listen & Read Tab Stack Navigator
function ListenReadStackNavigator() {
  return (
    <ListenReadStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <ListenReadStack.Screen name="ListenReadHome" component={ListenReadScreen} />
      <ListenReadStack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <ListenReadStack.Screen name="Recording" component={RecordingScreen} />
      <ListenReadStack.Screen name="Feedback" component={FeedbackScreen} />
    </ListenReadStack.Navigator>
  );
}

// Custom Tab Bar Icon Component - Icons only, no labels
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      {focused && <View style={styles.tabIndicator} />}
    </View>
  );
}

// Main Tab Navigator
function MainTabNavigator({ navigation }: { navigation: any }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="SpeakTab"
        component={SpeakStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎙️" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ListenReadTab"
        component={ListenReadStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎧" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💬" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Home Screen Wrapper with navigation
function HomeScreenWrapper({ navigation }: { navigation: any }) {
  const handleNavigateToTab = (tabName: string) => {
    navigation.navigate('MainTabs', { screen: tabName });
  };

  return <HomeScreen onNavigateToTab={handleNavigateToTab} />;
}

// Main Tabs Wrapper to pass navigation
function MainTabsWrapper({ navigation }: { navigation: any }) {
  return <MainTabNavigator navigation={navigation} />;
}

// Main Navigator with Home screen
function MainNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Home"
    >
      <RootStack.Screen name="Home" component={HomeScreenWrapper} />
      <RootStack.Screen name="MainTabs" component={MainTabsWrapper} />
    </RootStack.Navigator>
  );
}

// Root navigator - handles auth state
function RootNavigator() {
  const { session, isLoading } = useAuth();
  const hasAccess = useHasAccess();

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Not logged in - show auth screen
  if (!session) {
    return <AuthScreen />;
  }

  // Logged in but no access (trial expired) - show paywall
  if (!hasAccess) {
    return <PaywallScreen />;
  }

  // Logged in with access - show main app with Home and tabs
  return <MainNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 70,
    paddingTop: 10,
    paddingBottom: 20,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 26,
  },
  tabIconFocused: {
    transform: [{ scale: 1.15 }],
  },
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
});
