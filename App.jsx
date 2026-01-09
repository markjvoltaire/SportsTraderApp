import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { PrivyProvider } from "@privy-io/expo";
import { PrivyElements } from "@privy-io/expo/ui";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { SupabaseProvider, useSupabase } from "./src/contexts/SupabaseContext";
import WelcomeScreen from "./Screens/WelcomeScreen";
import LoginScreen from "./Screens/LoginScreen";
import LottieLoader from "./src/components/ui/LottieLoader";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import HomeScreen from "./Screens/HomeScreen";
import PortfolioScreen from "./Screens/PortfolioScreen";
import ProfileScreen from "./Screens/ProfileScreen";
import AddFundsScreen from "./Screens/AddFundsScreen";
import DepositAmountScreen from "./Screens/DepositAmountScreen";
import MoonPayScreen from "./Screens/MoonPayScreen";
import MarketDetailScreen from "./Screens/MarketDetailScreen";
import { Colors, Spacing, Typography } from "./src/constants/theme";
import ChartScreen from "./Screens/ChartScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";

// 1. Import Crossmint Provider
import { CrossmintProvider } from "@crossmint/client-sdk-react-native-ui";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false, headerBackTitle: "Home" }}
      />

      <HomeStack.Screen
        name="Chart"
        component={ChartScreen}
        options={({ route }) => {
          return {
            // Custom in-screen header to match the matchup UI reference
            headerShown: false,
          };
        }}
      />
      <HomeStack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="DepositAmount"
        component={DepositAmountScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="AddFunds"
        component={AddFundsScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="MoonPay"
        component={MoonPayScreen}
        options={{ headerShown: false }}
      />
    </ProfileStack.Navigator>
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
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { session } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar, // dark theme    backgroundColor: "black",
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {session && (
        <Tab.Screen
          name="Profile"
          component={ProfileStackScreen}
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}

// Component to wait for Supabase initialization before rendering app
function SupabaseInitializedWrapper({ children }) {
  const { isInitialized } = useSupabase();

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <LottieLoader size="large" />
      </View>
    );
  }

  return children;
}

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieLoader size="large" />
      </View>
    );
  }

  // Show auth stack (Welcome/Login) if not signed in, otherwise show main app
  return session ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  // Get Privy App ID and Client ID from environment variables
  const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
  const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;
  const CROSSMINT_API_KEY =
    process.env.EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY || "";

  return (
    // <ErrorBoundary>
    <CrossmintProvider apiKey={CROSSMINT_API_KEY}>
      <PrivyProvider
        appId={PRIVY_APP_ID || "placeholder-app-id"}
        clientId={PRIVY_CLIENT_ID || "placeholder-client-id"}
        config={{
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          appearance: {
            theme: "dark",
            accentColor: "#6366F1",
          },
        }}
      >
        <SupabaseProvider>
          <SupabaseInitializedWrapper>
            <AuthProvider>
              <SafeAreaProvider>
                <NavigationContainer>
                  <StatusBar style="light" />
                  <RootNavigator />
                  <PrivyElements />
                </NavigationContainer>
              </SafeAreaProvider>
            </AuthProvider>
          </SupabaseInitializedWrapper>
        </SupabaseProvider>
      </PrivyProvider>
    </CrossmintProvider>
    // </ErrorBoundary>
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
    backgroundColor: "white",
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
