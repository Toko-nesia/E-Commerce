import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getRoutingDecision, type AuthState } from "@/lib/middleware-routing";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Validate session and refresh cookies
  const { user, supabaseResponse } = await updateSession(request);

  // Determine auth state
  let authState: AuthState;
  if (!user) {
    authState = { authenticated: false };
  } else {
    const role = (user.app_metadata?.role as 'user' | 'admin') || 'user';
    authState = { authenticated: true, role };
  }

  // Get routing decision from pure routing logic
  const decision = getRoutingDecision(pathname, authState);

  if (decision.action === 'redirect') {
    return NextResponse.redirect(new URL(decision.to, request.url));
  }

  // Allow — return supabaseResponse which has refreshed cookies
  return supabaseResponse;
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
