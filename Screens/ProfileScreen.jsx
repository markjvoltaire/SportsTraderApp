import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import ScreenTemplate from "./ScreenTemplate";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { normalize, normalizeFont } from "../src/utils/dimensions";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
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
      ]
    );
  };

  return (
    <ScreenTemplate title="Profile" description="Your profile and settings">
      <View style={styles.container}>
        {user && (
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={normalize(32)}
                color={Colors.textPrimary}
              />
            </View>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        )}

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={normalize(24)}
              color={Colors.danger}
            />
            <Text style={[styles.menuText, { color: Colors.danger }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenTemplate>
  );
}

const avatarSize = normalize(64);
const menuItemHeight = normalize(52);
const emailFontSize = normalizeFont(16);
const menuTextFontSize = normalizeFont(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  email: {
    ...Typography.body,
    fontSize: emailFontSize,
    color: Colors.textSecondary,
  },
  menu: {
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    height: menuItemHeight,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: normalize(12),
  },
  menuText: {
    ...Typography.body,
    fontSize: menuTextFontSize,
    fontWeight: "500",
  },
});

