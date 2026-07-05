"use client";

import FamilyTreeView from "../FamilyTreeView";

/**
 * Family tree page — reuses the shared FamilyTreeView component.
 */
export default function FamilyTreePage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Family Tree</h1>
          <p className="text-gray-600">
            Visualize your family relationships and connections
          </p>
        </div>
        <FamilyTreeView />
      </div>
    </div>
  );
}
