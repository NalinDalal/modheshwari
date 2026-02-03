import type { Role } from "@prisma/client";

export const ADMIN_ROLES: Role[] = ["COMMUNITY_HEAD", "COMMUNITY_SUBHEAD", "GOTRA_HEAD"];

export const VALID_ROLES: Role[] = [
  "COMMUNITY_HEAD",
  "COMMUNITY_SUBHEAD",
  "GOTRA_HEAD",
  "FAMILY_HEAD",
  "MEMBER",
];
