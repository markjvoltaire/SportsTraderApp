import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLoginWithSMS, useLinkSMS, usePrivy } from "@privy-io/expo";
import { SafeAreaView } from "react-native-safe-area-context";
import { normalize, normalizeFont } from "../src/utils/dimensions";
import { useAuth } from "../src/contexts/AuthContext";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../src/constants/theme";

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
  const [error, setError] = useState(null);
  const { session, loading: authLoading } = useAuth();

  // Check if user is already authenticated with Privy
  const privyContext = usePrivy();
  const isAuthenticated = !!privyContext?.user;

  // Call both hooks (required by React Rules of Hooks)
  const loginHook = useLoginWithSMS();
  const linkHook = useLinkSMS();

  const { sendCode, loginWithCode } = loginHook;
  const { sendCode: linkSendCode, linkWithCode } = linkHook;

  // Navigate to Home when user becomes authenticated after login
  // This is a fallback in case NavigationHandler doesn't catch it
  useEffect(() => {
    if (!authLoading && session && !isLoading) {
      // Get root navigator by traversing parent navigators
      let rootNavigator = navigation;
      while (rootNavigator.getParent()) {
        rootNavigator = rootNavigator.getParent();
      }

      // Small delay to ensure navigation state is ready and avoid conflicts with NavigationHandler
      const timer = setTimeout(() => {
        if (rootNavigator?.reset) {
          rootNavigator.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [session, authLoading, navigation, isLoading]);

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    setPhoneDigits(getPhoneDigits(formatted));
  };

  const handleSendCode = async () => {
    const digits = getPhoneDigits(phone);
    if (digits.length !== 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const phoneNumber = `+1${digits}`;
      if (isAuthenticated) {
        await linkSendCode({ phone: phoneNumber });
      } else {
        await sendCode({ phone: phoneNumber });
      }
      setPhoneDigits(digits);
      setCodeSent(true);
      console.log("Code sent successfully to", phoneNumber);
    } catch (error) {
      console.error("Error sending SMS code:", error);
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        error: error?.error,
        fullError: JSON.stringify(error, null, 2),
      });

      // Extract user-friendly error message
      let errorMessage = "Failed to send verification code. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage =
          typeof error.error === "string"
            ? error.error
            : error.error?.message || errorMessage;
      }

      setError(errorMessage);
      Alert.alert("Unable to Send Code", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert(
        "Invalid Code",
        "Please enter a valid 6-digit verification code"
      );
      return;
    }

    setIsLoading(true);
    setError(null);
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
      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        error: error?.error,
        fullError: JSON.stringify(error, null, 2),
      });

      // Extract user-friendly error message
      let errorMessage = "Invalid verification code. Please try again.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage =
          typeof error.error === "string"
            ? error.error
            : error.error?.message || errorMessage;
      }

      setError(errorMessage);
      Alert.alert("Verification Failed", errorMessage, [{ text: "OK" }]);
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
          <Ionicons
            name="arrow-back"
            size={normalize(24)}
            color={Colors.textPrimary}
          />
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
                colors={[Colors.primary, Colors.primary]}
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
                colors={[Colors.primary, Colors.primary]}
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
                setError(null);
              }}
              style={styles.resendContainer}
            >
              <Text style={styles.resendText}>Didn't receive code? Resend</Text>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md + Spacing.sm,
    paddingTop: Spacing.sm + Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    justifyContent: "center",
    alignItems: "flex-start",
  },
  tryNowText: {
    ...Typography.body,
    fontSize: normalizeFont(16),
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl + Spacing.md,
  },
  heading: {
    ...Typography.pageTitle,
    fontSize: normalizeFont(32),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm + Spacing.xs,
    lineHeight: normalizeFont(38),
  },
  description: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    fontWeight: "400",
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: normalizeFont(20),
  },
  inputContainer: {
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  phoneInput: {
    ...Typography.body,
    fontSize: normalizeFont(24),
    fontWeight: "500",
    color: Colors.textPrimary,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    lineHeight: normalizeFont(32),
    minHeight: normalizeFont(56),
  },
  continueButton: {
    marginBottom: Spacing.xxl,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  continueButtonText: {
    ...Typography.body,
    fontSize: normalizeFont(18),
    fontWeight: "600",
    color: Colors.background,
  },
  legalText: {
    ...Typography.caption,
    fontSize: normalizeFont(12),
    fontWeight: "400",
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: normalizeFont(18),
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  resendContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  resendText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    fontWeight: "400",
    color: Colors.primary,
  },
  errorContainer: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.dangerMuted,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    fontWeight: "400",
    color: Colors.danger,
    textAlign: "center",
  },
});
