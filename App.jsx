import React, { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

// Keep the splash screen visible while we fetch resources
ExpoSplashScreen.preventAutoHideAsync();
import {
  NavigationContainer,
  useNavigationContainerRef,
  getFocusedRouteNameFromRoute,
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
import MarketDetailScreen from "./Screens/MarketDetailScreen";
import EventDetail from "./Screens/EventDetail";
import { Colors, Spacing, Typography } from "./src/constants/theme";
import { formatCurrency } from "./src/utils/formatters";
import ChartScreen from "./Screens/ChartScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";
import SplashScreen from "./Screens/SplashScreen";
import ScanScreen from "./Screens/ScanScreen";
import WalletScreen from "./Screens/WalletScreen";
import DepositScreen from "./Screens/DepositScreen";

// 1. Import Crossmint Provider
import { CrossmintProvider } from "@crossmint/client-sdk-react-native-ui";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ScanStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator initialRouteName="HomeMain">
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
        name="EventDetail"
        component={EventDetail}
        options={{
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

function ScanStackScreen() {
  return (
    <ScanStack.Navigator initialRouteName="ScanMain">
      <ScanStack.Screen
        name="ScanMain"
        component={ScanScreen}
        options={{ headerShown: false }}
      />
    </ScanStack.Navigator>
  );
}

function WalletStackScreen() {
  return (
    <WalletStack.Navigator initialRouteName="WalletMain">
      <WalletStack.Screen
        name="WalletMain"
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <WalletStack.Screen
        name="Deposit"
        component={DepositScreen}
        options={{ headerShown: false }}
      />
    </WalletStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator initialRouteName="ProfileMain">
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

  const renderTabBar = (props) => (
    <CustomTabBar {...props} />
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "white",
        tabBarInactiveTintColor: "#999999",
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={({ route }) => {
          // Get the nested route state to check current screen
          const state = route.state;
          const nestedRoute = state?.routes?.[state.index ?? 0];
          const isChartScreen = nestedRoute?.name === "Chart";
          
          return {
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
            tabBarStyle: isChartScreen ? { display: "none" } : undefined,
          };
        }}
      />

      <Tab.Screen
        name="Wallet"
        component={WalletStackScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "wallet" : "wallet-outline"}
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

function CustomTabBar({ state, descriptors, navigation }) {
  // Check current active tab and nested screen
  const currentTabInfo = React.useMemo(() => {
    const activeTabIndex = state.index;
    const activeTab = state.routes[activeTabIndex];
    const activeTabName = activeTab?.name;
    
    let currentScreenName = null;
    if (activeTab?.state?.routes) {
      const nestedIndex = activeTab.state.index ?? 0;
      currentScreenName = activeTab.state.routes[nestedIndex]?.name;
    } else {
      // If no nested state, we're likely on the initial route
      // For Home tab, initial route is HomeMain
      if (activeTabName === "Home") {
        currentScreenName = "HomeMain";
      } else if (activeTabName === "Wallet") {
        currentScreenName = "WalletMain";
      } else if (activeTabName === "Profile") {
        currentScreenName = "ProfileMain";
      }
    }
    
    return {
      activeTabName,
      currentScreenName,
      isHomeTab: activeTabName === "Home",
      isWalletTab: activeTabName === "Wallet",
      isProfileTab: activeTabName === "Profile",
    };
  }, [state]);

  // Check if we're on the HomeMain screen (only when on Home tab)
  // Also active if we're on Home tab and currentScreenName is null/undefined (initial route)
  const isOnHomeMain = currentTabInfo.isHomeTab && 
    (currentTabInfo.currentScreenName === "HomeMain" || 
     currentTabInfo.currentScreenName === null ||
     currentTabInfo.currentScreenName === undefined);

  // Check if we're on the WalletMain screen (only when on Wallet tab)
  const isOnWalletMain = currentTabInfo.isWalletTab && 
    (currentTabInfo.currentScreenName === "WalletMain" || 
     currentTabInfo.currentScreenName === null ||
     currentTabInfo.currentScreenName === undefined);

  // Check if we're on the ProfileMain screen (only when on Profile tab)
  const isOnProfileMain = currentTabInfo.isProfileTab && 
    (currentTabInfo.currentScreenName === "ProfileMain" || 
     currentTabInfo.currentScreenName === null ||
     currentTabInfo.currentScreenName === undefined);

  // Hide tab bar on ChartScreen (only when on Home tab)
  // Use React Navigation helper to get focused route name reliably
  const homeRoute = state.routes.find((r) => r.name === "Home");
  const focusedHomeRoute =
    (homeRoute && getFocusedRouteNameFromRoute(homeRoute)) || "HomeMain";
  const isOnChartScreen =
    currentTabInfo.isHomeTab && focusedHomeRoute === "Chart";
  const isOnEventDetail =
    currentTabInfo.isHomeTab && focusedHomeRoute === "EventDetail";
  const isOnMarketDetail =
    currentTabInfo.isHomeTab && focusedHomeRoute === "MarketDetail";

  if (isOnChartScreen || isOnEventDetail || isOnMarketDetail) {
    return null;
  }

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabPill}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isTabFocused = state.index === index;
          
          // Determine if tab should appear active based on nested screen
          let isFocused = false;
          if (route.name === "Home") {
            isFocused = isTabFocused && isOnHomeMain;
          } else if (route.name === "Wallet") {
            isFocused = isTabFocused && isOnWalletMain;
          } else if (route.name === "Profile") {
            isFocused = isTabFocused && isOnProfileMain;
          } else {
            isFocused = isTabFocused;
          }
          
          const color = isFocused ? "#FFFFFF" : "#B0B0B0";
          const size = 22;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isTabFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
              return;
            }

            // Navigate to the main screen using nested navigation
            // Use the existing route key to ensure we use the existing screen instance
            // This preserves component state
            if (route.name === "Home" && isTabFocused && !isOnHomeMain) {
              // Find HomeMain in the stack and navigate to it using its key
              const homeState = route.state;
              const homeMainRoute = homeState?.routes?.find(
                (r) => r.name === "HomeMain"
              );
              if (homeMainRoute) {
                // Navigate using the existing route key to preserve state
                navigation.navigate("Home", {
                  screen: "HomeMain",
                  params: {},
                  key: homeMainRoute.key,
                });
              } else {
                // Fallback if HomeMain not found in stack
                navigation.navigate("Home", {
                  screen: "HomeMain",
                  params: {},
                });
              }
            } else if (
              route.name === "Wallet" &&
              isTabFocused &&
              !isOnWalletMain
            ) {
              const walletState = route.state;
              const walletMainRoute = walletState?.routes?.find(
                (r) => r.name === "WalletMain"
              );
              if (walletMainRoute) {
                navigation.navigate("Wallet", {
                  screen: "WalletMain",
                  params: {},
                  key: walletMainRoute.key,
                });
              } else {
                navigation.navigate("Wallet", {
                  screen: "WalletMain",
                  params: {},
                });
              }
            } else if (
              route.name === "Profile" &&
              isTabFocused &&
              !isOnProfileMain
            ) {
              const profileState = route.state;
              const profileMainRoute = profileState?.routes?.find(
                (r) => r.name === "ProfileMain"
              );
              if (profileMainRoute) {
                navigation.navigate("Profile", {
                  screen: "ProfileMain",
                  params: {},
                  key: profileMainRoute.key,
                });
              } else {
                navigation.navigate("Profile", {
                  screen: "ProfileMain",
                  params: {},
                });
              }
            }
          };

          // Get the icon component, but override focused state with our custom logic
          const iconElement = options.tabBarIcon
            ? options.tabBarIcon({ 
                color, 
                size, 
                focused: isFocused // Use our custom isFocused instead of React Navigation's default
              })
            : null;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={[
                styles.tabButton,
                isFocused && styles.tabButtonFocused,
              ]}
            >
              {iconElement}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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
  // Load custom fonts
  const [fontsLoaded] = useFonts({
    SubwayTickerGrid: require("./assets/fonts/SubwayTickerGrid.ttf"),
  });

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

  // Wait for fonts to load before rendering
  if (!fontsLoaded) {
    return null;
  }

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
     // Create embedded Solana wallets on login
     embedded: {
       solana: {
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
  tabBarContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingBottom: Spacing.lg,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 260,
    maxWidth: 360,
    width: "78%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  tabButton: {
    width: 54,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonFocused: {
    backgroundColor: "#2B2B2B",
  },
  scanButton: {
    width: 54,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButtonFocused: {
    backgroundColor: "#2B2B2B",
  },
});
