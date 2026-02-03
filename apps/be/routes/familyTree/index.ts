/**
 * Family Tree Module
 * 
 * Modular family tree system for building hierarchical relationships.
 * 
 * Architecture:
 * - types.ts: TypeScript type definitions
 * - builders.ts: Tree building functions (ancestors, descendants, full)
 * - graph.ts: Graph data conversion for visualization
 * - utils.ts: Helper functions (reciprocal types, etc.)
 * - handlers.ts: HTTP request handlers
 */

export {
  handleGetFamilyTree,
  handleCreateRelationship,
  handleDeleteRelationship,
} from "./handlers";

export type { TreeNode, GraphData, TreeView, TreeFormat, RelationType } from "./types";
