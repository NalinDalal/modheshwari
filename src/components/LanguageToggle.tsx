"use client";
import { usePathname } from "next/navigation";
import { useTranslation } from "next-i18next";
import type React from "react"; // Import React

const LanguageToggle: React.FC = () => {
  const pathname = usePathname();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLocale = i18n.language === "en" ? "hi" : "en";
    window.location.href = `/${newLocale}${pathname}`;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="absolute top-4 right-4 py-2 px-4 text-sm font-semibold bg-white bg-opacity-20 rounded-full transition duration-300 hover:bg-opacity-30"
    >
      {i18n.language === "en" ? "हिंदी" : "English"}
    </button>
  );
};

export default LanguageToggle;
