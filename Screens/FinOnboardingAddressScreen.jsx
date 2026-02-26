import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useOnboarding } from "../src/contexts/OnboardingContext";

const LIGHT = { background: "#F5F7FB", card: "#FFFFFF", text: "#111827", muted: "#6B7280", border: "#D1D5DB", button: "#111827", buttonText: "#FFFFFF" };
const DARK = { background: "#000000", card: "#0F172A", text: "#FFFFFF", muted: "#9CA3AF", border: "#334155", button: "#FFFFFF", buttonText: "#000000" };

export default function FinOnboardingAddressScreen() {
  const navigation = useNavigation();
  const { draft, updateAddress } = useOnboarding();
  const theme = useColorScheme() !== "light" ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const data = draft.address;
  const [stepIndex, setStepIndex] = useState(0);
  const steps = [
    { key: "street", label: "Street address", placeholder: "Street", transform: (v) => v },
    { key: "city", label: "City", placeholder: "City", transform: (v) => v },
    {
      key: "state",
      label: "State or subdivision code",
      placeholder: "e.g. US-CA",
      autoCapitalize: "characters",
      transform: (v) => v.toUpperCase(),
    },
    { key: "postal_code", label: "Postal code", placeholder: "Postal code", transform: (v) => v },
    {
      key: "country",
      label: "Country",
      placeholder: "ISO3 (e.g. USA)",
      autoCapitalize: "characters",
      transform: (v) => v.toUpperCase(),
    },
  ];
  const currentStep = steps[stepIndex];
  const currentValue = data[currentStep.key] || "";
  const isLastStep = stepIndex === steps.length - 1;

  const onContinue = () => {
    if (!String(currentValue).trim()) {
      Alert.alert("Missing field", "Please answer this question to continue.");
      return;
    }
    if (isLastStep) {
      navigation.navigate("OnboardingFinancial");
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
        <Text style={styles.title}>Address</Text>
        <View style={styles.back} />
      </View>

      <Text style={styles.heading}>Where do you live?</Text>
      <Text style={styles.subheading}>This should match your proof-of-address document.</Text>
      <Text style={styles.progressText}>{`${stepIndex + 1} of ${steps.length}`}</Text>

      <View style={styles.form}>
        <TextInput
          placeholder={currentStep.placeholder}
          placeholderTextColor={theme.muted}
          autoCapitalize={currentStep.autoCapitalize || "sentences"}
          value={currentValue}
          onChangeText={(v) =>
            updateAddress({
              [currentStep.key]: currentStep.transform ? currentStep.transform(v) : v,
            })
          }
          style={styles.input}
        />
        <Text style={styles.questionText}>{currentStep.label}</Text>
      </View>

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
    form: { marginTop: 20, gap: 12 },
    input: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, color: theme.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
    questionText: { color: theme.text, fontSize: 18, fontWeight: "600", marginTop: 4 },
    button: { marginTop: "auto", marginBottom: 12, backgroundColor: theme.button, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingVertical: 14 },
    buttonText: { color: theme.buttonText, fontSize: 16, fontWeight: "700" },
  });
