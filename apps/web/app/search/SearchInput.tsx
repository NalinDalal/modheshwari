"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X, Filter } from "lucide-react";
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
  profile?: {
    gotra?: string;
    profession?: string;
    bloodGroup?: string;
    location?: string;
  };
  families?: Array<{ name?: string }>;

  [key: string]: unknown;
}

type FilterMode =
  | "text"
  | "gotra"
  | "profession"
  | "location"
  | "blood"
  | "role";

/**
 * A debounced search input component with advanced filters that queries `/api/search`.
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
  const [filterMode, setFilterMode] = useState<FilterMode>("text");
  const [showFilters, setShowFilters] = useState(false);

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

  // Build query string based on filter mode
  const buildQuery = (input: string, mode: FilterMode): string => {
    if (!input.trim()) return "";
    switch (mode) {
      case "gotra":
        return `gotra:${input}`;
      case "profession":
        return `profession:${input}`;
      case "location":
        return `location:${input}`;
      case "blood":
        return `blood:${input}`;
      case "role":
        return `role:${input}`;
      default:
        return input;
    }
  };

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

    const query = buildQuery(raw, filterMode).toLowerCase(); // normalize to match backend

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

        // backend returns: { success: true, message, data: { data: [...], pagination: {...} } }
        const items: SearchResult[] = body?.data?.data || [];

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
  }, [debouncedQ, filterMode, base]);

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
        return "from-gray-400 to-gray-500";
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
      {/* Search Input with Filter Selector */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-16 py-4 rounded-xl border border-white/70 bg-white/50 backdrop-blur-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300/60 focus:border-white/90 shadow-sm transition-all"
          aria-label="Search"
        />

        {/* Filter & Clear Buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 transition-colors rounded-lg ${
              showFilters
                ? "text-pink-500 bg-pink-50"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Toggle filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          {loading ? (
            <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />
          ) : q ? (
            <button
              onClick={() => {
                setQ("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Filter Buttons */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 flex flex-wrap gap-2 p-3 bg-white/60 backdrop-blur-xl border border-white/70 rounded-xl shadow-lg z-40"
          >
            {(
              [
                "text",
                "gotra",
                "profession",
                "location",
                "blood",
                "role",
              ] as FilterMode[]
            ).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setFilterMode(mode);
                  setQ("");
                  inputRef.current?.focus();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterMode === mode
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-200"
                    : "bg-white/70 text-gray-500 border border-gray-200/80 hover:bg-white hover:text-gray-700"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dropdown */}
      <AnimatePresence>
        {(debouncedQ.length >= 2 || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white/60 backdrop-blur-2xl rounded-xl border border-white/70 shadow-xl shadow-pink-100/40 overflow-hidden z-50"
          >
            {/* Loading State */}
            {loading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 animate-pulse"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-200/70" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200/70 rounded" />
                      <div className="h-3 w-1/2 bg-gray-200/50 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && results.length === 0 && debouncedQ && (
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100/80 mb-3">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  No results found for{" "}
                  <span className="text-gray-700 font-medium">
                    &ldquo;{debouncedQ}&rdquo;
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching with a different keyword
                </p>
              </div>
            )}

            {/* Results List */}
            {!loading && results.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs text-gray-400 font-medium">
                    {results.length}{" "}
                    {results.length === 1 ? "result" : "results"} found
                  </p>
                </div>

                <ul className="divide-y divide-gray-100/60">
                  {results.map((r) => (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group"
                    >
                      <button className="w-full px-4 py-3 hover:bg-white/50 transition-all duration-150 text-left">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${getRoleBadgeColor(r.role)} text-white font-bold shadow-sm flex-shrink-0`}
                          >
                            {r.name?.charAt(0).toUpperCase() || "?"}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {r.name || "Unknown"}
                              </p>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r ${getRoleBadgeColor(r.role)} text-white shadow-sm`}
                              >
                                {formatRole(r.role)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 truncate mb-2">
                              {r.email || "No email"}
                            </p>

                            {/* Profile Info */}
                            <div className="flex flex-wrap gap-1.5 text-xs">
                              {r.profile?.gotra && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                                  Gotra: {r.profile.gotra}
                                </span>
                              )}
                              {r.profile?.profession && (
                                <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md border border-green-100">
                                  {r.profile.profession}
                                </span>
                              )}
                              {r.profile?.location && (
                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                                  📍 {r.profile.location}
                                </span>
                              )}
                              {r.profile?.bloodGroup && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-md border border-red-100">
                                  🩸 {r.profile.bloodGroup}
                                </span>
                              )}
                            </div>

                            {/* Family */}
                            {r.families && r.families.length > 0 && (
                              <p className="text-xs text-amber-600 mt-1.5">
                                Family:{" "}
                                {r.families.map((f) => f.name).join(", ")}
                              </p>
                            )}
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
