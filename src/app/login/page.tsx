"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Particle from "@/components/Particle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Role from "@/types/auth";

export default function Login() {
  const router = useRouter(); // ✅ Initialize Next.js router
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  const [loginType, setLoginType] = useState<"familyMember" | "familyHead">(
    "familyMember",
  );
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

  // ✅ Handle form submission
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    // Simulated login API call (Replace this with actual login logic)
    const isAuthenticated = true; // Assume login is successful

    if (isAuthenticated) {
      router.push("/profile"); // ✅ Redirect to profile page
    }
  };

  return (
    <main className="overflow-hidden relative min-h-screen text-white bg-gradient-to-br from-purple-900 to-indigo-900">
      {particles}
      <div className="container flex relative z-10 flex-col justify-center items-center py-16 px-4 mx-auto">
        <Card className="p-6 mt-10 w-full max-w-md text-gray-800 bg-white rounded-2xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {loginType === "familyMember"
                ? t("Family Member Login")
                : t("Family Head Login")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
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
                  required
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
                  required
                  className="block p-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder={t("Enter your password")}
                />
              </div>
              <Button
                type="submit"
                className="w-full text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t("Login")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setLoginType((prev) =>
                    prev === "familyMember" ? "familyHead" : "familyMember",
                  )
                }
              >
                {loginType === "familyMember"
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
