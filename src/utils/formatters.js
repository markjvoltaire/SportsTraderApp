/**
 * Utility functions for formatting values
 */

export function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return Math.round(value * 100) + "¢";
}

export function formatCurrency(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatTimestamp(value) {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Extract date components from a date string to avoid timezone conversion issues
 * Returns {year, month, day} from the original string if possible
 */
function extractDateComponents(dateString) {
  if (!dateString) return null;
  
  // Try to parse date from string format like "2025-12-04" or "2025-12-04 18:00:00+00"
  const dateMatch = String(dateString).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    return {
      year: parseInt(dateMatch[1], 10),
      month: parseInt(dateMatch[2], 10) - 1, // JS months are 0-indexed
      day: parseInt(dateMatch[3], 10),
    };
  }
  return null;
}

export function formatGameDate(value) {
  if (!value) return "TBD";
  
  // Try to extract date from string first
  const dateComponents = extractDateComponents(value);
  const date = new Date(value);
  
  if (Number.isNaN(date.getTime())) return value;
  
  let year, month, day;
  if (dateComponents) {
    ({ year, month, day } = dateComponents);
  } else {
    // Fallback: use UTC date to avoid timezone issues
    year = date.getUTCFullYear();
    month = date.getUTCMonth();
    day = date.getUTCDate();
  }
  
  // Create a date object for formatting
  const dateForFormat = new Date(year, month, day);
  return dateForFormat.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatSharePrice(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return `$${value.toFixed(2)}`;
}

export function truncateHash(hash) {
  if (!hash || typeof hash !== "string") return "—";
  if (hash.length <= 12) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}

