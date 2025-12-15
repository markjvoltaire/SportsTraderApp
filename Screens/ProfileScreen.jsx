import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { normalize, normalizeFont } from "../src/utils/dimensions";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          const { error } = await signOut();
          if (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient
      colors={["#0A0E27", "#1A1F3A", "#2D1B3D", "#1A0F2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.description}>Your profile and settings</Text>
          </View>

          {/* User Info */}
          {user && (
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={normalize(40)} color="#FFFFFF" />
              </View>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          )}

          {/* Sign Out Button */}
          <View style={styles.menu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-out-outline"
                size={normalize(24)}
                color="#F87171"
              />
              <Text style={styles.menuText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const avatarSize = normalize(80);
const menuItemHeight = normalize(56);
const titleFontSize = normalizeFont(32);
const descriptionFontSize = normalizeFont(16);
const emailFontSize = normalizeFont(16);
const menuTextFontSize = normalizeFont(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: titleFontSize,
    color: "#FFFFFF",
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    fontSize: descriptionFontSize,
    color: "rgba(255, 255, 255, 0.7)",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
    marginTop: Spacing.xl,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  email: {
    ...Typography.body,
    fontSize: emailFontSize,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  menu: {
    marginTop: Spacing.xl,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: menuItemHeight,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  menuText: {
    ...Typography.body,
    fontSize: menuTextFontSize,
    fontWeight: "600",
    color: "#F87171",
  },
});
