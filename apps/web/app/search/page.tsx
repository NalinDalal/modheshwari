"use client";

import { useEffect, useState } from "react";
import SearchInput from "./SearchInput";
import { Search } from "lucide-react";

/**
 * Search Members Page with:
 * - Better layout
 * - Search icon input bar
 * - Cmd+K / Ctrl+K shortcut focus
 * - Loading shimmer (handled via parent)
 */
export default function SearchPage() {
  const [focusTrigger, setFocusTrigger] = useState(0);

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
    <div className="max-w-lg mx-auto mt-12 p-4">
      <div className="flex items-center space-x-2 mb-6">
        <Search className="size-6 text-gray-600" />
        <h1 className="text-3xl font-semibold tracking-tight">
          Search Members
        </h1>
      </div>

      <SearchInput
        placeholder="Search by name or email…"
        focusSignal={focusTrigger}
      />

      <p className="text-xs text-gray-500 mt-4 text-center">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded border">Ctrl</kbd>{" "}
        + <kbd className="px-1 py-0.5 bg-gray-100 rounded border">K</kbd> to
        search
      </p>
    </div>
  );
}
