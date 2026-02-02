/**
 * Family Tree API
 * Builds hierarchical family tree from UserRelation records
 * Supports multiple views: ancestor tree, descendant tree, full network
 */

import prisma from "@modheshwari/db";
import { success, failure } from "@modheshwari/utils/response";

import { requireAuth } from "./authMiddleware";

/**
 * Represents a person in the family tree
 */
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

/**
 * Graph representation for visualization
 */
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

/**
 * GET /api/family/tree
 * Get family tree for authenticated user
 *
 * Query params:
 * - userId: Target user ID (defaults to authenticated user)
 * - view: 'ancestors' | 'descendants' | 'full' (default: 'full')
 * - depth: How many levels to show (default: 5)
 * - format: 'tree' | 'graph' (default: 'tree')
 */
export async function handleGetFamilyTree(req: Request): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const url = new URL(req.url);
    const userId =
      url.searchParams.get("userId") || auth.payload.userId || auth.payload.id;
    const view = (url.searchParams.get("view") || "full") as
      | "ancestors"
      | "descendants"
      | "full";
    const depth = parseInt(url.searchParams.get("depth") || "5", 10);
    const format = (url.searchParams.get("format") || "tree") as
      | "tree"
      | "graph";

    // Validate parameters
    if (!userId) {
      return failure("userId is required", "Validation Error", 400);
    }

    if (!["ancestors", "descendants", "full"].includes(view)) {
      return failure(
        "view must be 'ancestors', 'descendants', or 'full'",
        "Validation Error",
        400,
      );
    }

    if (depth < 1 || depth > 10) {
      return failure("depth must be between 1 and 10", "Validation Error", 400);
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return failure("User not found", "Not Found", 404);
    }

    // Build tree based on view
    let treeNode: TreeNode | null = null;

    if (view === "ancestors") {
      treeNode = await buildAncestorTree(userId, depth);
    } else if (view === "descendants") {
      treeNode = await buildDescendantTree(userId, depth);
    } else {
      // Full tree: combine ancestors and descendants
      treeNode = await buildFullTree(userId, depth);
    }

    if (!treeNode) {
      return failure("Failed to build family tree", "Server Error", 500);
    }

    // Convert to requested format
    const data = format === "graph" ? buildGraphData(treeNode) : treeNode;

    return success("Family tree retrieved", { tree: data }, 200);
  } catch (err) {
    console.error("Get Family Tree Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Build ancestor tree (parents, grandparents, etc.)
 */
async function buildAncestorTree(
  userId: string,
  depth: number,
  currentDepth = 0,
  visited = new Set<string>(),
): Promise<TreeNode | null> {
  // Prevent infinite loops
  if (visited.has(userId)) {
    return null;
  }

  visited.add(userId);

  // Stop at max depth
  if (currentDepth >= depth) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return null;
  }

  const node: TreeNode = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Find parents
  const parentRelations = await prisma.userRelation.findMany({
    where: {
      toUserId: userId,
      type: "PARENT",
    },
    include: {
      fromUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (parentRelations.length > 0) {
    const parents: TreeNode[] = [];
    for (const rel of parentRelations) {
      const parent = await buildAncestorTree(
        rel.fromUserId,
        depth,
        currentDepth + 1,
        new Set(visited),
      );
      if (parent) {
        parents.push(parent);
      }
    }
    if (parents.length > 0) {
      node.parents = parents;
    }
  }

  // Find spouse
  const spouseRelation = await prisma.userRelation.findFirst({
    where: {
      fromUserId: userId,
      type: "SPOUSE",
    },
    include: {
      toUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (spouseRelation && !visited.has(spouseRelation.toUserId)) {
    node.spouse = {
      id: spouseRelation.toUser.id,
      name: spouseRelation.toUser.name,
      email: spouseRelation.toUser.email,
      role: spouseRelation.toUser.role,
      relationshipToUser: "spouse",
    };
  }

  return node;
}

/**
 * Build descendant tree (children, grandchildren, etc.)
 */
async function buildDescendantTree(
  userId: string,
  depth: number,
  currentDepth = 0,
  visited = new Set<string>(),
): Promise<TreeNode | null> {
  // Prevent infinite loops
  if (visited.has(userId)) {
    return null;
  }

  visited.add(userId);

  // Stop at max depth
  if (currentDepth >= depth) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return null;
  }

  const node: TreeNode = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // Find children
  const childRelations = await prisma.userRelation.findMany({
    where: {
      fromUserId: userId,
      type: "CHILD",
    },
    include: {
      toUser: {
        select: { id: true },
      },
    },
  });

  if (childRelations.length > 0) {
    const children: TreeNode[] = [];
    for (const rel of childRelations) {
      const child = await buildDescendantTree(
        rel.toUserId,
        depth,
        currentDepth + 1,
        new Set(visited),
      );
      if (child) {
        children.push(child);
      }
    }
    if (children.length > 0) {
      node.children = children;
    }
  }

  // Find spouse
  const spouseRelation = await prisma.userRelation.findFirst({
    where: {
      fromUserId: userId,
      type: "SPOUSE",
    },
    include: {
      toUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (spouseRelation && !visited.has(spouseRelation.toUserId)) {
    node.spouse = {
      id: spouseRelation.toUser.id,
      name: spouseRelation.toUser.name,
      email: spouseRelation.toUser.email,
      role: spouseRelation.toUser.role,
      relationshipToUser: "spouse",
    };
  }

  return node;
}

/**
 * Build full tree (both ancestors and descendants)
 */
async function buildFullTree(
  userId: string,
  depth: number,
): Promise<TreeNode | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) {
    return null;
  }

  const node: TreeNode = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const visited = new Set<string>([userId]);

  // Get parents
  const parentRelations = await prisma.userRelation.findMany({
    where: {
      toUserId: userId,
      type: "PARENT",
    },
  });

  if (parentRelations.length > 0) {
    const parents: TreeNode[] = [];
    for (const rel of parentRelations) {
      const parent = await buildAncestorTree(
        rel.fromUserId,
        depth,
        1,
        new Set(visited),
      );
      if (parent) {
        parents.push(parent);
      }
    }
    if (parents.length > 0) {
      node.parents = parents;
    }
  }

  // Get children
  const childRelations = await prisma.userRelation.findMany({
    where: {
      fromUserId: userId,
      type: "CHILD",
    },
  });

  if (childRelations.length > 0) {
    const children: TreeNode[] = [];
    for (const rel of childRelations) {
      const child = await buildDescendantTree(
        rel.toUserId,
        depth,
        1,
        new Set(visited),
      );
      if (child) {
        children.push(child);
      }
    }
    if (children.length > 0) {
      node.children = children;
    }
  }

  // Get spouse
  const spouseRelation = await prisma.userRelation.findFirst({
    where: {
      fromUserId: userId,
      type: "SPOUSE",
    },
    include: {
      toUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (spouseRelation) {
    node.spouse = {
      id: spouseRelation.toUser.id,
      name: spouseRelation.toUser.name,
      email: spouseRelation.toUser.email,
      role: spouseRelation.toUser.role,
      relationshipToUser: "spouse",
    };
  }

  // Get siblings
  const siblingRelations = await prisma.userRelation.findMany({
    where: {
      fromUserId: userId,
      type: "SIBLING",
    },
    include: {
      toUser: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  if (siblingRelations.length > 0) {
    node.siblings = siblingRelations.map((rel) => ({
      id: rel.toUser.id,
      name: rel.toUser.name,
      email: rel.toUser.email,
      role: rel.toUser.role,
      relationshipToUser: "sibling",
    }));
  }

  return node;
}

/**
 * Convert tree to graph format for vis-network visualization
 */
function buildGraphData(node: TreeNode): GraphData {
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
 * POST /api/family/tree/relations
 * Create or update a user relationship
 *
 * Body:
 * {
 *   targetUserId: string,  // Who they're related to
 *   relationType: 'SPOUSE' | 'PARENT' | 'CHILD' | 'SIBLING',
 *   reciprocal?: boolean   // Auto-create reverse relation (default: true)
 * }
 */
export async function handleCreateRelationship(
  req: Request,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    const userId = auth.payload.userId || auth.payload.id;
    const body: any = await req.json().catch(() => null);

    if (!body) return failure("Invalid JSON body", "Bad Request", 400);

    const { targetUserId, relationType, reciprocal = true } = body;

    if (!targetUserId || !relationType) {
      return failure(
        "targetUserId and relationType are required",
        "Validation Error",
        400,
      );
    }

    if (!["SPOUSE", "PARENT", "CHILD", "SIBLING"].includes(relationType)) {
      return failure("Invalid relationType", "Validation Error", 400);
    }

    if (userId === targetUserId) {
      return failure("Cannot create self-relation", "Validation Error", 400);
    }

    // Verify both users exist
    const [userExists, targetExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      }),
    ]);

    if (!userExists) {
      return failure("Authenticated user not found", "Not Found", 404);
    }

    if (!targetExists) {
      return failure("Target user not found", "Not Found", 404);
    }

    // Check if relation already exists
    const existingRelation = await prisma.userRelation.findFirst({
      where: {
        fromUserId: userId,
        toUserId: targetUserId,
        type: relationType as any,
      },
    });

    if (existingRelation) {
      return failure("Relationship already exists", "Conflict", 409);
    }

    // Create primary relation
    const relation = await prisma.userRelation.create({
      data: {
        fromUserId: userId,
        toUserId: targetUserId,
        type: relationType as any,
      },
    });

    // Create reciprocal if needed
    let reciprocalRelation = null;
    if (reciprocal) {
      const reciprocalType = getReciprocalType(relationType);

      // Check if reciprocal already exists
      const existingReciprocal = await prisma.userRelation.findFirst({
        where: {
          fromUserId: targetUserId,
          toUserId: userId,
          type: reciprocalType as any,
        },
      });

      if (!existingReciprocal) {
        reciprocalRelation = await prisma.userRelation.create({
          data: {
            fromUserId: targetUserId,
            toUserId: userId,
            type: reciprocalType as any,
          },
        });
      }
    }

    return success(
      "Relationship created",
      { relation, reciprocalRelation },
      201,
    );
  } catch (err) {
    console.error("Create Relationship Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}

/**
 * Get reciprocal relationship type
 */
function getReciprocalType(type: string): string {
  const reciprocalMap: Record<string, string> = {
    SPOUSE: "SPOUSE",
    PARENT: "CHILD",
    CHILD: "PARENT",
    SIBLING: "SIBLING",
  };
  return reciprocalMap[type] || type;
}

/**
 * DELETE /api/family/tree/relations/:relationId
 * Remove a relationship
 */
export async function handleDeleteRelationship(
  req: Request,
  relationId: string,
): Promise<Response> {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response as Response;

    if (!relationId) {
      return failure("relationId is required", "Validation Error", 400);
    }

    // Verify relation exists and user has permission
    const relation = await prisma.userRelation.findUnique({
      where: { id: relationId },
      select: { fromUserId: true, toUserId: true },
    });

    if (!relation) {
      return failure("Relationship not found", "Not Found", 404);
    }

    const userId = auth.payload.userId || auth.payload.id;

    // Allow deletion if user is either side of the relationship
    if (relation.fromUserId !== userId && relation.toUserId !== userId) {
      return failure(
        "Unauthorized to delete this relationship",
        "Forbidden",
        403,
      );
    }

    await prisma.userRelation.delete({
      where: { id: relationId },
    });

    return success("Relationship deleted", {}, 200);
  } catch (err) {
    console.error("Delete Relationship Error:", err);
    return failure("Internal server error", "Unexpected Error", 500);
  }
}
