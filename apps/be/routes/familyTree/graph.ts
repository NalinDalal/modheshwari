/**
 * Graph Data Conversion
 * Convert tree structure to graph format for visualization
 */

import type { TreeNode, GraphData } from "./types";

/**
 * Get color for node based on role
 */
function getRoleColor(role: string): string {
  const colorMap: Record<string, string> = {
    COMMUNITY_HEAD: "#FF6B6B",
    COMMUNITY_SUBHEAD: "#FFA500",
    GOTRA_HEAD: "#4ECDC4",
    FAMILY_HEAD: "#45B7D1",
    MEMBER: "#95E1D3",
  };
  return colorMap[role] || "#D3D3D3";
}

/**
 * Convert tree to graph format for vis-network visualization
 */
export function buildGraphData(node: TreeNode): GraphData {
  const nodes: Map<string, any> = new Map();
  const edges: Array<any> = [];
  const processedEdges = new Set<string>();

  function addEdge(from: string, to: string, label: string, arrows?: string) {
    const edgeKey = `${from}-${to}-${label}`;
    const reverseEdgeKey = `${to}-${from}-${label}`;

    // Avoid duplicate edges
    if (!processedEdges.has(edgeKey) && !processedEdges.has(reverseEdgeKey)) {
      edges.push({ from, to, label, arrows });
      processedEdges.add(edgeKey);
    }
  }

  function traverseAndBuild(current: TreeNode | null, parentId?: string) {
    if (!current || !current.id) return;

    // Add node
    if (!nodes.has(current.id)) {
      nodes.set(current.id, {
        id: current.id,
        label: current.name,
        title: `${current.name}\n${current.email}\nRole: ${current.role}`,
        color: getRoleColor(current.role),
        shape: "box",
      });
    }

    // Add parent edge
    if (parentId) {
      addEdge(current.id, parentId, "child of", "to");
    }

    // Process spouse
    if (current.spouse && current.spouse.id) {
      traverseAndBuild(current.spouse);
      addEdge(current.id, current.spouse.id, "spouse", "to;from");
    }

    // Process parents
    if (current.parents?.length) {
      current.parents.forEach((parent) => {
        if (parent && parent.id) {
          traverseAndBuild(parent, current.id);
        }
      });
    }

    // Process children
    if (current.children?.length) {
      current.children.forEach((child) => {
        if (child && child.id) {
          traverseAndBuild(child, current.id);
        }
      });
    }
    // Process siblings
    if (current.siblings?.length) {
      current.siblings.forEach((sibling) => {
        if (sibling && sibling.id) {
          traverseAndBuild(sibling);
          addEdge(current.id, sibling.id, "sibling", "to;from");
        }
      });
    }
  }

  traverseAndBuild(node);

  return {
    nodes: Array.from(nodes.values()),
    edges,
  };
}
