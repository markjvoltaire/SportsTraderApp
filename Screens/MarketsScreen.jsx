import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useScrollToTop } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import API_BASE_URL from "../src/config/api";
import TopMoverCard from "../src/components/market/TopMoverCard";
import NewsCard from "../src/components/market/NewsCard";
import { Colors, Spacing, Typography } from "../constants/theme";

// Animated wrapper for cards
function AnimatedCard({ children, index }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 20;

    const delay = index * 50;
    const timeoutId = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.ease),
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export default function MarketsScreen() {
  return <SafeAreaView style={styles.container}></SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
