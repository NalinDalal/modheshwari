"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, User, Mail, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useDebouncedValue } from "../../hooks/useDebouncedValue";

/**
 * Represents a single search result item.
 */
interface SearchResult {
  id?: string;
  name?: string;
  email?: string;
  role?: string;

  [key: string]: unknown;
}

/**
 * A debounced search input component that queries `/api/search`.
 * @param {{ placeholder?: string }} props - Optional placeholder text.
 * @returns {React.JSX.Element} The rendered search input with results.
 */

export default function SearchInput({
  placeholder = "Search...",
  focusSignal,
}: {
  placeholder?: string;
  focusSignal?: number;
}) {
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // FE memory cache (normalized to lowercase)
  const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());

  // Normalized API base
  const base =
    (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(
      /\/$/,
      "",
    ) + "/api/search";

  // Focus when parent triggers (for Cmd+K / Ctrl+K)
  useEffect(() => {
    if (focusSignal !== undefined) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [focusSignal]);

  useEffect(() => {
    const raw = (debouncedQ || "").trim();
    if (raw.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const query = raw.toLowerCase(); // normalize to match backend

    const cached = cacheRef.current.get(query);
    if (cached) {
      setResults(cached);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    fetch(`${base}?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Search failed");
        const body = await res.json();

        // backend returns: { success: true, message, data: [...] }
        const items: SearchResult[] = body?.data || [];

        cacheRef.current.set(query, items);
        setResults(items);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Search error", err);
      })
      .finally(() => setLoading(false));

    return () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = null;
    };
  }, [debouncedQ, base]);

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "COMMUNITY_HEAD":
        return "from-purple-500 to-pink-500";
      case "COMMUNITY_SUBHEAD":
        return "from-blue-500 to-purple-500";
      case "GOTRA_HEAD":
        return "from-green-500 to-teal-500";
      case "FAMILY_HEAD":
        return "from-orange-500 to-red-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatRole = (role?: string) => {
    if (!role) return "Member";
    return role
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };
  return (
    <div className="w-full relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
          aria-label="Search"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
          ) : q ? (
            <button
              onClick={() => {
                setQ("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {(debouncedQ.length >= 2 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-gradient-to-br from-white/10 to-white/[0.05] backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Loading State */}
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-white/10 rounded" />
                      <div className="h-3 w-1/2 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && results.length === 0 && debouncedQ && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
                  <Search className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-sm text-gray-400">
                  No results found for `&quot;`
                  <span className="text-white font-medium">{debouncedQ}</span>
                  `&quot;`
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Try searching with a different keyword
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2">
                  <p className="px-3 py-2 text-xs text-gray-500 font-medium">
                    {results.length}{" "}
                    {results.length === 1 ? "result" : "results"} found
                  </p>
                </div>

                <ul className="divide-y divide-white/5">
                  {results.map((r) => (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <button className="w-full p-4 hover:bg-white/5 transition-all duration-200 text-left">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${getRoleBadgeColor(r.role)} text-white font-bold shadow-lg`}
                          >
                            {r.name?.charAt(0).toUpperCase() || "?"}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <p className="text-sm font-medium text-white truncate">
                                {r.name || "Unknown"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <p className="text-xs text-gray-400 truncate">
                                {r.email || "No email"}
                              </p>
                            </div>
                          </div>

                          {/* Role Badge */}
                          <div className="flex-shrink-0">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleBadgeColor(r.role)} text-white shadow-lg`}
                            >
                              <Users className="w-3 h-3" />
                              {formatRole(r.role)}
                            </span>
                          </div>
                        </div>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
