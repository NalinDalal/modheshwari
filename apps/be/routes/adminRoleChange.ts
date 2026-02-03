/**
 * Admin Role Change Module - Legacy Re-export
 * 
 * This file has been refactored into smaller modules:
 * - constants.ts - Role constants and configuration
 * - permissions.ts - Permission validation logic
 * - roleChange.ts - Role change operations
 * - userManagement.ts - User listing and details
 * - rolePermissions.ts - Permission queries
 * 
 * All exports are maintained for backward compatibility.
 */

export {
  ADMIN_ROLES,
  VALID_ROLES,
  checkRoleChangePermission,
  handleChangeUserRole,
  handleListUsers,
  handleGetUserDetails,
  handleGetRoleChangePermissions,
} from "./adminRoleChange/";