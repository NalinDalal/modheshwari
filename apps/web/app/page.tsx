"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@repo/ui/button";
import { BackgroundRippleEffect } from "@repo/ui/background-ripple-effect";

/**
 * Performs  home operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function Home() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-black transition-colors duration-300">
      <BackgroundRippleEffect className="absolute inset-0 -z-10 opacity-50 dark:opacity-30" />

      <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-bold tracking-tight text-black dark:text-white"
        >
          A private system to manage family records
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 max-w-2xl text-base sm:text-lg text-gray-700 dark:text-gray-300"
        >
          View members, manage access, and maintain clarity — without
          spreadsheets or confusion.
        </motion.p>

        {/* Features */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-2 text-gray-600 dark:text-gray-400"
        >
          <li>• Secure, role-based access</li>
          <li>• Simple member status management</li>
          <li>• Designed for families and community heads</li>
        </motion.ul>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <Button
            variant="primary"
            className="mt-6"
            onClick={() => router.push("/signin")}
          >
            Log in
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
