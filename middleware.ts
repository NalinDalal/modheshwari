import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  const path = request.nextUrl.pathname;
  const role = token.role;

  // Role-based route access
  if (path.startsWith("/admin")) {
    if (role !== "HEAD_OF_COMMUNITY" && role !== "SUBHEAD_OF_COMMUNITY") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  if (path.startsWith("/subcommunity")) {
    if (role !== "SUBCOMMUNITY_HEAD" && role !== "HEAD_OF_COMMUNITY") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  if (path.startsWith("/family/manage")) {
    if (
      role !== "FAMILY_HEAD" &&
      role !== "SUBCOMMUNITY_HEAD" &&
      role !== "HEAD_OF_COMMUNITY"
    ) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: [
    "/admin/:path*",
    "/subcommunity/:path*",
    "/family/manage/:path*",
    "/api/:path*",
  ],
};
