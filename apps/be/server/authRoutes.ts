import type { Route } from "./types";
import * as handlers from "./handlers";

export const authRoutes: Route[] = [
  // Signup routes
  {
    path: "/api/signup/communityhead",
    method: "POST",
    handler: (r: Request) => handlers.handleAdminSignup(r, "COMMUNITY_HEAD"),
  },
  {
    path: "/api/signup/communitysubhead",
    method: "POST",
    handler: (r: Request) => handlers.handleAdminSignup(r, "COMMUNITY_SUBHEAD"),
  },
  {
    path: "/api/signup/gotrahead",
    method: "POST",
    handler: (r: Request) => handlers.handleAdminSignup(r, "GOTRA_HEAD"),
  },
  {
    path: "/api/signup/familyhead",
    method: "POST",
    handler: (r: Request) => handlers.handleFHSignup(r, "FAMILY_HEAD"),
  },
  {
    path: "/api/signup/member",
    method: "POST",
    handler: (r: Request) => handlers.handleMemberSignup(r),
  },

  // Login routes
  {
    path: "/api/login/communityhead",
    method: "POST",
    handler: (r: Request) => handlers.handleAdminLogin(r, "COMMUNITY_HEAD"),
  },
  {
    path: "/api/login/communitysubhead",
    method: "POST",
    handler: (r: Request) => handlers.handleAdminLogin(r, "COMMUNITY_SUBHEAD"),
  },
  {
    path: "/api/login/gotrahead",
    method: "POST",
    handler: (r: Request) => handlers.handleAdminLogin(r, "GOTRA_HEAD"),
  },
  {
    path: "/api/login/familyhead",
    method: "POST",
    handler: (r: Request) => handlers.handleFHLogin(r, "FAMILY_HEAD"),
  },
  {
    path: "/api/login/member",
    method: "POST",
    handler: (r: Request) => handlers.handleMemberLogin(r),
  },
];
