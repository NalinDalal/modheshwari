// src/types/auth.ts
import { User, UserStatus, Gender, BloodGroup } from "@prisma/client";

export type Role =
  | "ADMIN"
  | "SUB_ADMIN"
  | "HEAD_OF_SUB_COMMUNITY"
  | "FAMILY_HEAD"
  | "FAMILY_MEMBER";

export interface SessionUser {
  id: string;
  email: string | null;
  name: string;
  role: Role;
  familyId: number | null;
  gotraId: number | null;
}
