// components/search/SearchBar.tsx
"use client";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  type: "user" | "family" | "event";
  id: string | number;
  title: string;
  subtitle?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const searchData = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    searchData();
  }, [debouncedQuery]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for people, families, or events..."
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="w-4 h-4 rounded-full border-2 border-blue-500 animate-spin border-t-transparent" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white rounded-md shadow-lg">
          <ul className="py-2">
            {results.map((result) => (
              <li key={`${result.type}-${result.id}`}>
                <a
                  href={`/${result.type}/${result.id}`}
                  className="block py-2 px-4 hover:bg-gray-100"
                >
                  <div className="font-medium">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-sm text-gray-500">
                      {result.subtitle}
                    </div>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// hooks/useDeb
