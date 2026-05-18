export type AuthState =
  | { authenticated: false }
  | { authenticated: true; role: 'user' | 'admin' };

export type RoutingDecision =
  | { action: 'allow' }
  | { action: 'redirect'; to: string };

// Routes that require authentication (non-admin)
const PROTECTED_ROUTES = ['/profile', '/checkout', '/order-success', '/order-pending', '/order-failed'];

// Routes that should redirect logged-in users away
const AUTH_ROUTES = ['/login', '/register', '/complete-data'];

// Routes that are only for regular users (admin should not access)
const USER_ONLY_ROUTES = ['/', '/shop', '/product', '/cart', '/checkout', '/profile', '/about', '/order-success', '/order-pending', '/order-failed', '/complete-data'];

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

  const isUserOnlyRoute = USER_ONLY_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );

  // Unauthenticated users accessing protected routes → redirect to /login?redirect={path}
  if (!auth.authenticated && isProtectedRoute) {
    return { action: 'redirect', to: `/login?redirect=${pathname}` };
  }

  if (auth.authenticated) {
    const isAdmin = auth.role === 'admin';

    // Admin accessing auth routes (login/register) → redirect to /admin
    if (isAdmin && isAuthRoute) {
      return { action: 'redirect', to: '/admin' };
    }

    // Admin accessing user-only routes → redirect to /admin
    if (isAdmin && isUserOnlyRoute) {
      return { action: 'redirect', to: '/admin' };
    }

    // Regular user accessing auth routes → redirect to /
    if (!isAdmin && isAuthRoute) {
      return { action: 'redirect', to: '/' };
    }

    // Regular user accessing /admin/* → redirect to /
    if (!isAdmin && isAdminRoute) {
      return { action: 'redirect', to: '/' };
    }
  }

  return { action: 'allow' };
}
