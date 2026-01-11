import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
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
import GameDetail from "./Screens/GameDetail";
import EventDetail from "./Screens/EventDetail";
import { Colors, Spacing, Typography } from "./src/constants/theme";
import ChartScreen from "./Screens/ChartScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";
import SplashScreen from "./Screens/SplashScreen";

// 1. Import Crossmint Provider
import { CrossmintProvider } from "@crossmint/client-sdk-react-native-ui";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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
      <HomeStack.Screen
        name="GameDetail"
        component={GameDetail}
        options={{
          headerShown: false,
        }}
      />
      <HomeStack.Screen
        name="EventDetail"
        component={EventDetail}
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
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#999999",
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
  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
      <RootStack.Screen name="Main" component={AppNavigator} />
    </RootStack.Navigator>
  );
}

// Component to handle navigation based on auth state changes
function NavigationHandler({ navigationRef }) {
  const { session, loading } = useAuth();
  const lastSessionRef = React.useRef(null);
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (loading) return; // Wait for auth to finish loading
    if (!navigationRef?.isReady()) return; // Wait for navigation to be ready

    // Get the root navigation state to check which stack we're on
    const state = navigationRef.getState();
    const rootRouteName = state?.routes[state?.index]?.name;

    // Skip if we're on Splash - let SplashScreen handle initial navigation
    if (rootRouteName === "Splash") {
      lastSessionRef.current = session;
      isInitialMount.current = false;
      return;
    }

    // On initial mount, just track the session and return
    if (isInitialMount.current) {
      lastSessionRef.current = session;
      isInitialMount.current = false;
      return;
    }

    // Detect when user signs in or signs out
    const previousSession = lastSessionRef.current;
    const sessionChanged = previousSession !== session;
    const signedIn = session && !previousSession; // Session goes from null to truthy
    const signedOut = !session && previousSession; // Session goes from truthy to null

    // Check if we're on Auth stack (when on nested routes like "Login", root is still "Auth")
    const isOnAuthRoute = rootRouteName === "Auth";

    // If user signs in (session becomes truthy) and we're on Auth stack, navigate to Main
    if (signedIn && sessionChanged && isOnAuthRoute) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
      lastSessionRef.current = session;
      return; // Early return after navigation
    }

    // If user signs out (session becomes null) and we're on authenticated stack (Main), navigate to Auth
    // Check if we're on any authenticated route (Main or its nested routes)
    const isOnAuthenticatedRoute = rootRouteName === "Main";
    if (signedOut && sessionChanged && isOnAuthenticatedRoute) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
      lastSessionRef.current = session;
      return; // Early return after navigation
    }

    // Update the ref to track session changes
    lastSessionRef.current = session;
  }, [session, loading, navigationRef]);

  return null;
}

// Wrapper component that has access to both NavigationContainer ref and Auth context
function AppContent() {
  const navigationRef = useNavigationContainerRef();

  return (
    <>
      <NavigationHandler navigationRef={navigationRef} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  // Get Privy App ID and Client ID from environment variables
  const PRIVY_APP_ID = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
  const PRIVY_CLIENT_ID = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;
  const CROSSMINT_API_KEY =
    process.env.EXPO_PUBLIC_CROSSMINT_CLIENT_SIDE_API_KEY || "";

  // Validate critical environment variables in production builds
  // This helps catch configuration issues early
  if (!__DEV__) {
    if (!PRIVY_APP_ID || PRIVY_APP_ID === "placeholder-app-id") {
      console.error(
        "⚠️ EXPO_PUBLIC_PRIVY_APP_ID is missing or invalid in production build!"
      );
    }
    if (!PRIVY_CLIENT_ID || PRIVY_CLIENT_ID === "placeholder-client-id") {
      console.error(
        "⚠️ EXPO_PUBLIC_PRIVY_CLIENT_ID is missing or invalid in production build!"
      );
    }
  }

  const navigationRef = useNavigationContainerRef();

  // Only proceed if we have valid Privy credentials
  // In production, missing credentials will show an error screen instead of crashing
  const hasValidPrivyConfig =
    PRIVY_APP_ID &&
    PRIVY_APP_ID !== "placeholder-app-id" &&
    PRIVY_CLIENT_ID &&
    PRIVY_CLIENT_ID !== "placeholder-client-id";

  if (!hasValidPrivyConfig && !__DEV__) {
    // In production, show error screen instead of crashing
    return (
      <ErrorBoundary>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorTitle}>Configuration Error</Text>
          <Text style={styles.errorMessage}>
            The app is missing required configuration. Please contact support.
          </Text>
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
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
                  <NavigationContainer ref={navigationRef}>
                    <NavigationHandler navigationRef={navigationRef} />
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.xl,
  },
  errorTitle: {
    ...Typography.sectionTitle,
    color: Colors.danger,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  errorMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  tabBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    borderRadius: 0,
    backgroundColor: "black",
    opacity: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
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
    color: "white",
  },
});
