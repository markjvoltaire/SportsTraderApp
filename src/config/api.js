import { Platform } from "react-native";

// API Configuration
// Set EXPO_PUBLIC_API_BASE_URL in .env for production (e.g. https://api.yourapp.com)
// In __DEV__ we default to localhost for local backend

const getApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, "");
  }
  return __DEV__ ? "https://scoretradebackend.onrender.com" : "https://scoretradebackend.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
