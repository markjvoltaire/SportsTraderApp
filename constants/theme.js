/**
 * SportsTrader Design System
 * Centralized theme constants following fintech UX best practices
 */

// Color Palette
export const Colors = {
  // Primary surfaces
  background: '#070b11',      // Soft midnight
  surface: '#11161f',         // Card backgrounds
  surfaceAlt: '#161c27',      // Elevated surfaces kept muted

  // Accent
  primary: '#2fdd7f',         // Fresh success green
  primaryDark: '#25c46d',
  primaryLight: '#4be894',
  danger: '#f26b6b',
  warning: '#ffb347',

  // Text
  textPrimary: '#f5f7fb',
  textSecondary: '#c7ced9',
  textTertiary: '#8a94a6',
  textMuted: '#657084',

  // Borders
  border: 'rgba(255,255,255,0.05)',
  borderFocus: 'rgba(255,255,255,0.12)',
};

// Typography Scale
export const Typography = {
  heroPrice: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.textTertiary,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
};

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border Radius
export const BorderRadius = {
  sm: 8,   // Small chips
  md: 12,  // Buttons
  lg: 18,  // Cards
  xl: 24,  // Large containers, CTAs
  round: 999, // Fully rounded
};

// Shadow/Glow Effects
export const Shadows = {
  primaryGlow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardShadow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtleShadow: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// Animation Timings
export const Animations = {
  fadeIn: {
    duration: 280,
    easing: 'ease-out',
  },
  fadeOut: {
    duration: 180,
    easing: 'ease-in',
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
    easing: 'ease-out',
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
    borderRadius: BorderRadius.xl,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#041010',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Secondary Button
  secondaryButton: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Card Container
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // Icon Button
  iconButton: {
    width: TouchTargets.recommended,
    height: TouchTargets.recommended,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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

