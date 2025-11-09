"use client";

import { useEffect } from "react";

export default function ThemeInitializer() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      const isDark = hour >= 19 || hour < 7;
      document.documentElement.classList.toggle("dark", isDark);
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null; // no UI, just sets theme
}
