/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", //to have dark mode in tailwind
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
        },
        rose: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
        },
        danger: {
          500: "#DC2626",
          600: "#B91C1C",
        },
        neutral: {
          50: "#ffffff",
          100: "#f8fafc",
          300: "#d1d5db",
          700: "#374151",
          900: "#0b1220",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#0b1220", // used for dark card bg via variables
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
        ],
      },
      boxShadow: {
        soft: "0 6px 18px rgba(15, 23, 42, 0.08)",
        glow: "0 8px 30px rgba(244,63,94,0.12)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          lg: "2rem",
        },
      },
    },
  },
  plugins: [],
};
