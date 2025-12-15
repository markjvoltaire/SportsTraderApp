import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../src/contexts/AuthContext";
import { Colors, Spacing, Typography } from "../src/constants/theme";
import { normalize, normalizeFont } from "../src/utils/dimensions";

export default function LoginScreen({ route }) {
  const navigation = useNavigation();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(
    route?.params?.initialMode === "signup"
  );
  const [showPassword, setShowPassword] = useState(false);

  // Update sign up mode when route params change
  useEffect(() => {
    if (route?.params?.initialMode === "signup") {
      setIsSignUp(true);
    } else if (route?.params?.initialMode === "signin") {
      setIsSignUp(false);
    }
  }, [route?.params?.initialMode]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Trim email before sending
      const trimmedEmail = email.trim().toLowerCase();
      const { data, error } = isSignUp
        ? await signUp(trimmedEmail, password)
        : await signIn(trimmedEmail, password);

      if (error) {
        // Provide more helpful error messages
        let errorMessage = error.message;

        // Network errors
        if (
          error.message.includes("Network request failed") ||
          error.message.includes("Failed to fetch") ||
          error.message.includes("NetworkError") ||
          error.name === "AuthRetryableFetchError"
        ) {
          errorMessage =
            "Network error. Please check:\n1. Your internet connection\n2. Supabase API key is configured\n3. Supabase project is active";
          console.error("Network error details:", {
            message: error.message,
            name: error.name,
            status: error.status,
            fullError: error,
          });
        } else if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid")
        ) {
          errorMessage =
            "Invalid email or password. Please check your credentials and try again.";
        } else if (
          error.message.includes("already registered") ||
          error.message.includes("already exists")
        ) {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (
          error.message.includes("Email rate limit") ||
          error.message.includes("rate limit")
        ) {
          errorMessage =
            "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Please verify your email address before signing in. Check your inbox for a confirmation email.";
        } else if (error.message.includes("Password")) {
          errorMessage =
            "Password is too weak. Please use a stronger password.";
        } else if (
          error.message.includes("Invalid API key") ||
          error.message.includes("JWT") ||
          error.message.includes("API key") ||
          error.status === 401
        ) {
          errorMessage =
            "Invalid Supabase API key. Please check your configuration:\n\n1. Go to Supabase Dashboard > Settings > API\n2. Copy the 'anon public' key\n3. Update src/config/supabase.js or .env file\n4. Restart your app";
        }

        Alert.alert("Error", errorMessage);
      } else {
        // Success - navigation will happen automatically via RootNavigator
        if (isSignUp && data?.user) {
          Alert.alert(
            "Account Created",
            "Your account has been created! Please check your email to verify your account before signing in.",
            [
              {
                text: "OK",
                onPress: () => {
                  // Switch to sign in mode after successful signup
                  setIsSignUp(false);
                  setEmail("");
                  setPassword("");
                },
              },
            ]
          );
        }
        // For sign in, the session will be set and RootNavigator will automatically navigate
      }
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0A0E27", "#1A1F3A", "#2D1B3D", "#1A0F2E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={normalize(24)}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>
                {isSignUp ? "Create Account" : "Welcome Back"}
              </Text>
              <Text style={styles.subtitle}>
                {isSignUp ? "Sign up to start trading" : "Sign in to continue"}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={normalize(20)}
                  color="rgba(255, 255, 255, 0.6)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={normalize(20)}
                  color="rgba(255, 255, 255, 0.6)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={normalize(20)}
                    color="rgba(255, 255, 255, 0.6)"
                  />
                </TouchableOpacity>
              </View>

              {!isSignUp && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => navigation.navigate("ForgotPassword")}
                >
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isSignUp
                    ? "Already have an account? "
                    : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.switchLink}>
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const inputHeight = normalize(52);
const inputRadius = normalize(12);
const buttonHeight = normalize(52);
const buttonRadius = normalize(26);
const titleFontSize = normalizeFont(32);
const subtitleFontSize = normalizeFont(16);
const inputFontSize = normalizeFont(16);
const buttonFontSize = normalizeFont(16);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: titleFontSize,
    marginBottom: Spacing.sm,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  subtitle: {
    ...Typography.body,
    fontSize: subtitleFontSize,
    color: "rgba(255, 255, 255, 0.7)",
  },
  form: {
    gap: Spacing.md,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    height: inputHeight,
    borderRadius: inputRadius,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: inputFontSize,
    color: "#FFFFFF",
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -Spacing.xs,
  },
  forgotPasswordText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: "#FFFFFF",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#FFFFFF",
    height: buttonHeight,
    borderRadius: inputRadius,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#000000",
    fontSize: buttonFontSize,
    fontWeight: "700",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.lg,
  },
  switchText: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: "rgba(255, 255, 255, 0.7)",
  },
  switchLink: {
    ...Typography.body,
    fontSize: normalizeFont(14),
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
