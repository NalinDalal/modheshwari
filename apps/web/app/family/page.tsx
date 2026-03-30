"use client";

import { Suspense, useState } from "react";
import { LoaderOne } from "@repo/ui/loading";
import { List, Network } from "lucide-react";
import { DreamySunsetBackground } from "@repo/ui/dreamySunsetBackground";

import FamilyPageContent from "./FamilyPageContent";
import FamilyTreeView from "./FamilyTreeView";

/**
 * Family Page with Tabbed Interface
 *
 * This is the **entry point** for the `/family` route in the app.
 * It provides a tabbed interface to switch between:
 * - **List View**: Shows all family members in a list with management controls
 * - **Tree View**: Displays an interactive family tree visualization
 *
 * @component
 * @returns {JSX.Element} Tabbed family page with list and tree views.
 */
export default function FamilyPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"list" | "tree">("list");

  return (
    <DreamySunsetBackground className="px-6 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Family Management</h1>
        <p className="muted mt-2">View your family members and relationships</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "list"
                ? "bg-rose-50 text-rose-600 shadow-soft"
                : "muted hover:text-rose-600"
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => setActiveTab("tree")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "tree"
                ? "bg-rose-50 text-rose-600 shadow-soft"
                : "muted hover:text-rose-600"
            }`}
          >
            <Network className="w-4 h-4" />
            Tree View
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-[28px] bg-black/40 backdrop-blur-2xl border border-white/10 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
  {activeTab === "list" ? (
    <Suspense fallback={<LoaderOne />}>
      <FamilyPageContent />
    </Suspense>
  ) : (
    <Suspense fallback={<LoaderOne />}>
      <FamilyTreeView />
    </Suspense>
  )}
</div>

    </DreamySunsetBackground>
  );
}
