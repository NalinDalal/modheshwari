"use client";

import Particle from "@/components/Particle";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Register() {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const [registerType, setRegisterType] = useState<
    "familyMember" | "familyHead"
  >("familyMember");
  const { t } = useTranslation();

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
      <div className="container flex relative z-10 flex-col justify-center items-center py-16 px-4 mx-auto">
        <Card className="p-6 mt-10 w-full max-w-md text-gray-800 bg-white rounded-2xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {registerType === "familyMember"
                ? t("Family Member Login")
                : t("Family Head Login")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("Email")}
                </label>
                <input
                  type="email"
                  id="email"
                  className="block p-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={t("Enter your email")}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("Password")}
                </label>
                <input
                  type="password"
                  id="password"
                  className="block p-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={t("Enter your password")}
                />
              </div>
              <Button className="w-full text-white bg-indigo-600 hover:bg-indigo-700">
                {t("Register")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setRegisterType((prev) =>
                    prev === "familyMember" ? "familyHead" : "familyMember",
                  )
                }
              >
                {registerType === "familyMember"
                  ? t("Switch to Family Head Login")
                  : t("Switch to Family Member Login")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
