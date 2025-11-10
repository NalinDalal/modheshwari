"use client";

import NavBar from "../components/NavBar";
import { Button } from "@repo/ui/button";
import { BackgroundRippleEffect } from "@repo/ui/background-ripple-effect";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function Home() {
  const router = useRouter();
  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-black transition-colors duration-300">
      {/* subtle animated ripples */}
      <BackgroundRippleEffect className="absolute inset-0 -z-10 opacity-50 dark:opacity-30" />

      <NavBar />

      <main className="flex flex-col items-center justify-center py-20">
        {/* animated header */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-5xl font-bold text-black dark:text-white tracking-tight"
        >
          Welcome to Modheshwari
        </motion.h1>

        {/* soft description fade-in */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-4 text-lg text-gray-700 dark:text-gray-300"
        >
          Simplified and clean. Nothing fancy — just clarity.
        </motion.p>

        {/* animated call-to-action */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 text-center"
        >
          <Button
            variant="secondary"
            className="px-6 py-3 text-lg font-medium rounded-lg bg-gradient-to-r from-gray-900 to-gray-700 text-white dark:from-gray-100 dark:to-gray-300 dark:text-black shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => {
              router.push("/signin");
            }}
          >
            Log In
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
