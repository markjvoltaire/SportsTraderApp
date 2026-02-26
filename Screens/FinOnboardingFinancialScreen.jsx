import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useOnboarding } from "../src/contexts/OnboardingContext";
import { fetchFinCatalogue } from "../src/services/finService";

const LIGHT = { background: "#F5F7FB", card: "#FFFFFF", text: "#111827", muted: "#6B7280", border: "#D1D5DB", button: "#111827", buttonText: "#FFFFFF" };
const DARK = { background: "#000000", card: "#0F172A", text: "#FFFFFF", muted: "#9CA3AF", border: "#334155", button: "#FFFFFF", buttonText: "#000000" };

export default function FinOnboardingFinancialScreen() {
  const navigation = useNavigation();
  const { draft, updateFinancialProfile } = useOnboarding();
  const theme = useColorScheme() !== "light" ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const data = draft.financialProfile;
  const [catalogueError, setCatalogueError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    {
      key: "occupation_id",
      label: "Occupation ID",
      placeholder: "occupation_id",
    },
    {
      key: "source_of_fund_id",
      label: "Source of fund ID",
      placeholder: "source_of_fund_id",
    },
    {
      key: "purpose_id",
      label: "Purpose ID",
      placeholder: "purpose_id",
    },
    {
      key: "monthly_volume_usd",
      label: "Expected monthly volume (USD)",
      placeholder: "e.g. 5000",
    },
  ];
  const currentStep = steps[stepIndex];
  const currentValue = String(data[currentStep.key] || "");
  const isLastStep = stepIndex === steps.length - 1;

  useEffect(() => {
    fetchFinCatalogue().catch((err) => {
      setCatalogueError(err?.message || "Could not load catalogue options.");
    });
  }, []);

  const onContinue = () => {
    if (!currentValue.trim()) {
      Alert.alert("Missing field", "Please answer this question to continue.");
      return;
    }
    if (isLastStep) {
      navigation.navigate("OnboardingDocuments");
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const onBack = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Financial profile</Text>
        <View style={styles.back} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Tell us about usage</Text>
        <Text style={styles.subheading}>Use IDs from Fin catalogue endpoints. We keep these editable.</Text>
        <Text style={styles.progressText}>{`${stepIndex + 1} of ${steps.length}`}</Text>

        {catalogueError ? <Text style={styles.error}>{catalogueError}</Text> : null}

        <View style={styles.form}>
          <TextInput
            placeholder={currentStep.placeholder}
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            value={currentValue}
            onChangeText={(v) =>
              updateFinancialProfile({ [currentStep.key]: v.replace(/\D/g, "") })
            }
            style={styles.input}
          />
          <Text style={styles.questionText}>{currentStep.label}</Text>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>{isLastStep ? "Continue" : "Next"}</Text>
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
    subheading: { marginTop: 8, color: theme.muted, fontSize: 14 },
    progressText: { marginTop: 8, color: theme.muted, fontSize: 13, fontWeight: "600" },
    form: { marginTop: 20, gap: 12, marginBottom: 20 },
    input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, color: theme.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    questionText: { color: theme.text, fontSize: 18, fontWeight: "600", marginTop: 4 },
    button: { marginTop: 8, marginBottom: 12, backgroundColor: theme.button, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
    buttonText: { color: theme.buttonText, fontSize: 16, fontWeight: "700" },
    error: { color: "#EF4444", marginTop: 12 },
  });
