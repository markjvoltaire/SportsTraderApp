import React from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacity,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import WelcomeScreen from "./Screens/WelcomeScreen";
import LoginScreen from "./Screens/LoginScreen";
import ForgotPasswordScreen from "./Screens/ForgotPasswordScreen";
import HomeScreen from "./Screens/HomeScreen";
import MarketsScreen from "./Screens/MarketsScreen";
import PortfolioScreen from "./Screens/PortfolioScreen";
import ProfileScreen from "./Screens/ProfileScreen";
import MarketDetailScreen from "./Screens/MarketDetailScreen";
import { Colors, Spacing, Typography } from "./constants/theme";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "" }}
      />
      <HomeStack.Screen
        name="MarketDetail"
        component={MarketDetailScreen}
        options={({ route, navigation }) => {
          const market = route.params?.game || route.params?.market;
          const getMarketTitle = (market) => {
            if (!market) return "Markets";
            if (market.title) return market.title;
            if (market.question) return market.question;
            if (market.awayTeam && market.homeTeam) {
              const awayName = market.awayTeam.abbreviation || market.awayTeam.name || "Away";
              const homeName = market.homeTeam.abbreviation || market.homeTeam.name || "Home";
              return `${awayName} vs ${homeName}`;
            }
            return "Markets";
          };
          return {
            headerShown: true,
            headerTitle: getMarketTitle(market),
            headerBackVisible: false,
            headerTintColor: Colors.textPrimary,
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingVertical: 8,
                }}
              >
                <Ionicons
                  name="chevron-back"
                  size={28}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <View style={{ flexDirection: "row", gap: Spacing.sm }}>
                <TouchableOpacity
                  style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}
                  onPress={() => {
                    // TODO: Implement share functionality
                    console.log("Share pressed for market:", getMarketTitle(market));
                  }}
                >
                  <Ionicons
                    name="share-outline"
                    size={24}
                    color={Colors.textPrimary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }}
                  onPress={() => {
                    // TODO: Implement options functionality
                    console.log("Options pressed for market:", getMarketTitle(market));
                  }}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={24}
                    color={Colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            ),
          };
        }}
      />
    </HomeStack.Navigator>
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
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: Colors.textTertiary,
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
      <Tab.Screen
        name="Markets"
        component={MarketsScreen}
        options={{
          tabBarLabel: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "globe" : "globe-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "briefcase" : "briefcase-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {session && (
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
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

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Show welcome screen if not logged in, but allow access to app via "View Markets"
  return session ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
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
