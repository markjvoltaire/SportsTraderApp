import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Spacing, Typography } from "../constants/theme";

export default function ScreenTemplate({ title, description, children }) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 12,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, opacity, translateY]);

  return (
    <SafeAreaView style={styles.screen}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.body}>{description}</Text> : null}
        {children ? <View style={styles.children}>{children}</View> : null}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  title: {
    ...Typography.sectionTitle,
    marginBottom: Spacing.sm,
  },
  body: {
    ...Typography.body,
    color: Colors.textTertiary,
    marginBottom: Spacing.lg,
  },
  content: {
    alignSelf: "stretch",
  },
  children: {
    marginTop: Spacing.sm,
  },
});
