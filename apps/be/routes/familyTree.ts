/**
 * Family Tree API (Legacy)
 * 
 * This file has been refactored into modular components.
 * See ./familyTree/ directory for the new modular structure:
 * 
 * - familyTree/types.ts - Type definitions
 * - familyTree/builders.ts - Tree building logic
 * - familyTree/graph.ts - Graph conversion
 * - familyTree/utils.ts - Helper functions
 * - familyTree/handlers.ts - Request handlers
 * - familyTree/index.ts - Public exports
 * 
 * This file is kept for backward compatibility.
 * Import from ./familyTree instead of this file.
 */

export {
  handleGetFamilyTree,
  handleCreateRelationship,
  handleDeleteRelationship,
} from "./familyTree/index";
