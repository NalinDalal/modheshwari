/**
 * Admin Role Change Module
 * 
 * Handles administrative role management including:
 * - Role changes with multi-level approval system
 * - Permission validation based on requester role
 * - User listing and management
 * - Role change permission queries
 * 
 * This module was refactored from a monolithic file into smaller,
 * focused modules for better maintainability and testability.
 */

export { ADMIN_ROLES, VALID_ROLES } from "./constants";
export { checkRoleChangePermission } from "./permissions";
export { handleChangeUserRole } from "./roleChange";
export { handleListUsers, handleGetUserDetails } from "./userManagement";
export { handleGetRoleChangePermissions } from "./rolePermissions";
