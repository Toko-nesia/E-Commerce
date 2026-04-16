"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "@/types/database";

// =============================================================================
// Auth Context — mock implementation
// Future: Replace with Supabase Auth (supabase.auth.getUser(), onAuthStateChange, etc.)
// =============================================================================

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development
const MOCK_USER: User = {
  id: "mock-user-1",
  email: "Febri@gmail.com",
  full_name: "Febri",
  phone: "081140755",
  avatar_url: "/images/ProfilePage/d4699efb0b0581a2c8ec625c4639f0d9a00865fa.png",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (_email: string, _password: string) => {
    setIsLoading(true);
    try {
      // Future: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      // Mock: always succeeds
      setUser(MOCK_USER);
      return { success: true };
    } catch {
      return { success: false, error: "Login failed" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, _password: string) => {
    setIsLoading(true);
    try {
      // Future: const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      setUser({ ...MOCK_USER, full_name: name, email });
      return { success: true };
    } catch {
      return { success: false, error: "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Future: await supabase.auth.signOut()
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, logout }}>
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
