"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import { Network } from "vis-network";
import { Users, Plus, Trash2, Loader, AlertCircle } from "lucide-react";

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

/**
 * Performs  family tree page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function FamilyTreePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [loading, setLoading] = useState(true);
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

  // Get userId from token
  const getUserIdFromToken = (): string | null => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(atob(parts[1]!));
      return payload.userId || payload.id || null;
    } catch (err) {
      console.error("Failed to decode token:", err);
      return null;
    }
  };

  // Fetch family tree
  const fetchFamilyTree = async (targetUserId?: string) => {
    const userIdToUse = targetUserId || userId;

    if (!userIdToUse) {
      setError("User ID not available. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        userId: userIdToUse,
        view,
        depth: depth.toString(),
        format: "graph",
      });

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please sign in.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/family/tree?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to fetch family tree");
      }

      const data = await response.json();

      if (data.status === "success" && data.data?.tree) {
        setTreeData(data.data.tree);
      } else {
        setError("No family tree data available");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Fetch family tree error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize network visualization
  useEffect(() => {
    if (!treeData || !containerRef.current) return;

    // Check if there are any nodes
    if (!treeData.nodes || treeData.nodes.length === 0) {
      setError("No family members found in the tree");
      return;
    }

    try {
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

      // Clean up previous network instance
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      networkRef.current = new Network(containerRef.current, treeData, options);

      // Handle network errors
      networkRef.current.on("error", (error: any) => {
        console.error("Network visualization error:", error);
        setError("Failed to render family tree visualization");
      });
    } catch (err) {
      console.error("Failed to initialize network:", err);
      setError("Failed to initialize family tree visualization");
    }

    // Cleanup on unmount
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [treeData]);

  // Initialize: Get userId and fetch tree on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in to view your family tree");
      setLoading(false);
      return;
    }

    const extractedUserId = getUserIdFromToken();
    if (!extractedUserId) {
      setError("Invalid authentication token. Please sign in again.");
      setLoading(false);
      return;
    }

    setUserId(extractedUserId);
    fetchFamilyTree(extractedUserId);
  }, []);

  // Refetch when view or depth changes
  useEffect(() => {
    if (userId) {
      fetchFamilyTree();
    }
  }, [view, depth]);

  // Create relationship
  const handleCreateRelationship = async () => {
    if (!relationshipForm.targetUserId.trim()) {
      setError("Please enter target user ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"}/family/tree/relations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(relationshipForm),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create relationship");
      }

      // Reset form and hide it
      setRelationshipForm({
        targetUserId: "",
        relationType: "SPOUSE",
        reciprocal: true,
      });
      setShowRelationshipForm(false);

      // Refresh tree
      await fetchFamilyTree();

      alert("Relationship created successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Create relationship error:", err);
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
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="full">Full Tree</option>
                <option value="ancestors">Ancestors</option>
                <option value="descendants">Descendants</option>
              </select>
            </div>

            {/* Depth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Depth: {depth} {depth === 1 ? "generation" : "generations"}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                disabled={loading}
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={() => fetchFamilyTree()}
                disabled={loading || !userId}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {loading ? "Loading..." : "Refresh Tree"}
              </button>
            </div>

            {/* Add Relationship Button */}
            <div className="flex items-end">
              <button
                onClick={() => setShowRelationshipForm(!showRelationshipForm)}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                        relationType: e.target.value as
                          | "SPOUSE"
                          | "PARENT"
                          | "CHILD"
                          | "SIBLING",
                      })
                    }
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                    {loading ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => setShowRelationshipForm(false)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={relationshipForm.reciprocal}
                    onChange={(e) =>
                      setRelationshipForm({
                        ...relationshipForm,
                        reciprocal: e.target.checked,
                      })
                    }
                    disabled={loading}
                    className="rounded"
                  />
                  Create reciprocal relationship automatically
                </label>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tree Visualization */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && !treeData ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading family tree...</p>
              </div>
            </div>
          ) : treeData && treeData.nodes.length > 0 ? (
            <div
              ref={containerRef}
              className="w-full h-screen"
              style={{ minHeight: "600px" }}
            />
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No family tree data</p>
                <p className="text-sm">
                  Start by adding family relationships using the &quot;Add
                  Relation&quot; button above
                </p>
              </div>
            </div>
          )}
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
