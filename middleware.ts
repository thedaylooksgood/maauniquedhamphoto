import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// First lock: /admin pages never even load without the admin cookie.
// (Every API underneath checks the signed token again — this is just the door.)
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!req.cookies.get("mud_admin")) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
