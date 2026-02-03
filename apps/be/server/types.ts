import type * as handlers from "./handlers";

export interface Route {
  path: string;
  method: string;
  handler: (r: Request) => Response | Promise<Response>;
}

export type RouteHandler = typeof handlers[keyof typeof handlers];
