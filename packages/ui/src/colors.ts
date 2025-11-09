// Color tokens following a 60-30-10 approach and semantic usage.
// These are exported as raw hex strings so callers can use them in CSS-in-JS
// or inline styles if desired. Tailwind utility classes remain the primary
// styling mechanism in the repo, but tokens make it easier to keep colors
// consistent across components.

const colors = {
  // Dominant (60%) - Neutral base
  neutral100: "#F9FAFB",
  neutral900: "#0B0F19",

  // Brand (30%)
  brand500: "#3B82F6", // blue-500
  brand600: "#2563EB", // blue-600
  brand700: "#1D4ED8", // blue-700

  // Accent / Danger (10%) - CTAs, destructive
  danger500: "#DC2626", // red-600
  danger600: "#B91C1C", // red-700

  // Support
  white: "#FFFFFF",
  black: "#000000",
};

export default colors;
