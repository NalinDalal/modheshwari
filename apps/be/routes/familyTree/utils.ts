/**
 * Utility functions for Family Tree
 */

/**
 * Get reciprocal relationship type
 */
export function getReciprocalType(type: string): string {
  const reciprocalMap: Record<string, string> = {
    SPOUSE: "SPOUSE",
    PARENT: "CHILD",
    CHILD: "PARENT",
    SIBLING: "SIBLING",
  };
  return reciprocalMap[type] || type;
}
