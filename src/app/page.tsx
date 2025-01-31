"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import Particle from '../components/Particle';
import LanguageToggle from '../components/LanguageToggle';

export default function Home() {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const { t } = useTranslation(); // Translation hook

  useEffect(() => {
    const generateParticles = () => {
      const particleCount = Math.min(50, Math.floor(window.innerWidth / 20));
      const newParticles = [];
      for (let i = 0; i < particleCount; i++) {
        newParticles.push(<Particle key={i} index={i} totalParticles={particleCount} />);
      }
      setParticles(newParticles);
    };

    generateParticles();
    window.addEventListener('resize', generateParticles);

    return () => {
      window.removeEventListener('resize', generateParticles);
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 text-white overflow-hidden relative">
      {particles}
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Language Toggle */}
        <LanguageToggle />
        
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold mb-8 text-center"
        >
          {t('appTitle')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-center mb-12"
        >
          {t('appTagline')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex justify-center"
        >
          <a
            href="#features"
            className="bg-white text-purple-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-opacity-90 transition duration-300"
          >
            {t('exploreFeatures')}
          </a>
        </motion.div>
      </div>

      <div id="features" className="container mx-auto px-4 py-16 relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t('keyFeatures')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {["Profile Management", "Event Planning", "Family Connections"].map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 * (index + 1) }}
              className="bg-white bg-opacity-10 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold mb-4">{feature}</h3>
              <p className="text-gray-300">
                {t('featureDescription')}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}

