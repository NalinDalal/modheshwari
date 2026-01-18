"use client";

import { Suspense, useState } from "react";
import { LoaderOne } from "@repo/ui/loading";
import { List, Network } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0f17] to-black text-white px-6 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Family Management</h1>
        <p className="text-sm text-gray-400 mt-1">
          View your family members and relationships
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-white/10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
              activeTab === "list"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <List className="w-4 h-4" />
            List View
          </button>
          <button
            onClick={() => setActiveTab("tree")}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-all relative ${
              activeTab === "tree"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <Network className="w-4 h-4" />
            Tree View
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
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
    </div>
  );
}
