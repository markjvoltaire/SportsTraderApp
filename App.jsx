import React, { useEffect, useCallback } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Alert,
  Linking,
  useColorScheme,
} from "react-native";
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
import { OnboardingProvider } from "./src/contexts/OnboardingContext";
import WelcomeScreen from "./Screens/WelcomeScreen";
import LoginScreen from "./Screens/LoginScreen";
import ProofVerificationScreen from "./Screens/ProofVerificationScreen";
import LottieLoader from "./src/components/ui/LottieLoader";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import NewHome from "./Screens/NewHome";
import PortfolioScreen from "./Screens/PortfolioScreen";
import ProfileScreen from "./Screens/ProfileScreen";
import MarketDetailScreen from "./Screens/MarketDetailScreen";
import EventDetail from "./Screens/EventDetail";
import { Colors, Spacing, Typography } from "./src/constants/theme";
import { formatCurrency } from "./src/utils/formatters";
import ChartScreen from "./Screens/ChartScreen";
import ErrorBoundary from "./src/components/ErrorBoundary";
import ProofVerificationGate from "./src/components/ProofVerificationGate";
import SplashScreen from "./Screens/SplashScreen";
import ScanScreen from "./Screens/ScanScreen";
import WalletScreen from "./Screens/WalletScreen";
import DepositScreen from "./Screens/DepositScreen";
import FinOnboardingBasicInfoScreen from "./Screens/FinOnboardingBasicInfoScreen";
import FinOnboardingAddressScreen from "./Screens/FinOnboardingAddressScreen";
import FinOnboardingFinancialScreen from "./Screens/FinOnboardingFinancialScreen";
import FinOnboardingDocumentsScreen from "./Screens/FinOnboardingDocumentsScreen";
import FinOnboardingPhoneScreen from "./Screens/FinOnboardingPhoneScreen";

import HomeScreen from "./Screens/HomeScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ScanStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator initialRouteName="HomeMain">
      <HomeStack.Screen
        name="HomeMain"
        component={NewHome}
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
      <AuthStack.Screen name="Onboarding" component={OnboardingStackScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />
    </AuthStack.Navigator>
  );
}

function OnboardingStackScreen() {
  return (
    <OnboardingStack.Navigator initialRouteName="OnboardingBasicInfo" screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="OnboardingBasicInfo" component={FinOnboardingBasicInfoScreen} />
      <OnboardingStack.Screen name="OnboardingAddress" component={FinOnboardingAddressScreen} />
      <OnboardingStack.Screen name="OnboardingFinancial" component={FinOnboardingFinancialScreen} />
      <OnboardingStack.Screen name="OnboardingDocuments" component={FinOnboardingDocumentsScreen} />
      <OnboardingStack.Screen name="OnboardingPhone" component={FinOnboardingPhoneScreen} />
    </OnboardingStack.Navigator>
  );
}

function AppNavigator() {
  const { session } = useAuth();

  const renderTabBar = (props) => (
    <CustomTabBar {...props} />
  );

  return (
    <ProofVerificationGate>
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
    </ProofVerificationGate>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const isDarkMode = useColorScheme() !== "light";
  const tabBarTheme = React.useMemo(
    () =>
      isDarkMode
        ? {
            containerBg: "transparent",
            pillBg: "#1E1E1E",
            buttonFocusedBg: "#2B2B2B",
            iconFocused: "#FFFFFF",
            iconUnfocused: "#B0B0B0",
          }
        : {
            containerBg: "transparent",
            pillBg: "#FFFFFF",
            buttonFocusedBg: "#E5E7EB",
            iconFocused: "#111827",
            iconUnfocused: "#6B7280",
          },
    [isDarkMode]
  );

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
    <View style={[styles.tabBarContainer, { backgroundColor: tabBarTheme.containerBg }]}>
      <View style={[styles.tabPill, { backgroundColor: tabBarTheme.pillBg }]}>
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
          
          const color = isFocused ? tabBarTheme.iconFocused : tabBarTheme.iconUnfocused;
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
                isFocused && [styles.tabButtonFocused, { backgroundColor: tabBarTheme.buttonFocusedBg }],
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
      <RootStack.Screen name="ProofVerification" component={ProofVerificationScreen} />
      <RootStack.Screen name="Main" component={AppNavigator} />
    </RootStack.Navigator>
  );
}

const PROOF_RETURN_SCHEME = "scoretrade";
const PROOF_RETURN_HOST = "proof-return";
const PROOF_RETURN_MAX_WAIT_ATTEMPTS = 8;
const PROOF_RETURN_WAIT_MS = 250;

function isProofReturnUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    const host = (parsed.host || "").toLowerCase();
    const path = (parsed.pathname || "").toLowerCase();

    if (scheme !== PROOF_RETURN_SCHEME) return false;
    return host === PROOF_RETURN_HOST || path === `/${PROOF_RETURN_HOST}`;
  } catch (_err) {
    const normalized = url.toLowerCase();
    return (
      normalized.startsWith(`${PROOF_RETURN_SCHEME}://${PROOF_RETURN_HOST}`) ||
      normalized.startsWith(`${PROOF_RETURN_SCHEME}:///${PROOF_RETURN_HOST}`)
    );
  }
}

// Handle deep link when user returns from Proof KYC verification
function ProofDeepLinkHandler({ navigationRef }) {
  const { session, walletAddress, checkProofStatus } = useAuth();
  const pendingReturnUrlRef = React.useRef(null);
  const handledReturnUrlRef = React.useRef(null);

  useEffect(() => {
    const processProofReturn = async (url) => {
      if (!isProofReturnUrl(url)) return;
      if (handledReturnUrlRef.current === url) return;
      pendingReturnUrlRef.current = url;
      console.log("Proof return URL received:", url);

      let attempts = 0;
      while (
        attempts < PROOF_RETURN_MAX_WAIT_ATTEMPTS &&
        (!session || !walletAddress || !navigationRef?.isReady())
      ) {
        attempts += 1;
        await new Promise((resolve) => setTimeout(resolve, PROOF_RETURN_WAIT_MS));
      }

      if (!session || !walletAddress || !navigationRef?.isReady()) {
        return;
      }

      handledReturnUrlRef.current = url;
      pendingReturnUrlRef.current = null;
      try {
        const proofResult = await checkProofStatus();
        console.log("Proof return verification result:", proofResult?.status);
        if (proofResult?.status === "error") {
          Alert.alert(
            "Verification Check Failed",
            "Returned from Proof, but we could not confirm verification status. Please try again."
          );
          navigationRef.reset({
            index: 0,
            routes: [{ name: "ProofVerification" }],
          });
        } else if (proofResult?.status === "unverified") {
          Alert.alert(
            "Verification Incomplete",
            "Your identity verification is not complete yet. You can retry when ready."
          );
          navigationRef.reset({
            index: 0,
            routes: [{ name: "ProofVerification" }],
          });
        } else {
          navigationRef.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        }
      } catch (_e) {
        Alert.alert(
          "Verification Check Failed",
          "Returned from Proof, but we could not confirm verification status. Please try again."
        );
        navigationRef.reset({
          index: 0,
          routes: [{ name: "ProofVerification" }],
        });
      }
    };

    const handleUrl = async (event) => {
      await processProofReturn(event?.url);
    };

    const subscription = Linking.addEventListener("url", handleUrl);

    // Handle case when app was opened from cold start via deep link
    Linking.getInitialURL()
      .then((url) => {
        if (url) processProofReturn(url);
      })
      .catch(() => {});

    return () => subscription.remove();
  }, [session, walletAddress, checkProofStatus, navigationRef]);

  useEffect(() => {
    const pendingUrl = pendingReturnUrlRef.current;
    if (!pendingUrl || handledReturnUrlRef.current === pendingUrl) return;
    if (!session || !walletAddress || !navigationRef?.isReady()) return;

    const retryPending = async () => {
      if (!isProofReturnUrl(pendingUrl)) return;
      handledReturnUrlRef.current = pendingUrl;
      pendingReturnUrlRef.current = null;
      const proofResult = await checkProofStatus();
      if (proofResult?.status === "verified") {
        navigationRef.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        navigationRef.reset({
          index: 0,
          routes: [{ name: "ProofVerification" }],
        });
      }
    };

    retryPending().catch(() => {});
  }, [session, walletAddress, checkProofStatus, navigationRef]);

  return null;
}

// Component to handle navigation based on auth state changes
function NavigationHandler({ navigationRef }) {
  const { session, loading, user } = useAuth();
  const { supabase } = useSupabase();
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
      const userToLog = user ?? session?.user;
      if (userToLog) {
        const { id, created_at, has_accepted_terms, is_guest, linked_accounts, mfa_methods } = userToLog;
        const flat = {
          id,
          created_at,
          has_accepted_terms,
          is_guest,
          mfa_methods,
        };
        // users table currently supports linked_account_0_* and linked_account_1_*
        (linked_accounts ?? []).slice(0, 2).forEach((acc, i) => {
          const { type, first_verified_at, latest_verified_at, verified_at } = acc;
          const pre = `linked_account_${i}_`;
          flat[pre + "type"] = type;
          flat[pre + "first_verified_at"] = first_verified_at;
          flat[pre + "latest_verified_at"] = latest_verified_at;
          flat[pre + "verified_at"] = verified_at;
          if (type === "phone") {
            const { number, phoneNumber } = acc;
            flat[pre + "number"] = number;
            // Unquoted SQL identifiers are lowercase in Postgres
            flat[pre + "phonenumber"] = phoneNumber;
          } else if (type === "wallet") {
            const { address, chain_id, chain_type, connector_type, delegated, id: accountId, imported, public_key, recovery_method, wallet_client, wallet_client_type, wallet_index } = acc;
            flat[pre + "address"] = address;
            flat[pre + "chain_id"] = chain_id;
            flat[pre + "chain_type"] = chain_type;
            flat[pre + "connector_type"] = connector_type;
            flat[pre + "delegated"] = delegated;
            flat[pre + "id"] = accountId;
            flat[pre + "imported"] = imported;
            flat[pre + "public_key"] = public_key;
            flat[pre + "recovery_method"] = recovery_method;
            flat[pre + "wallet_client"] = wallet_client;
            flat[pre + "wallet_client_type"] = wallet_client_type;
            flat[pre + "wallet_index"] = wallet_index;
          } else {
            Object.entries(acc).forEach(([k, v]) => { flat[pre + k] = v; });
          }
        });
        console.log("Login/signup successful, user:", flat);
        const fromTable = supabase?.from?.("users");
        if (typeof fromTable?.upsert === "function") {
          fromTable.upsert(flat, { onConflict: "id" }).then(({ error }) => {
            if (error) {
              console.warn("Supabase users upsert failed:", error.message);
            }
          });
        }
        if (id && typeof supabase?.from === "function") {
          supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single()
            .then(({ data, error }) => {
              if (error) {
                console.warn("Supabase users fetch by id failed:", error.message);
              } else {
                console.log("Fetched user by id:", data);
              }
              // Always go to Main after login. Proof verification only shown
              // during onboarding and when user attempts to deposit.
              navigationRef.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });
            });
          lastSessionRef.current = session;
          return; // Navigation will happen after fetch result
        }
      }
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
  }, [session, loading, navigationRef, user, supabase]);

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
                <OnboardingProvider>
                  <SafeAreaProvider>
                    <NavigationContainer ref={navigationRef}>
                      <NavigationHandler navigationRef={navigationRef} />
                      <ProofDeepLinkHandler navigationRef={navigationRef} />
                      <StatusBar style="light" />
                      <RootNavigator />
                      <PrivyElements />
                    </NavigationContainer>
                  </SafeAreaProvider>
                </OnboardingProvider>
              </AuthProvider>
            </SupabaseInitializedWrapper>
          </SupabaseProvider>
        </PrivyProvider>
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
