"use client";

import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

/**
 * Represents a single search result item.
 */
interface SearchResult {
  id?: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * A debounced search input component that queries `/api/search`.
 * @param {{ placeholder?: string }} props - Optional placeholder text.
 * @returns {React.JSX.Element} The rendered search input with results.
 */
export default function SearchInput({
  placeholder = "Search...",
}: {
  placeholder?: string;
}): React.JSX.Element {
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, SearchResult[]>>(new Map());

  useEffect(() => {
    const query = (debouncedQ || "").trim();
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const cached = cacheRef.current.get(query);
    if (cached) {
      setResults(cached);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    fetch(
      `${
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"
      }/search?q=${encodeURIComponent(query)}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Search failed");
        const body = await res.json();
        const items: SearchResult[] =
          body?.data?.data || body?.data || body?.results || [];
        cacheRef.current.set(query, items);
        setResults(items);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
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
      <label className="sr-only">Search</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded px-3 py-2"
        aria-label="Search"
      />

      {loading && <div className="text-sm text-gray-500 mt-2">Searching…</div>}

      <ul className="mt-2 space-y-1">
        {!loading && debouncedQ && results.length === 0 && (
          <li className="text-sm text-gray-500 italic">
            Sorry, nothing found for “{debouncedQ}” 😔
          </li>
        )}

        {results.map((r, i) => (
          <li key={i} className="p-2 rounded hover:bg-gray-50">
            {r.name ?? r.title ?? JSON.stringify(r)}
          </li>
        ))}
      </ul>
    </div>
  );
}
