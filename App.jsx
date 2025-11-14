import React from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "./Screens/HomeScreen";
import MarketsScreen from "./Screens/MarketsScreen";
import PortfolioScreen from "./Screens/PortfolioScreen";
import MarketDetailScreen from "./Screens/MarketDetailScreen";
import { Colors, Spacing, Typography } from "./constants/theme";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeList" component={HomeScreen} />
      <HomeStack.Screen name="MarketDetail" component={MarketDetailScreen} />
    </HomeStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
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
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Markets" component={MarketsScreen} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: Spacing.xl,
    height: 72,
    borderRadius: 32,
    backgroundColor: Colors.glassSurface,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    shadowColor: "rgba(30, 41, 59, 0.18)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 18,
  },
  tabItem: {
    marginHorizontal: Spacing.xs,
  },
  tabLabel: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
