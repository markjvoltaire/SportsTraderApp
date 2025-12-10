import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import WelcomeScreen from "./Screens/WelcomeScreen";
import LoginScreen from "./Screens/LoginScreen";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import HomeScreen from "./Screens/HomeScreen";
import MarketsScreen from "./Screens/MarketsScreen";
import PortfolioScreen from "./Screens/PortfolioScreen";
import ProfileScreen from "./Screens/ProfileScreen";
import MarketDetailScreen from "./Screens/MarketDetailScreen";
import { Colors, Spacing, Typography } from "./src/constants/theme";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MarketsStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeList" component={HomeScreen} />
      <HomeStack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: false,
          headerBackTitle: "",
          headerTintColor: Colors.textPrimary,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        })}
      />
    </HomeStack.Navigator>
  );
}

function MarketsStackScreen() {
  return (
    <MarketsStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketsStack.Screen name="MarketsList" component={MarketsScreen} />
      <MarketsStack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          headerTitle: "",
          headerBackTitleVisible: false,
          headerBackTitle: "",
          headerTintColor: Colors.textPrimary,
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        })}
      />
    </MarketsStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Welcome"
    >
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
      <AuthStack.Screen name="App" component={AppNavigator} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { session } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketsStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
        }}
      />
      {session && (
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Always show the main app (HomeScreen) as initial screen
  // Users can access login/auth screens from Profile tab if needed
  return <AppNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    borderRadius: 0,
    backgroundColor: Colors.background,
    opacity: 1,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    marginHorizontal: Spacing.xs,
  },
  tabLabel: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
