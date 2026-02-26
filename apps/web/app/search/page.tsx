"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { DreamySunsetBackground } from "@repo/ui/theme-DreamySunsetBackground";

import SearchInput from "./SearchInput";
import apiFetch from "../../lib/api";
import { API_BASE } from "../../lib/config";
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
  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [notifications, setNotifications] = useState<any[] | null>(null);

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

  // Load current user and notifications for small header preview
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const me = await apiFetch(`${API_BASE}/me`, { throwOnError: false });
        if (me?.ok === false) {
          setUser(null);
        } else {
          const u = me?.data?.data ?? me?.data ?? me;
          if (mounted) setUser(u || null);
        }
      } catch (e) {
        setUser(null);
      }

      try {
        const not = await apiFetch(`${API_BASE}/notifications`, {
          throwOnError: false,
        });
        if (not?.ok === false) {
          setNotifications(null);
        } else {
          const list = not?.data?.data ?? not?.data ?? not;
          if (mounted) setNotifications(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        setNotifications(null);
      }
    };

    load();

    const handler = () => setTimeout(load, 10);
    window.addEventListener("storage", handler);
    window.addEventListener("authChanged", handler as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handler);
      window.removeEventListener("authChanged", handler as EventListener);
    };
  }, []);

  return (
    <DreamySunsetBackground className="relative overflow-hidden">
      {/* Animated Background — soft rose/pink blobs to complement the gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-40 left-1/4 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern — light rgba so it's visible on the pink-to-white bg without clashing */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-xl shadow-lg shadow-pink-200/40 border border-white/60 mb-6">
            <Search className="w-8 h-8 text-pink-500" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-gray-800 via-rose-700 to-pink-500 bg-clip-text text-transparent mb-4">
            Search Members
          </h1>

          <p className="text-gray-500 text-lg">
            Find family members, check profiles, and connect instantly
          </p>

          {/* Small auth / notifications preview */}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600"></div>
        </motion.div>

        {/* Search Card — frosted glass that blends with the light pink background */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/70 shadow-xl shadow-pink-100/50"
        >
          {/* Search Input */}
          <div className="relative mb-6">
            <SearchInput
              placeholder="Search by name, email, family, occupation or blood group..."
              focusSignal={focusTrigger}
            />
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>Quick search:</span>
            <kbd className="px-2 py-1 bg-white/60 border border-gray-200 rounded text-xs font-mono text-gray-500 shadow-sm">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <span className="text-gray-300">+</span>
            <kbd className="px-2 py-1 bg-white/60 border border-gray-200 rounded text-xs font-mono text-gray-500 shadow-sm">
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
          <p className="text-sm text-gray-400 mb-3">Advanced Filters:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-500">
            {[
              { label: "By Gotra", desc: "Filter by gotra/clan" },
              { label: "By Profession", desc: "Find by occupation" },
              { label: "By Location", desc: "Search by area/city" },
              { label: "By Blood Group", desc: "Filter by blood type" },
              { label: "By Role", desc: "Find by member role" },
              { label: "Text Search", desc: "Multi-field search" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="p-3 bg-white/35 backdrop-blur-md border border-white/60 rounded-xl shadow-sm hover:bg-white/50 transition-all duration-200 cursor-default"
              >
                <span className="font-semibold text-gray-700">{label}</span>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
              </div>
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
          <p className="text-xs text-gray-400">
            💡 Tip: Use specific keywords for better results. Contact support if
            you can&apos;t find someone.
          </p>
        </motion.div>
      </div>
    </DreamySunsetBackground>
  );
}
