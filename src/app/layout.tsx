/*"use client"; // This makes the component a Client Component

import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"] });

const metadata = {
  title: "Community Management App",
  description: "Connect, Engage, and Thrive Together",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}*/
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { SessionProvider } from "next-auth/react";
import i18n from "../../i18n";
import Particle from "../components/Particle";
import LanguageToggle from "../components/LanguageToggle";
import Navigation from "../components/Navigation";
//import "../styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [particles, setParticles] = useState<JSX.Element[]>([]);

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
    <html lang="en">
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <body className="overflow-hidden relative min-h-screen text-white bg-gradient-to-br from-purple-900 to-indigo-900">
            {particles}
            <div className="relative z-10">
              <LanguageToggle />
              <Navigation />
              {children}
            </div>
          </body>
        </SessionProvider>
      </I18nextProvider>
    </html>
  );
}
