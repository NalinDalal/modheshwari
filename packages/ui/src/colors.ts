// Color tokens following a 60-30-10 approach and semantic usage.
// These are exported as raw hex strings so callers can use them in CSS-in-JS
// or inline styles if desired. Tailwind utility classes remain the primary
// styling mechanism in the repo, but tokens make it easier to keep colors
// consistent across components.

export const colors = {
  // Dominant (60%) - neutral background / surface
  neutral100: "#FAFAFB",
  neutral900: "#0F1724",

  // Secondary (30%) - brand / key areas
  brand500: "#F59E0B", // amber-500
  brand700: "#D97706", // amber-700

  // Accent (10%) - CTAs, destructive
  danger500: "#DC2626", // red-600
  danger600: "#B91C1C", // red-700

  // Support
  white: "#FFFFFF",
  black: "#000000",
};

export default colors;
