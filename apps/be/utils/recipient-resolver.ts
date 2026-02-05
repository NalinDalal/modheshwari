/**
 * Recipient resolver for fan-out notifications.
 *
 * This module exports a single function `resolveRecipients` which accepts a
 * Prisma-like client (injected for ease of testing) and a query describing
 * the scope to resolve (gotra, community, family) and optional role filters.
 */

import type { PrismaClient } from '@prisma/client';

export type Scope = 'gotra' | 'community' | 'family';

export interface ResolveOptions {
  prisma: PrismaClient | any;
  scope: Scope;
  scopeValue: string; // gotra name, community id/name, or family id
  roleFilter?: string[]; // e.g. ['FAMILY_HEAD']
  onlyActive?: boolean; // default true
  limit?: number; // optional cap
}

export interface ResolvedRecipient {
  id: string;
  email?: string | null;
  fcmToken?: string | null;
  profile?: any;
  roles?: string[] | null;
}

/**
 * Performs resolve recipients operation.
 * @param {import("/Users/nalindalal/modheshwari/apps/be/utils/recipient-resolver").ResolveOptions} opts - Description of opts
 * @returns {Promise<{ recipients: import("/Users/nalindalal/modheshwari/apps/be/utils/recipient-resolver").ResolvedRecipient[]; count: number; }>} Description of return value
 */
export async function resolveRecipients(opts: ResolveOptions): Promise<{
  recipients: ResolvedRecipient[];
  count: number;
}> {
  const { prisma, scope, scopeValue, roleFilter, onlyActive = true, limit } = opts;

  if (!prisma) throw new Error('prisma client is required');

  let where: any = {};
  if (onlyActive) where.status = true;

  switch (scope) {
    case 'gotra':
      where['profile'] = { gotra: scopeValue };
      break;
    case 'community':
      // community might be stored on profile.community or a separate relation
      where['profile'] = { community: scopeValue };
      break;
    case 'family':
      // assume familyId on user or profile.familyId
      where['familyId'] = scopeValue;
      break;
    default:
      throw new Error('unsupported scope');
  }

  // Fetch minimal user info for targeting and preview
  const query: any = {
    where,
    select: {
      id: true,
      email: true,
      fcmToken: true,
      profile: true,
      roles: true,
    },
    take: limit || undefined,
  };

  let users = await prisma.user.findMany(query);

  if (roleFilter && roleFilter.length) {
    users = users.filter((u: any) => {
      const userRoles: string[] = Array.isArray(u.roles) ? u.roles : (u.roles ? [u.roles] : []);
      return roleFilter.some((r) => userRoles.includes(r));
    });
  }

  const recipients = users.map((u: any) => ({
    id: u.id,
    email: u.email,
    fcmToken: u.fcmToken,
    profile: u.profile,
    roles: u.roles,
  }));

  return { recipients, count: recipients.length };
}

export default resolveRecipients;
