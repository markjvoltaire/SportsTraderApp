import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors, Spacing, Typography, BorderRadius } from "../src/constants/theme";
import LottieLoader from "../src/components/ui/LottieLoader";

export default function ScanScreen() {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to scan prediction markets."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your camera to take photos of prediction markets."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setAnalysisResult(null);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      // TODO: Implement AI analysis API call
      // This would send the image to your backend for AI analysis
      // For now, simulating with a timeout
      
      // Example API call structure:
      // const formData = new FormData();
      // formData.append('image', {
      //   uri: selectedImage,
      //   type: 'image/jpeg',
      //   name: 'prediction-market.jpg',
      // });
      // 
      // const response = await fetch('http://localhost:3000/api/analyze-market', {
      //   method: 'POST',
      //   body: formData,
      // });
      // 
      // const result = await response.json();
      // setAnalysisResult(result);

      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setAnalysisResult({
        markets: [
          {
            event: "Lakers vs Warriors",
            market: "Lakers to win",
            currentPrice: 0.65,
            recommendation: "Buy",
          },
          {
            event: "Lakers vs Warriors",
            market: "Warriors to win",
            currentPrice: 0.35,
            recommendation: "Sell",
          },
        ],
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      Alert.alert("Error", "Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Market</Text>
    
      </View>

      <View style={styles.content}>
        {!selectedImage ? (
          <View style={styles.uploadSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="scan-outline" size={64} color={Colors.textSecondary} />
            </View>
            <Text style={styles.instructionText}>
              Take a photo or select a screenshot of a prediction market to analyze
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={24} color="#000" />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={24} color={Colors.textPrimary} />
                <Text style={styles.secondaryButtonText}>Choose from Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={clearImage}
              >
                <Ionicons name="close-circle" size={32} color={Colors.danger} />
              </TouchableOpacity>
            </View>

            {!analyzing && !analysisResult && (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={analyzeImage}
              >
                <Ionicons name="sparkles" size={24} color="#000" />
                <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              </TouchableOpacity>
            )}

            {analyzing && (
              <View style={styles.analyzingContainer}>
                <LottieLoader size="large" />
                <Text style={styles.analyzingText}>
                  Analyzing prediction markets...
                </Text>
              </View>
            )}

            {analysisResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Analysis Results</Text>
                {analysisResult.markets?.map((market, index) => (
                  <View key={index} style={styles.marketCard}>
                    <Text style={styles.marketEvent}>{market.event}</Text>
                    <Text style={styles.marketName}>{market.market}</Text>
                    <View style={styles.marketInfo}>
                      <Text style={styles.marketPrice}>
                        ${(market.currentPrice * 100).toFixed(0)}¢
                      </Text>
                      <View
                        style={[
                          styles.recommendationBadge,
                          market.recommendation === "Buy"
                            ? styles.buyBadge
                            : styles.sellBadge,
                        ]}
                      >
                        <Text style={styles.recommendationText}>
                          {market.recommendation}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.newScanButton}
                  onPress={clearImage}
                >
                  <Text style={styles.newScanButtonText}>Scan Another</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    position: "relative",
  },
  topBarIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  uploadSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: Spacing.xl,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  buttonContainer: {
    width: "100%",
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    ...Typography.body,
    color: "#000",
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  imageSection: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "contain",
    backgroundColor: "#1A1A1A",
  },
  removeButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  analyzeButtonText: {
    ...Typography.body,
    color: "#000",
    fontWeight: "600",
  },
  analyzingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
  },
  analyzingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  resultContainer: {
    flex: 1,
  },
  resultTitle: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  marketCard: {
    backgroundColor: "#1A1A1A",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  marketEvent: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  marketName: {
    ...Typography.cardTitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  marketInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  marketPrice: {
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  recommendationBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  buyBadge: {
    backgroundColor: Colors.successMuted,
  },
  sellBadge: {
    backgroundColor: Colors.dangerMuted,
  },
  recommendationText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  newScanButton: {
    backgroundColor: "transparent",
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  newScanButtonText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "600",
  },
});
