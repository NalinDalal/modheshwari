import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Check user role for specific routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (token.role !== "ADMIN" && token.role !== "SUBADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (request.nextUrl.pathname.startsWith("/family/manage")) {
    if (
      token.role !== "ADMIN" &&
      token.role !== "SUBADMIN" &&
      token.role !== "FAMILY_HEAD"
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/family/manage/:path*"],
};
