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
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        danger: {
          500: "#DC2626",
          600: "#B91C1C",
        },
        neutral: {
          100: "#F9FAFB",
          900: "#0B0F19",
        },
      },
    },
  },
  plugins: [],
};
