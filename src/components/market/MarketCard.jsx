import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from "react-native";
import React, { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../../constants/theme";

export default function MarketCard({ market, index = 0 }) {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Stagger animation based on index
    const delay = index * 50; // 50ms delay between each card

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (!market) {
    return null;
  }

  const handlePress = () => {
    navigation.navigate("MarketDetail", {
      market: market,
    });
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={styles.title}>
          {market.question || market.title || market.name || "Market"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
  },
  id: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 10,
  },
});
