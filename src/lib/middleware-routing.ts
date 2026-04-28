export type AuthState =
  | { authenticated: false }
  | { authenticated: true; role: 'user' | 'admin' };

export type RoutingDecision =
  | { action: 'allow' }
  | { action: 'redirect'; to: string };

// Routes that require authentication
const PROTECTED_ROUTES = ['/profile', '/checkout'];

// Routes that should redirect logged-in users
const AUTH_ROUTES = ['/login', '/register', '/complete-data'];

export function getRoutingDecision(pathname: string, auth: AuthState): RoutingDecision {
  // Allow OAuth callback route without any redirect
  if (pathname.startsWith('/auth/callback')) {
    return { action: 'allow' };
  }

  const isProtectedRoute =
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith('/admin');

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith('/admin');

  // Unauthenticated users accessing protected routes → redirect to /login?redirect={path}
  if (!auth.authenticated && isProtectedRoute) {
    return { action: 'redirect', to: `/login?redirect=${pathname}` };
  }

  // Authenticated users accessing auth routes → redirect to /
  if (auth.authenticated && isAuthRoute) {
    return { action: 'redirect', to: '/' };
  }

  // Authenticated regular users accessing /admin/* → redirect to /
  if (auth.authenticated && auth.role === 'user' && isAdminRoute) {
    return { action: 'redirect', to: '/' };
  }

  // Admin users accessing /admin/* → allowed through
  // All other routes → allowed through
  return { action: 'allow' };
}
