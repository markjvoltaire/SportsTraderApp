import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base dimensions (iPhone 14/15 - 390x844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

/**
 * Normalize width based on screen width
 * @param {number} size - The size to normalize
 * @returns {number} - Normalized size
 */
export const normalizeWidth = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};

/**
 * Normalize height based on screen height
 * @param {number} size - The size to normalize
 * @returns {number} - Normalized size
 */
export const normalizeHeight = (size) => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  return Math.round(size * scale);
};

/**
 * Normalize size based on screen width (most common use case)
 * @param {number} size - The size to normalize
 * @returns {number} - Normalized size
 */
export const normalize = (size) => {
  return normalizeWidth(size);
};

/**
 * Normalize font size based on screen width
 * @param {number} size - The font size to normalize
 * @returns {number} - Normalized font size
 */
export const normalizeFont = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get responsive width as percentage
 * @param {number} percentage - Percentage of screen width (0-100)
 * @returns {number} - Width in pixels
 */
export const widthPercentage = (percentage) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

/**
 * Get responsive height as percentage
 * @param {number} percentage - Percentage of screen height (0-100)
 * @returns {number} - Height in pixels
 */
export const heightPercentage = (percentage) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

/**
 * Get screen dimensions
 * @returns {Object} - { width, height }
 */
export const getScreenDimensions = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  };
};

/**
 * Check if device is small (iPhone SE, etc.)
 * @returns {boolean}
 */
export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375;
};

/**
 * Check if device is large (iPhone Pro Max, etc.)
 * @returns {boolean}
 */
export const isLargeDevice = () => {
  return SCREEN_WIDTH > 414;
};

/**
 * Get responsive spacing multiplier
 * @returns {number} - Multiplier for spacing (1.0 for base, adjusted for small/large)
 */
export const getSpacingMultiplier = () => {
  if (isSmallDevice()) {
    return 0.9; // Slightly smaller spacing on small devices
  }
  if (isLargeDevice()) {
    return 1.1; // Slightly larger spacing on large devices
  }
  return 1.0; // Base spacing
};

// Export screen dimensions as constants
export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

export default {
  normalize,
  normalizeWidth,
  normalizeHeight,
  normalizeFont,
  widthPercentage,
  heightPercentage,
  getScreenDimensions,
  isSmallDevice,
  isLargeDevice,
  getSpacingMultiplier,
  SCREEN_DIMENSIONS,
};


