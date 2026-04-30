"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

// =============================================================================
// Auth Context — Supabase Auth implementation
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

import { useRouter } from "next/navigation";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const supabase = createClient();

  // Fetch profile from profiles table to get role, phone, avatar_url
  const fetchProfile = useCallback(async (userId: string, email: string, fullName: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email, phone, avatar_url, role")
      .eq("id", userId)
      .single();

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
      // Fallback if profile not found yet (trigger may not have fired)
      setUser({
        id: userId,
        email,
        full_name: fullName,
        role: "user",
      });
      setRole("user");
    }
  }, [supabase]);

  // Listen to auth state changes
  useEffect(() => {
    // Check initial session
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const meta = session.user.user_metadata;
          await fetchProfile(
            session.user.id,
            session.user.email || "",
            meta?.full_name || ""
          );
        }
      } catch {
        // Session check failed, user remains null
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" && session?.user) {
          const meta = session.user.user_metadata;
          await fetchProfile(
            session.user.id,
            session.user.email || "",
            meta?.full_name || ""
          );
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRole(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: error.message };
      }
      const role = (data.user?.app_metadata?.role as string) || 'user';
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
      if (error) {
        return { success: false, error: error.message };
      }
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
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch {
      return { success: false, error: "Password reset request failed" };
    }
  }, [supabase]);

  const signInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
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
