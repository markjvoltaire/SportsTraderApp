import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, Alert, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { useOnboarding } from "../src/contexts/OnboardingContext";

const LIGHT = { background: "#F5F7FB", card: "#FFFFFF", text: "#111827", muted: "#6B7280", border: "#D1D5DB", button: "#111827", buttonText: "#FFFFFF" };
const DARK = { background: "#000000", card: "#0F172A", text: "#FFFFFF", muted: "#9CA3AF", border: "#334155", button: "#FFFFFF", buttonText: "#000000" };

export default function FinOnboardingDocumentsScreen() {
  const navigation = useNavigation();
  const { draft, updateDocuments } = useOnboarding();
  const theme = useColorScheme() !== "light" ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);
  const data = draft.documents;

  const pickImage = async (key) => {
    setBusy(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        type: asset.mimeType || "image/jpeg",
        name: asset.fileName || `${key}_${Date.now()}.jpg`,
      };
      updateDocuments({ [key]: [...(data[key] || []), file] });
    } finally {
      setBusy(false);
    }
  };

  const onContinue = () => {
    if (!data.identityType || !data.addressType) {
      Alert.alert("Missing details", "Please complete document details.");
      return;
    }
    navigation.navigate("OnboardingPhone");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <View style={styles.back} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Upload verification docs</Text>
        <Text style={styles.subheading}>You can continue and upload more later if needed.</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Proof of identity</Text>
          <TextInput placeholder="Type (PASSPORT, NATIONAL_ID...)" placeholderTextColor={theme.muted} value={data.identityType} onChangeText={(v) => updateDocuments({ identityType: v })} style={styles.input} />
          <TextInput placeholder="Document number" placeholderTextColor={theme.muted} value={data.identityNumber} onChangeText={(v) => updateDocuments({ identityNumber: v })} style={styles.input} />
          <TextInput placeholder="Country (ISO3)" placeholderTextColor={theme.muted} autoCapitalize="characters" value={data.identityCountry} onChangeText={(v) => updateDocuments({ identityCountry: v.toUpperCase() })} style={styles.input} />
          <TextInput placeholder="Issue date (YYYY-MM-DD)" placeholderTextColor={theme.muted} value={data.identityIssueDate} onChangeText={(v) => updateDocuments({ identityIssueDate: v })} style={styles.input} />
          <TextInput placeholder="Expiry date (YYYY-MM-DD)" placeholderTextColor={theme.muted} value={data.identityExpiryDate} onChangeText={(v) => updateDocuments({ identityExpiryDate: v })} style={styles.input} />
          <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage("identityFiles")} disabled={busy}>
            <Text style={styles.secondaryButtonText}>
              {busy ? "Selecting..." : `Add identity file (${data.identityFiles?.length || 0})`}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Proof of address</Text>
          <TextInput placeholder="Type (UTILITY_BILL...)" placeholderTextColor={theme.muted} value={data.addressType} onChangeText={(v) => updateDocuments({ addressType: v })} style={styles.input} />
          <TextInput placeholder="Country (ISO3)" placeholderTextColor={theme.muted} autoCapitalize="characters" value={data.addressCountry} onChangeText={(v) => updateDocuments({ addressCountry: v.toUpperCase() })} style={styles.input} />
          <TouchableOpacity style={styles.secondaryButton} onPress={() => pickImage("addressFiles")} disabled={busy}>
            <Text style={styles.secondaryButtonText}>
              {busy ? "Selecting..." : `Add address file (${data.addressFiles?.length || 0})`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    back: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
    title: { color: theme.text, fontWeight: "700", fontSize: 18 },
    heading: { marginTop: 20, color: theme.text, fontSize: 30, fontWeight: "700" },
    subheading: { marginTop: 8, color: theme.muted, fontSize: 14, marginBottom: 16 },
    card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 14, marginBottom: 14 },
    sectionTitle: { color: theme.text, fontWeight: "700", marginBottom: 10 },
    input: { backgroundColor: "transparent", borderWidth: 1, borderColor: theme.border, color: theme.text, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
    secondaryButton: { borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
    secondaryButtonText: { color: theme.text, fontWeight: "600" },
    button: { marginTop: 8, marginBottom: 12, backgroundColor: theme.button, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
    buttonText: { color: theme.buttonText, fontSize: 16, fontWeight: "700" },
  });
