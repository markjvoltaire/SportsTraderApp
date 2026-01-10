import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../src/constants/theme";

export default function EventDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const event = route.params?.event;

  console.log("Event ticker:", event?.ticker);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#000000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {event?.title || "Event Detail"}
          </Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholderText}>EventDetail</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    position: "relative",
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 60,
  },
  headerTitle: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  placeholderText: {
    ...Typography.body,
    color: "#000000",
  },
});
