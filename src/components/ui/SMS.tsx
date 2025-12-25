import { useState } from "react";
import { useLoginWithSMS, useLinkSMS, usePrivy } from "@privy-io/expo";
import {
  Button,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function SMSLogin() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  // Check if user is already authenticated with Privy
  const privyContext = usePrivy();
  const isAuthenticated = !!privyContext?.user;

  // Call both hooks (required by React Rules of Hooks)
  // We'll use the appropriate one based on authentication status
  const loginHook = useLoginWithSMS();
  const linkHook = useLinkSMS();

  // Use the appropriate hook based on authentication status
  const { sendCode, loginWithCode } = loginHook;
  const { sendCode: linkSendCode, linkWithCode } = linkHook;

  const handleSendCode = () => {
    if (isAuthenticated) {
      linkSendCode({ phone });
    } else {
      sendCode({ phone });
    }
  };

  const handleVerifyCode = async () => {
    try {
      if (isAuthenticated) {
        const user = await linkWithCode({ code, phone });
        console.log("=== SMS Link Success ===");
        console.log("User object:", JSON.stringify(user, null, 2));
        console.log("User ID:", user?.id);
        console.log("Linked accounts:", user?.linked_accounts?.length || 0);
        console.log("========================");
      } else {
        const user = await loginWithCode({ code, phone });
        console.log("=== SMS Login Success ===");
        console.log("User object:", JSON.stringify(user, null, 2));
        console.log("User ID:", user?.id);
        console.log("Linked accounts:", user?.linked_accounts?.length || 0);
        console.log("========================");
      }
    } catch (error) {
      console.error("SMS error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isAuthenticated ? "Link Phone Number" : "SMS Login"}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor="#999"
          inputMode="tel"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handleSendCode}
          style={styles.button}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Send Code</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Verification code"
          placeholderTextColor="#999"
          inputMode="numeric"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={handleVerifyCode}
          style={[styles.button, styles.loginButton]}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isAuthenticated ? "Link" : "Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
