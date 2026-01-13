"use client";

import { useEffect, useState } from "react";
import SearchInput from "./SearchInput";
import { Search, Command, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
/**
 * Search Members Page with:
 * - Better layout
 * - Search icon input bar
 * - Cmd+K / Ctrl+K shortcut focus
 * - Loading shimmer (handled via parent)
 * - Animated background
 * - Better UX with keyboard shortcuts
 */
export default function SearchPage() {
  const [focusTrigger, setFocusTrigger] = useState(0);
  const [isMac, setIsMac] = useState(false);

  // Detect if user is on Mac for keyboard shortcut display
  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf("MAC") >= 0);
  }, []);

  // Cmd+K / Ctrl+K opens the search bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFocusTrigger((n) => n + 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0e1a] to-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-40 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25 mb-6">
            <Search className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">
            Search Members
          </h1>

          <p className="text-gray-400 text-lg">
            Find family members, check profiles, and connect instantly
          </p>
        </motion.div>

        {/* Search Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl"
        >
          {/* Search Input */}
          <div className="relative mb-6">
            <SearchInput
              placeholder="Search by name, email, family, occupation or blood group..."
              focusSignal={focusTrigger}
            />
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Quick search:</span>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-gray-400">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <span className="text-gray-600">+</span>
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs font-mono text-gray-400">
              K
            </kbd>
          </div>
        </motion.div>

        {/* Popular Searches (Optional) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8"
        >
          <p className="text-sm text-gray-500 mb-3">Quick filters:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "All Members",
              "Family Heads",
              "Gotra Heads",
              "Recent Signups",
            ].map((filter) => (
              <button
                key={filter}
                className="px-4 py-2 text-xs font-medium text-gray-400 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white hover:border-white/20 transition-all duration-200"
              >
                {filter}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-gray-600">
            💡 Tip: Use specific keywords for better results. Contact support if
            you can't find someone.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
