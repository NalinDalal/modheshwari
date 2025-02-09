import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);
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
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
export const config = {
  matcher: [
    "/admin/:path*",
    "/family/manage/:path*",
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
