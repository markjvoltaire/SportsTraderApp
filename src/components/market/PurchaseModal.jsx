import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "../../constants/theme";
import { formatSharePrice, formatCurrency } from "../../utils/formatters";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function PurchaseModal({
  visible,
  onClose,
  team,
  price,
  color,
  market,
  onConfirm,
  loading = false,
  error = null,
}) {
  const [quantity, setQuantity] = useState("10");
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const keyboardOffset = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const lastPanY = useRef(0);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // Reset quantity when modal opens
      setQuantity("10");
      // Reset pan values
      panY.setValue(0);
      lastPanY.current = 0;
      // Slide up and fade in backdrop
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Handle keyboard events for smooth animation
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        // Move modal up so the confirm button is visible above the keyboard
        // Keyboard height minus safe area (already in padding) plus small buffer
        const bufferSpace = 20; // Small buffer above keyboard
        const safeAreaOffset = Platform.OS === "ios" ? 40 : 0;
        const offset = -(e.endCoordinates.height - safeAreaOffset + bufferSpace);
        
        Animated.timing(keyboardOffset, {
          toValue: offset,
          duration: Platform.OS === "ios" ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (e) => {
        Animated.timing(keyboardOffset, {
          toValue: 0,
          duration: Platform.OS === "ios" ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleClose = () => {
    // Animate out first
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, hide modal and call onClose
      setIsVisible(false);
      onClose();
    });
  };

  const numQuantity = parseInt(quantity) || 0;
  // Calculate total cost from quantity and price
  const totalCost = numQuantity > 0 && price > 0 
    ? Math.round(numQuantity * price * 1e6) / 1e6 
    : 0;
  // Potential payout: if team wins, each share is worth $1
  // So payout = quantity * $1
  const potentialPayout = numQuantity * 1;
  const potentialProfit = potentialPayout - totalCost;

  const handleConfirmPurchase = () => {
    const payload = {
      quantity: numQuantity,
      totalCost,
      team,
      price,
      market,
    };
    onConfirm?.(payload);
  };

  const handleQuantityChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, "");
    setQuantity(cleaned);
  };

  const incrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    setQuantity(String(current + 10));
  };

  const decrementQuantity = () => {
    const current = parseInt(quantity) || 0;
    if (current > 10) {
      setQuantity(String(current - 10));
    } else if (current > 0) {
      setQuantity("0");
    }
  };

  // Pan responder for swipe down gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward vertical gestures
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 2;
      },
      onPanResponderGrant: () => {
        // Stop any ongoing animations and capture current position
        panY.setOffset(lastPanY.current);
        panY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward swipes
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
          // Update backdrop opacity based on drag distance
          const dragProgress = Math.min(gestureState.dy / 300, 1);
          backdropAnim.setValue(1 - dragProgress * 0.6);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        panY.flattenOffset();
        lastPanY.current = gestureState.dy;

        // If swiped down more than 150px, close the modal
        const dismissThreshold = 150;
        if (gestureState.dy > dismissThreshold || gestureState.vy > 0.5) {
          // Dismiss modal
          Animated.parallel([
            Animated.timing(panY, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(backdropAnim, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsVisible(false);
            onClose();
            panY.setValue(0);
            lastPanY.current = 0;
          });
        } else {
          // Snap back to original position
          Animated.parallel([
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }),
            Animated.timing(backdropAnim, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            lastPanY.current = 0;
          });
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                { translateY: slideAnim },
                { translateY: panY },
                { translateY: keyboardOffset },
              ],
            },
          ]}
        >
          {/* Team Color Gradients */}
          <LinearGradient
            colors={[`${color}33`, `${color}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.topGradient}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[`${color}00`, `${color}22`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bottomGradient}
            pointerEvents="none"
          />

          {/* Handle Bar - Draggable Area */}
          <View 
            style={styles.handleBarContainer}
            {...panResponder.panHandlers}
          >
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header} {...panResponder.panHandlers}>
            <View style={styles.headerLeft}>
              <View
                style={[styles.colorIndicator, { backgroundColor: color }]}
              />
              <View>
                <Text style={styles.headerTitle}>Buy {team}</Text>
                <Text style={styles.headerSubtitle}>
                  {formatSharePrice(price)} per share
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quantity Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Number of Shares</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={decrementQuantity}
              >
                <Ionicons name="remove" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={handleQuantityChange}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={incrementQuantity}
              >
                <Ionicons name="add" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Cost Breakdown */}
          <View style={styles.section}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Share Price</Text>
              <Text style={styles.breakdownValue}>
                {formatSharePrice(price)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Quantity</Text>
              <Text style={styles.breakdownValue}>{numQuantity}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.totalLabel}>Total Cost</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalCost)}</Text>
            </View>
          </View>

          {/* Potential Payout */}
          <View style={styles.payoutBox}>
            <View style={styles.payoutHeader}>
              <Ionicons
                name="trophy-outline"
                size={20}
                color={color}
              />
              <Text style={styles.payoutHeaderText}>Potential Payout</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>If {team} wins:</Text>
              <Text style={styles.payoutValue}>
                {formatCurrency(potentialPayout)}
              </Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.profitLabel}>Potential Profit:</Text>
              <Text style={[styles.profitValue, { color: color }]}>
                {formatCurrency(potentialProfit)}
              </Text>
            </View>
          </View>

          {error ? (
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          ) : null}

          {/* Confirm Button */}
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { backgroundColor: color },
              (numQuantity === 0 || loading) && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirmPurchase}
            disabled={numQuantity === 0 || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Confirm Purchase · {formatCurrency(totalCost)}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === "ios" ? 40 : Spacing.xl,
    paddingHorizontal: Spacing.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    position: "relative",
    overflow: "hidden",
  },
  topGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 200,
    zIndex: 0,
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
    zIndex: 0,
  },
  handleBarContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginHorizontal: -Spacing.xl,
    marginTop: -Spacing.sm,
    zIndex: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: "center",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  colorIndicator: {
    width: 8,
    height: 48,
    borderRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    fontSize: 24,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  payoutBox: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    zIndex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  payoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  payoutHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  payoutLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  payoutValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  profitLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  profitValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  confirmButton: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.danger || "#EF4444",
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});

