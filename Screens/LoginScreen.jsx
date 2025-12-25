import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLoginWithSMS, useLinkSMS, usePrivy } from "@privy-io/expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { normalize, normalizeFont } from "../src/utils/dimensions";

// Format phone number with dashes (XXX-XXX-XXXX)
const formatPhoneNumber = (text) => {
  // Remove all non-digits
  const cleaned = text.replace(/\D/g, "");

  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);

  // Format with dashes
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  }
};

// Get just digits from formatted phone number
const getPhoneDigits = (formatted) => {
  return formatted.replace(/\D/g, "");
};

export default function LoginScreen() {
  const navigation = useNavigation();
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState("");

  // Check if user is already authenticated with Privy
  const privyContext = usePrivy();
  const isAuthenticated = !!privyContext?.user;

  // Call both hooks (required by React Rules of Hooks)
  const loginHook = useLoginWithSMS();
  const linkHook = useLinkSMS();

  const { sendCode, loginWithCode } = loginHook;
  const { sendCode: linkSendCode, linkWithCode } = linkHook;

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    setPhoneDigits(getPhoneDigits(formatted));
  };

  const handleSendCode = async () => {
    const digits = getPhoneDigits(phone);
    if (digits.length !== 10) {
      // Show error or validation
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = `+1${digits}`;
      if (isAuthenticated) {
        await linkSendCode({ phone: phoneNumber });
      } else {
        await sendCode({ phone: phoneNumber });
      }
      setPhoneDigits(digits);
      setCodeSent(true);
      console.log("Code sent successfully");
    } catch (error) {
      console.error("Error sending code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = `+1${phoneDigits}`;
      if (isAuthenticated) {
        await linkWithCode({ code: verificationCode, phone: phoneNumber });
      } else {
        await loginWithCode({ code: verificationCode, phone: phoneNumber });
      }
      console.log("Verification successful");
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (codeSent) {
              setCodeSent(false);
              setVerificationCode("");
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={normalize(24)} color="#1a1a1a" />
        </TouchableOpacity>
        {!codeSent && (
          <TouchableOpacity onPress={handleSendCode} activeOpacity={0.7}>
            <Text style={styles.tryNowText}>Try now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {!codeSent ? (
          <>
            <Text style={styles.heading}>Hello, what's your phone number?</Text>

            <Text style={styles.description}>
              Customer Messages may be sent within iOS Notifications, Natural or
              via SMS
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="Phone number"
                placeholderTextColor="#999"
                inputMode="tel"
                style={styles.phoneInput}
                autoFocus
                maxLength={12} // XXX-XXX-XXXX format
              />
            </View>

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={isLoading || phoneDigits.length !== 10}
              activeOpacity={0.8}
              style={[
                styles.continueButton,
                (isLoading || phoneDigits.length !== 10) &&
                  styles.continueButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={["#000000", "#000000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.continueButtonText}>
                  {isLoading ? "Sending..." : "Continue"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              By tapping 'Continue' and using the SportsTrader app, you're
              agreeing to our{" "}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL("https://example.com/terms")}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                style={styles.linkText}
                onPress={() => Linking.openURL("https://example.com/privacy")}
              >
                Privacy Policy
              </Text>
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Enter verification code</Text>

            <Text style={styles.description}>
              We sent a code to {phone}. Please enter it below.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Verification code"
                placeholderTextColor="#999"
                inputMode="numeric"
                style={styles.phoneInput}
                autoFocus
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              onPress={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6}
              activeOpacity={0.8}
              style={[
                styles.continueButton,
                (isLoading || verificationCode.length !== 6) &&
                  styles.continueButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={["#000000", "#000000"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.continueButtonText}>
                  {isLoading ? "Verifying..." : "Continue"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCodeSent(false);
                setVerificationCode("");
              }}
              style={styles.resendContainer}
            >
              <Text style={styles.resendText}>Didn't receive code? Resend</Text>
            </TouchableOpacity>
          </>
        )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: normalize(20),
    paddingTop: normalize(12),
    paddingBottom: normalize(16),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  tryNowText: {
    fontSize: normalizeFont(16),
    fontWeight: "500",
    color: "#007AFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize(24),
    paddingTop: normalize(40),
  },
  heading: {
    fontSize: normalizeFont(32),
    fontWeight: "700",
    color: "#000000",
    marginBottom: normalize(12),
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
    lineHeight: normalizeFont(38),
  },
  description: {
    fontSize: normalizeFont(14),
    fontWeight: "400",
    color: "#666666",
    marginBottom: normalize(32),
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
    lineHeight: normalizeFont(20),
  },
  inputContainer: {
    marginBottom: normalize(24),
  },
  phoneInput: {
    fontSize: normalizeFont(24),
    fontWeight: "500",
    color: "#000000",
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(4),
    borderBottomWidth: 2,
    borderBottomColor: "#E5E5E5",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  continueButton: {
    marginBottom: normalize(32),
    borderRadius: normalize(12),
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: normalize(16),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: normalize(12),
  },
  continueButtonText: {
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  legalText: {
    fontSize: normalizeFont(12),
    fontWeight: "400",
    color: "#666666",
    textAlign: "center",
    lineHeight: normalizeFont(18),
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
  linkText: {
    color: "#007AFF",
    textDecorationLine: "underline",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: normalize(16),
  },
  resendText: {
    fontSize: normalizeFont(14),
    fontWeight: "400",
    color: "#007AFF",
    fontFamily: Platform.select({
      ios: "SF Pro Display",
      android: "sans-serif",
      default: "System",
    }),
  },
});
