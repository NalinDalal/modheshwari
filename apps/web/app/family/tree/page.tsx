"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Network } from "vis-network";
import { Users, Plus, Trash2, Loader } from "lucide-react";

interface TreeNode {
  id: string;
  name: string;
  email: string;
  role: string;
  relationshipToUser?: string;
  children?: TreeNode[];
  spouse?: TreeNode;
  parents?: TreeNode[];
  siblings?: TreeNode[];
}

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    title?: string;
    color?: string;
    shape?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label: string;
    arrows?: string;
  }>;
}

type ViewType = "ancestors" | "descendants" | "full";

export default function FamilyTreePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("full");
  const [depth, setDepth] = useState(5);
  const [userId, setUserId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<GraphData | null>(null);
  const [relationshipForm, setRelationshipForm] = useState({
    targetUserId: "",
    relationType: "SPOUSE" as "SPOUSE" | "PARENT" | "CHILD" | "SIBLING",
    reciprocal: true,
  });
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);

  // Fetch family tree
  const fetchFamilyTree = async () => {
    if (!userId) {
      setError("User ID not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId,
        view,
        depth: depth.toString(),
        format: "graph",
      });

      const response = await fetch(`/api/family/tree?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch family tree");
      }

      const data = await response.json();
      setTreeData(data.data.tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Initialize network visualization
  useEffect(() => {
    if (!treeData || !containerRef.current) return;

    const options = {
      physics: {
        enabled: true,
        stabilization: {
          iterations: 200,
        },
      },
      layout: {
        hierarchical: {
          enabled: true,
          levelSeparation: 200,
          nodeSpacing: 150,
          direction: "UD",
        },
      },
      nodes: {
        font: {
          size: 14,
          face: "Tahoma",
        },
        borderWidth: 2,
        borderWidthSelected: 4,
      },
      edges: {
        font: {
          size: 12,
          align: "middle",
        },
        smooth: {
          enabled: true,
          type: "continuous",
          roundness: 0.5,
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5,
          },
        },
      },
    };

    networkRef.current = new Network(containerRef.current, treeData, options);
  }, [treeData]);

  // Get userId on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Decode JWT to get user info
      const parts = token.split(".");
      if (parts.length < 2) return;
      const payload = JSON.parse(atob(parts[1]!));
      setUserId(payload.userId || payload.id);
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }, []);

  // Create relationship
  const handleCreateRelationship = async () => {
    if (!relationshipForm.targetUserId) {
      setError("Please enter target user ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/family/tree/relations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(relationshipForm),
      });

      if (!response.ok) {
        throw new Error("Failed to create relationship");
      }

      setRelationshipForm({
        targetUserId: "",
        relationType: "SPOUSE",
        reciprocal: true,
      });
      setShowRelationshipForm(false);

      // Refresh tree
      await fetchFamilyTree();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-800">Family Tree</h1>
          </div>
          <p className="text-gray-600">
            Visualize your family relationships and connections
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* View Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View Type
              </label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as ViewType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="full">Full Tree</option>
                <option value="ancestors">Ancestors</option>
                <option value="descendants">Descendants</option>
              </select>
            </div>

            {/* Depth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depth: {depth}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchFamilyTree}
                disabled={loading || !userId}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                Refresh Tree
              </button>
            </div>

            {/* Add Relationship Button */}
            <div className="flex items-end">
              <button
                onClick={() => setShowRelationshipForm(!showRelationshipForm)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Relation
              </button>
            </div>
          </div>

          {/* Add Relationship Form */}
          {showRelationshipForm && (
            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target User ID
                  </label>
                  <input
                    type="text"
                    value={relationshipForm.targetUserId}
                    onChange={(e) =>
                      setRelationshipForm({
                        ...relationshipForm,
                        targetUserId: e.target.value,
                      })
                    }
                    placeholder="Enter user ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship Type
                  </label>
                  <select
                    value={relationshipForm.relationType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        setRelationshipForm({
                          ...relationshipForm,
                          relationType: e.target.value as "SPOUSE" | "PARENT" | "CHILD" | "SIBLING",
                        })
                      }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SPOUSE">Spouse</option>
                    <option value="PARENT">Parent</option>
                    <option value="CHILD">Child</option>
                    <option value="SIBLING">Sibling</option>
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <button
                    onClick={handleCreateRelationship}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowRelationshipForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Tree Visualization */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div
            ref={containerRef}
            className="w-full h-screen"
            style={{ minHeight: "600px" }}
          />
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { color: "#FF6B6B", label: "Community Head" },
              { color: "#FFA500", label: "Community Subhead" },
              { color: "#4ECDC4", label: "Gotra Head" },
              { color: "#45B7D1", label: "Family Head" },
              { color: "#95E1D3", label: "Member" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Click and drag to pan around the tree</li>
            <li>Scroll to zoom in and out</li>
            <li>Click a node to select it</li>
            <li>
              Use the View Type selector to switch between different tree views
            </li>
            <li>Adjust Depth to show more or fewer generations</li>
            <li>Add relationships using the Add Relation button</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
