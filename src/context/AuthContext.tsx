"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from the HttpOnly cookie via a server-side endpoint.
    // No localStorage or readable cookies are used — the token never touches JS storage.
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        if (data?.token && data?.user) {
          setToken(data.token);
          setUser(data.user);
        }
      })
      .catch(() => {
        // Silent fail — user will be redirected by middleware
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (newToken: string, newUser: User) => {
    // The HttpOnly cookie is already set by the /api/auth/login route.
    // We only keep the token in React state (in-memory, not persisted).
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    // Clear React state
    setToken(null);
    setUser(null);

    // Clear the HttpOnly cookie server-side
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    }).finally(() => {
      router.push("/signin");
      router.refresh();
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
