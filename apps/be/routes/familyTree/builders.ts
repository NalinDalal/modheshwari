/**
 * Family Tree Builders
 * Functions to build different views of the family tree
 */

import prisma from "@modheshwari/db";
import type { TreeNode } from "./types";

/**
 * Build ancestor tree (parents, grandparents, etc.)
 */
export async function buildAncestorTree(
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
export async function buildDescendantTree(
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
export async function buildFullTree(
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
