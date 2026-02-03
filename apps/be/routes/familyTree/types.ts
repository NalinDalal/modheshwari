/**
 * Type definitions for Family Tree
 */

/**
 * Represents a person in the family tree
 */
export interface TreeNode {
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

/**
 * Graph representation for visualization
 */
export interface GraphData {
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

export type TreeView = "ancestors" | "descendants" | "full";
export type TreeFormat = "tree" | "graph";
export type RelationType = "SPOUSE" | "PARENT" | "CHILD" | "SIBLING";
