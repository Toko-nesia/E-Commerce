import { NextResponse, type NextRequest } from "next/server";

// =============================================================================
// Next.js Middleware — Route Protection
// =============================================================================
// Currently: allows all requests (mock mode)
// Future: validate Supabase session and redirect unauthenticated users
// =============================================================================

// Routes that require authentication
const PROTECTED_ROUTES = ["/profile", "/checkout"];

// Routes that should redirect logged-in users (e.g., login/register)
const AUTH_ROUTES = ["/login", "/register", "/complete-data"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Future: Check Supabase session
  // const supabase = createServerClient(...)
  // const { data: { user } } = await supabase.auth.getUser()
  const user = null; // Mock: no session check yet

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Future: Uncomment these redirects when Supabase Auth is active
  // if (isProtectedRoute && !user) {
  //   const loginUrl = new URL("/login", request.url);
  //   loginUrl.searchParams.set("redirect", pathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // if (isAuthRoute && user) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
