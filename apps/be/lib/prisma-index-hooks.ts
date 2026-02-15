import prisma from "@modheshwari/db";
import indexer from "./elastic-indexer";

// Register Prisma middleware to index users and events asynchronously.
// This is fire-and-forget: we don't block DB writes on indexing.
export function registerPrismaIndexHooks() {
  // Prisma types in this workspace might not expose $use correctly to TS here,
  // so cast to any to attach middleware at runtime.
  (prisma as any).$use(async (params: any, next: any) => {
    const result = await next(params);

    try {
      const model = params.model;
      const action = params.action;

      if (!model) return result;

      // User model
      if (model === "User") {
        if (action === "create" || action === "update" || action === "upsert") {
          // index the returned user record
          void indexer.indexUser(result).catch((e: any) => console.error("Index user error:", e));
        } else if (action === "delete") {
          void indexer.deleteUser(result.id).catch((e: any) => console.error("Delete user index error:", e));
        }
      }

      // Event model
      if (model === "Event") {
        if (action === "create" || action === "update" || action === "upsert") {
          void indexer.indexEvent(result).catch((e: any) => console.error("Index event error:", e));
        } else if (action === "delete") {
          void indexer.deleteEvent(result.id).catch((e: any) => console.error("Delete event index error:", e));
        }
      }
    } catch (err: any) {
      console.error("Prisma index hook error:", err);
    }

    return result;
  });
}
