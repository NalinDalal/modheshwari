"use client";

import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";
import { Users, Plus, Loader } from "lucide-react";

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

export default function FamilyTreeView() {
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

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;

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

      const response = await fetch(`${API_BASE}/family/tree?${params}`, {
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
      const response = await fetch(`${API_BASE}/family/tree/relations`, {
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
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* View Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              View Type
            </label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as ViewType)}
              className="w-full px-4 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="full">Full Tree</option>
              <option value="ancestors">Ancestors</option>
              <option value="descendants">Descendants</option>
            </select>
          </div>

          {/* Depth */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Depth: {depth}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchFamilyTree}
              disabled={loading || !userId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
              Refresh Tree
            </button>
          </div>

          {/* Add Relationship Button */}
          <div className="flex items-end">
            <button
              onClick={() => setShowRelationshipForm(!showRelationshipForm)}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(34,197,94,0.5)]"
            >
              <Plus className="w-4 h-4" />
              Add Relation
            </button>
          </div>
        </div>

        {/* Add Relationship Form */}
        {showRelationshipForm && (
          <div className="border-t border-white/10 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Relationship Type
                </label>
                <select
                  value={relationshipForm.relationType}
                  onChange={(e) =>
                    setRelationshipForm({
                      ...relationshipForm,
                      relationType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#1a1f2e] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Tree Visualization */}
      <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
        <div
          ref={containerRef}
          className="w-full"
          style={{ height: "600px", minHeight: "600px" }}
        />
      </div>

      {/* Legend */}
      <div className="bg-[#0e1320]/70 backdrop-blur-md border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Legend</h3>
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
              <span className="text-sm text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
        <h3 className="font-semibold text-blue-300 mb-2">How to Use:</h3>
        <ul className="text-sm text-blue-200 space-y-1 list-disc list-inside">
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
  );
}
