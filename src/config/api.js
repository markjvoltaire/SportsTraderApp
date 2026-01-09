import { Platform } from "react-native";

// API Configuration
// For iOS Simulator: Use Mac's IP address
// For Android Emulator: Use 10.0.2.2 (special IP for Android emulator)
// For Physical Devices: Use Mac's IP address
// For Production: Use your actual production API URL

const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === "ios") {
      // iOS Simulator - use Mac's IP address
      return "http://192.168.1.177:3000";
    } else if (Platform.OS === "android") {
      // Android Emulator - use special IP
      return "http://10.0.2.2:3000";
    } else {
      // Fallback for other platforms
      return "http://192.168.1.177:3000";
    }
  } else {
    // Production mode - replace with your actual production API URL
    return "https://your-production-api.com";
  }
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
