import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Routes that require a logged-in customer. */
const PROTECTED_PATHS = ["/products", "/cart", "/shop", "/orders"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/"),
  );

  if (!isProtected) return NextResponse.next();

  const session = request.cookies.get("ndps_session");

  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    // Pass the originally-requested URL so we can redirect back after login
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - Next.js internals (_next/static, _next/image)
     *  - Static assets (favicon, public files)
     *  - API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
