/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
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
          muted: "#0b1220",
        },
        jewel: {
          50: "#fafaf5",
          100: "#f5f5e8",
          200: "#e8e4ce",
          300: "#d4c9a8",
          400: "#b8a47c",
          500: "#9c7f5a",
          600: "#7d6549",
          700: "#5e4d38",
          800: "#3f3527",
          900: "#201d16",
          gold: "#c9a227",
          goldLight: "#e8c547",
          emerald: "#047857",
          ruby: "#be123c",
          saffron: "#ea580c",
          deep: "#1c1917",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        sans: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 18px rgba(15, 23, 42, 0.08)",
        glow: "0 8px 30px rgba(244,63,94,0.12)",
        jewel: "0 4px 20px rgba(201, 162, 39, 0.15)",
        elevated: "0 12px 40px rgba(0, 0, 0, 0.12)",
      },
      backgroundImage: {
        "pattern-dots":
          "radial-gradient(circle, rgba(201,162,39,0.15) 1px, transparent 1px)",
        "pattern-grid":
          "linear-gradient(rgba(201,162,39,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.08) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        shimmer:
          "linear-gradient(90deg, transparent, rgba(201,162,39,0.1), transparent)",
      },
      backgroundSize: {
        dots: "24px 24px",
        grid: "40px 40px",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          lg: "2rem",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "scale-in": "scaleIn 0.4s ease-out",
        shimmer: "shimmer 2s infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
