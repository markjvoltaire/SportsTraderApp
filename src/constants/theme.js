/**
 * SportsTrader Design System
 * Centralized theme constants following fintech UX best practices
 */

// Color Palette - Dark Theme
export const Colors = {
  // Primary surfaces
  background: "#141414",
  surface: "#24232A",
  surfaceAlt: "#2A2A2A",

  // Accent - Vibrant sports betting colors
  primary: "#8B5CF6", // Vibrant purple/blue
  primaryDark: "#6D28D9",
  primaryLight: "#A78BFA",
  primaryGradient: ["#8B5CF6", "#A78BFA"],
  accentGradient: ["#7C3AED", "#C4B5FD"],
  accentTeal: "#06B6D4", // Teal for second team
  accentCyan: "#14B8A6",
  success: "#34D399",
  successMuted: "rgba(52, 211, 153, 0.2)",
  danger: "#F87171",
  dangerMuted: "rgba(248, 113, 113, 0.2)",
  warning: "#FBBF24",
  flame: "#F59E0B", // Orange for flame/bets indicator

  // Text - Light colors for dark background
  textPrimary: "#FFFFFF",
  textSecondary: "#E5E5E5",
  textTertiary: "#B0B0B0",
  textMuted: "#808080",

  // Glass & borders
  glassSurface: "rgba(31, 31, 31, 0.8)",
  glassBorder: "rgba(139, 92, 246, 0.3)",
  border: "rgba(255, 255, 255, 0.1)",
  borderFocus: "rgba(139, 92, 246, 0.5)",
};

// Typography Scale
export const Typography = {
  heroPrice: {
    fontSize: 56,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.4,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 0.15,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.6,
  },
};

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 12, // Small chips
  md: 16, // Buttons
  lg: 20, // Cards
  xl: 28, // Large containers, CTAs
  round: 999, // Fully rounded
};

// Shadow/Glow Effects
export const Shadows = {
  primaryGlow: {
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 24,
  },
  cardShadow: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 18,
  },
  subtleShadow: {
    shadowColor: "rgba(0, 0, 0, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  glassShadow: {
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 26,
  },
};

// Animation Timings
export const Animations = {
  fadeIn: {
    duration: 280,
    easing: "ease-out",
  },
  fadeOut: {
    duration: 180,
    easing: "ease-in",
  },
  buttonPress: {
    duration: 100,
    scale: 0.96,
    opacity: 0.8,
  },
  cardPress: {
    duration: 150,
    scale: 0.98,
  },
  chartLoad: {
    duration: 600,
    easing: "ease-out",
    delay: 200,
  },
};

// Touch Targets (minimum sizes for accessibility)
export const TouchTargets = {
  minimum: 44,
  recommended: 48,
};

// Common Component Styles
export const CommonStyles = {
  // Primary CTA Button
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Shadows.primaryGlow.shadowColor,
    shadowOffset: Shadows.primaryGlow.shadowOffset,
    shadowOpacity: Shadows.primaryGlow.shadowOpacity,
    shadowRadius: Shadows.primaryGlow.shadowRadius,
    elevation: Shadows.primaryGlow.elevation,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.round,
    paddingVertical: 14,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Shadows.subtleShadow.shadowColor,
    shadowOffset: Shadows.subtleShadow.shadowOffset,
    shadowOpacity: Shadows.subtleShadow.shadowOpacity,
    shadowRadius: Shadows.subtleShadow.shadowRadius,
    elevation: Shadows.subtleShadow.elevation,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Card Container
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Shadows.cardShadow.shadowColor,
    shadowOffset: Shadows.cardShadow.shadowOffset,
    shadowOpacity: Shadows.cardShadow.shadowOpacity,
    shadowRadius: Shadows.cardShadow.shadowRadius,
    elevation: Shadows.cardShadow.elevation,
  },
  glassCard: {
    backgroundColor: Colors.glassSurface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: Shadows.glassShadow.shadowColor,
    shadowOffset: Shadows.glassShadow.shadowOffset,
    shadowOpacity: Shadows.glassShadow.shadowOpacity,
    shadowRadius: Shadows.glassShadow.shadowRadius,
    elevation: Shadows.glassShadow.elevation,
    overflow: "hidden",
    backdropFilter: "blur(20px)",
  },

  // Icon Button
  iconButton: {
    width: TouchTargets.recommended,
    height: TouchTargets.recommended,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Shadows.subtleShadow.shadowColor,
    shadowOffset: Shadows.subtleShadow.shadowOffset,
    shadowOpacity: Shadows.subtleShadow.shadowOpacity,
    shadowRadius: Shadows.subtleShadow.shadowRadius,
    elevation: Shadows.subtleShadow.elevation,
  },
};

// Export all as default for convenience
export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Animations,
  TouchTargets,
  CommonStyles,
};
