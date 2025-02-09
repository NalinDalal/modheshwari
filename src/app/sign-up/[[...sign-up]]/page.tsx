//custom
"use client";

import Particle from "@/components/Particle";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUp } from "@clerk/nextjs";

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
                ? t("Family Member Registration")
                : t("Family Head Registration")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Clerk SignUp Component */}
            <SignUp
              appearance={{
                elements: {
                  card: "shadow-none border-none bg-transparent",
                  headerTitle: "text-xl font-bold text-gray-900",
                  formFieldInput:
                    "block p-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500",
                  primaryButton:
                    "w-full text-white bg-indigo-600 hover:bg-indigo-700",
                  footerActionLink: "text-indigo-600 hover:underline",
                },
              }}
              afterSignUp={async (user) => {
                if (user.publicMetadata?.role === "family-head") {
                  const response = await fetch("/api/family/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id }),
                  });

                  if (response.ok) {
                    const { familyId } = await response.json();

                    // Save familyId in Clerk metadata
                    await fetch(
                      `https://api.clerk.dev/v1/users/${user.id}/metadata`,
                      {
                        method: "PATCH",
                        headers: {
                          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          public_metadata: { familyId },
                        }),
                      },
                    );

                    router.push("/dashboard");
                  }
                }
              }}
            />

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
                  ? t("Switch to Family Head Registration")
                  : t("Switch to Family Member Registration")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
