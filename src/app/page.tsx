"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import Particle from "../components/Particle";
import LanguageToggle from "../components/LanguageToggle";

export default function Home() {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const { t } = useTranslation(); // Translation hook

  useEffect(() => {
    const generateParticles = () => {
      const particleCount = Math.min(50, Math.floor(window.innerWidth / 20));
      const newParticles = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(
          <Particle key={i} index={i} totalParticles={particleCount} />,
        );
      }
      setParticles(newParticles);
    };

    generateParticles();
    window.addEventListener("resize", generateParticles);

    return () => {
      window.removeEventListener("resize", generateParticles);
    };
  }, []);

  return (
    <main className="overflow-hidden relative min-h-screen text-white bg-gradient-to-br from-purple-900 to-indigo-900">
      {particles}
      <div className="container relative z-10 py-16 px-4 mx-auto">
        {/* Language Toggle */}
        <LanguageToggle />

        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-5xl font-bold text-center md:text-7xl"
        >
          {t("appTitle")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12 text-xl text-center md:text-2xl"
        >
          {t("appTagline")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center"
        >
          <a
            href="#features"
            className="py-4 px-8 text-lg font-semibold text-purple-900 bg-white rounded-full transition duration-300 hover:bg-opacity-90"
          >
            {t("exploreFeatures")}
          </a>
        </motion.div>
      </div>

      <div id="features" className="container relative z-10 py-16 px-4 mx-auto">
        <h2 className="mb-8 text-3xl font-bold text-center md:text-4xl">
          {t("keyFeatures")}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {["Profile Management", "Event Planning", "Family Connections"].map(
            (feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 * (index + 1) }}
                className="p-6 bg-white bg-opacity-10 rounded-lg"
              >
                <h3 className="mb-4 text-xl font-semibold">{t(feature)}</h3>
                <p className="text-gray-300">{t("featureDescription")}</p>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </main>
  );
}
