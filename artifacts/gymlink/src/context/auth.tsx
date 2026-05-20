import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const STORAGE_KEY = "gymlink_user_id";

interface AuthContextType {
  userId: string | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo) {
      localStorage.setItem(STORAGE_KEY, demo);
      setUserId(demo);
      setIsLoading(false);
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    setUserId(stored ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => userId);
  }, [userId]);

  const login = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setUserId(id);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUserId(null);
  }, []);

  return (
    <AuthContext.Provider value={{ userId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function registerUser(data: {
  name: string;
  username: string;
  email: string;
  age: number;
  bio: string;
  gymId?: string;
  gymName?: string;
  schedule: string;
  interests: string[];
  password: string;
}): Promise<{ userId: string }> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Registration failed");
  return json;
}

export async function loginUser(name: string, password: string): Promise<{ userId: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Login failed");
  return json;
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to send reset email");
}
