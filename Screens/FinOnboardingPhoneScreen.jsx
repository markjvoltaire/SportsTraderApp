import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLoginWithSMS } from "@privy-io/expo";
import { useOnboarding } from "../src/contexts/OnboardingContext";
import {
  attachFinCustomerDocuments,
  createFinIndividualCustomer,
  uploadFinCustomerDocuments,
} from "../src/services/finService";

const LIGHT = { background: "#F5F7FB", card: "#FFFFFF", text: "#111827", muted: "#6B7280", border: "#D1D5DB", button: "#111827", buttonText: "#FFFFFF" };
const DARK = { background: "#000000", card: "#0F172A", text: "#FFFFFF", muted: "#9CA3AF", border: "#334155", button: "#FFFFFF", buttonText: "#000000" };

const formatPhoneNumber = (text) => {
  const cleaned = text.replace(/\D/g, "").slice(0, 10);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

const phoneDigits = (text) => text.replace(/\D/g, "");

const parseTosPolicyValue = (tosPoliciesUrl) => {
  if (!tosPoliciesUrl || typeof tosPoliciesUrl !== "string") return null;
  try {
    const parsed = new URL(tosPoliciesUrl);
    return parsed.searchParams.get("tos_policies_value");
  } catch (_err) {
    return null;
  }
};

const flattenUploadedUris = (uploadResponse) => {
  const files = uploadResponse?.data?.files || [];
  const uris = [];
  for (const item of files) {
    if (!item || typeof item !== "object") continue;
    Object.values(item).forEach((value) => {
      if (typeof value === "string" && value.trim()) {
        uris.push(value);
      }
    });
  }
  return uris;
};

export default function FinOnboardingPhoneScreen() {
  const navigation = useNavigation();
  const { draft, updatePhone, updateFin } = useOnboarding();
  const { sendCode, loginWithCode } = useLoginWithSMS();
  const theme = useColorScheme() !== "light" ? DARK : LIGHT;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [phone, setPhone] = useState(draft.phone.raw || "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const runFinOnboarding = async (e164Phone) => {
    setStatusMessage("Submitting onboarding details...");
    const createPayload = {
      verification_type: "STANDARD",
      basic_info: {
        ...draft.basicInfo,
        email: draft.basicInfo.email.trim().toLowerCase(),
        phone: e164Phone,
      },
      address: {
        ...draft.address,
      },
      financial_profile: {
        occupation_id: Number(draft.financialProfile.occupation_id),
        source_of_fund_id: Number(draft.financialProfile.source_of_fund_id),
        purpose_id: Number(draft.financialProfile.purpose_id),
        monthly_volume_usd: Number(draft.financialProfile.monthly_volume_usd),
      },
      meta_data: {
        source: "mobile_signup",
      },
    };

    const createResp = await createFinIndividualCustomer(createPayload);
    const customerId =
      createResp?.data?.id ||
      createResp?.data?.customer_id ||
      createResp?.id ||
      createResp?.customer_id ||
      null;
    const tosPoliciesUrl = createResp?.data?.tos_policies_url || createResp?.tos_policies_url || null;
    const tosPoliciesValue = parseTosPolicyValue(tosPoliciesUrl);

    updateFin({ customerId, tosPoliciesValue });
    if (!customerId) return;

    const files = [...(draft.documents.identityFiles || []), ...(draft.documents.addressFiles || [])];
    if (files.length === 0) return;

    setStatusMessage("Uploading documents...");
    const uploadResp = await uploadFinCustomerDocuments({ customerId, files });
    const uris = flattenUploadedUris(uploadResp);
    if (uris.length === 0) return;

    setStatusMessage("Attaching documents...");
    const identityFiles = uris
      .slice(0, Math.max(1, draft.documents.identityFiles?.length || 1))
      .map((uri) => ({ uri }));
    const addressFiles = uris
      .slice(Math.max(1, draft.documents.identityFiles?.length || 1))
      .map((uri) => ({ uri }));

    await attachFinCustomerDocuments({
      customer_id: customerId,
      proof_of_identity: {
        type: draft.documents.identityType || "PASSPORT",
        number: draft.documents.identityNumber || "UNKNOWN",
        country: draft.documents.identityCountry || "USA",
        issue_date: draft.documents.identityIssueDate || "2020-01-01",
        expiry_date: draft.documents.identityExpiryDate || "2030-01-01",
        files: identityFiles,
      },
      proof_of_address: {
        type: draft.documents.addressType || "UTILITY_BILL",
        country: draft.documents.addressCountry || "USA",
        files: addressFiles.length ? addressFiles : [{ uri: uris[uris.length - 1] }],
      },
      tos_policies_value: tosPoliciesValue,
    });
  };

  const handleSendCode = async () => {
    const digits = phoneDigits(phone);
    if (digits.length !== 10) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const e164 = `+1${digits}`;
      await sendCode({ phone: e164 });
      setSent(true);
      updatePhone({ raw: formatPhoneNumber(phone), e164 });
    } catch (err) {
      Alert.alert("Failed to send code", err?.message || "Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit verification code.");
      return;
    }
    const digits = phoneDigits(phone);
    const e164 = `+1${digits}`;
    setLoading(true);
    try {
      await loginWithCode({ code, phone: e164 });
      updatePhone({ raw: formatPhoneNumber(phone), e164 });
      await runFinOnboarding(e164);
    } catch (err) {
      Alert.alert("Verification failed", err?.message || "Please try again.");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Phone verification</Text>
        <View style={styles.back} />
      </View>
      {!sent ? (
        <>
          <Text style={styles.heading}>Last step: your phone</Text>
          <Text style={styles.subheading}>We use this for Privy sign up and your Fin customer profile.</Text>
          <TextInput
            placeholder="Phone number"
            placeholderTextColor={theme.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(v) => setPhone(formatPhoneNumber(v))}
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.disabled]}
            onPress={handleSendCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Sending..." : "Send code"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.heading}>Enter verification code</Text>
          <Text style={styles.subheading}>We sent a code to {phone}.</Text>
          <TextInput
            placeholder="6-digit code"
            placeholderTextColor={theme.muted}
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.disabled]}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify and create account"}</Text>
          </TouchableOpacity>
          {statusMessage ? <Text style={styles.subheading}>{statusMessage}</Text> : null}
          <TouchableOpacity onPress={() => setSent(false)} style={styles.linkButton}>
            <Text style={styles.linkText}>Edit phone number</Text>
          </TouchableOpacity>
        </>
      )}
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
    input: {
      marginTop: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      color: theme.text,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    button: {
      marginTop: 16,
      backgroundColor: theme.button,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
    },
    buttonText: { color: theme.buttonText, fontSize: 16, fontWeight: "700" },
    disabled: { opacity: 0.6 },
    linkButton: { marginTop: 16, alignItems: "center" },
    linkText: { color: theme.text, textDecorationLine: "underline" },
  });
