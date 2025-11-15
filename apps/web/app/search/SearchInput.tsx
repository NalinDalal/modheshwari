"use client";

import { useEffect, useRef, useState } from "react";
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
  }, [debouncedQ]);

  return (
    <div className="w-full">
      <div className="relative">
        <label className="sr-only">Search</label>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2 pl-10 focus:ring focus:ring-blue-200 outline-none"
          aria-label="Search"
        />
      </div>

      {loading && (
        <div className="mt-3 space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse h-4 w-full bg-gray-200 rounded"
            />
          ))}
        </div>
      )}

      <ul className="mt-2 space-y-1">
        {!loading && debouncedQ && results.length === 0 && (
          <li className="text-sm text-gray-500 italic">
            Sorry, nothing found for “{debouncedQ}” 😔
          </li>
        )}

        {results.map((r) => (
          <li key={r.id} className="p-2 rounded hover:bg-gray-50">
            {r.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
