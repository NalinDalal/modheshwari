// src/lib/permissions.ts
export const RolePermissions = {
  ADMIN: [
    "manage_gotra",
    "manage_family",
    "manage_users",
    "manage_events",
    "view_all",
  ],
  SUB_ADMIN: [
    "manage_family",
    "manage_users",
    "manage_events",
    "view_community",
  ],
  HEAD_OF_SUB_COMMUNITY: [
    "manage_family",
    "manage_users",
    "view_sub_community",
  ],
  FAMILY_HEAD: ["manage_family_members", "create_family_events", "view_family"],
  FAMILY_MEMBER: ["view_family", "attend_events"],
} as const;
