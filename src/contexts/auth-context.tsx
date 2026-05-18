"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  role: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string; requiresVerification?: boolean; email?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; requiresVerification?: boolean; email?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: (redirectTo?: string | null) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: data.error ?? "Login failed",
          requiresVerification: data.requiresVerification,
          email: data.email,
        };
      }

      setUser(data.user ?? null);
      router.refresh();
      return { success: true, role: data.role ?? data.user?.role ?? "user" };
    } catch {
      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return {
          success: false,
          error: Array.isArray(data.issues) && data.issues.length > 0
            ? data.issues[0]
            : data.error ?? "Registration failed",
        };
      }

      if (data.user) setUser(data.user);
      router.refresh();
      return {
        success: true,
        requiresVerification: data.requiresVerification,
        email: data.email,
      };
    } catch {
      return { success: false, error: "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const callbackUrl = new URL("/auth/confirm", window.location.origin);
      callbackUrl.searchParams.set("next", "/reset-password");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: callbackUrl.toString(),
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Password reset request failed" };
    }
  }, [supabase]);

  const signInWithGoogle = useCallback(async (redirectTo?: string | null) => {
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (redirectTo && redirectTo.startsWith("/")) {
        callbackUrl.searchParams.set("next", redirectTo);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch {
      return { success: false, error: "Google sign-in failed" };
    }
  }, [supabase]);

  const role = user?.role ?? null;

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
