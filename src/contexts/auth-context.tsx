"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// =============================================================================
// Auth Context — Supabase Auth implementation (Best Practice: SSR + getUser)
// =============================================================================

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: retry a function with exponential backoff for transient errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  isTransientError: (result: T) => boolean,
  maxRetries: number = 1,
  baseDelay: number = 1000
): Promise<T> {
  let result = await fn();
  let attempt = 0;

  while (isTransientError(result) && attempt < maxRetries) {
    attempt++;
    const delay = baseDelay * Math.pow(2, attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
    result = await fn();
  }

  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Stable ref so we don't recreate the client on every render
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  // AbortController ref to track and cancel active fetchProfile requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Guard ref to prevent state updates after SIGNED_OUT
  const isSignedOutRef = useRef<boolean>(false);

  // Fetch profile from the profiles table (role, phone, avatar_url)
  const fetchProfile = useCallback(async (userId: string, email: string, fullName: string) => {
    // Cancel any previous fetchProfile request
    abortControllerRef.current?.abort();

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url, role")
      .eq("id", userId)
      .single();

    // Check if this request was aborted or user signed out after await
    if (signal.aborted || isSignedOutRef.current) {
      return;
    }

    if (profile) {
      setUser({
        id: userId,
        email: profile.email || email,
        full_name: profile.full_name || fullName,
        phone: profile.phone || undefined,
        avatar_url: profile.avatar_url || undefined,
        role: profile.role || "user",
      });
      setRole(profile.role || "user");
    } else {
      // Fallback if profile row doesn't exist yet (trigger may not have fired)
      setUser({ id: userId, email, full_name: fullName, role: "user" });
      setRole("user");
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    // -------------------------------------------------------------------------
    // BEST PRACTICE: Use getUser() — always verifies token with Supabase server.
    // getSession() only reads from localStorage and can return stale/expired data.
    // -------------------------------------------------------------------------
    const initSession = async () => {
      try {
        // Retry getUser() on transient network errors
        const { data: { user: authUser }, error } = await retryWithBackoff(
          () => supabase.auth.getUser(),
          (result) => {
            // Only retry on transient errors (network errors, status 0 or 5xx)
            if (!result.error) return false;
            const status = (result.error as any).status;
            return status === 0 || status === undefined || (status >= 500 && status < 600);
          },
          1,
          1000
        );

        if (!mounted) return;

        if (authUser && !error) {
          const meta = authUser.user_metadata;
          await fetchProfile(authUser.id, authUser.email || "", meta?.full_name || "");
        } else {
          setUser(null);
          setRole(null);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setRole(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    // -------------------------------------------------------------------------
    // onAuthStateChange handles token refresh, sign in, sign out events.
    // The TOKEN_REFRESHED event is critical — without it, sessions expire silently.
    // -------------------------------------------------------------------------
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") &&
          session?.user
        ) {
          // Reset signed-out guard before fetching profile
          isSignedOutRef.current = false;

          const meta = session.user.user_metadata;
          await fetchProfile(session.user.id, session.user.email || "", meta?.full_name || "");
        } else if (event === "SIGNED_OUT") {
          // Set signed-out guard and abort any pending fetchProfile
          isSignedOutRef.current = true;
          abortControllerRef.current?.abort();

          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      mounted = false;
      // Cancel any pending fetchProfile on unmount
      abortControllerRef.current?.abort();
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      const role = (data.user?.app_metadata?.role as string) || "user";
      return { success: true, role };
    } catch {
      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Password reset request failed" };
    }
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Google sign-in failed" };
    }
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isLoading, role, login, register, logout, resetPassword, signInWithGoogle }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
