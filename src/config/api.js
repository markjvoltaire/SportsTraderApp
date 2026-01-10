import { Platform } from "react-native";

// API Configuration
// For iOS Simulator: Use Mac's IP address
// For Android Emulator: Use 10.0.2.2 (special IP for Android emulator)
// For Physical Devices: Use Mac's IP address
// For Production: Use your actual production API URL

const getApiBaseUrl = () => {
  // Use deployed backend URL
  return "https://scoretradebackend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
