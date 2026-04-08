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
  age: number;
  bio: string;
  gymId?: string;
  gymName?: string;
  schedule: string;
  interests: string[];
}): Promise<{ userId: string }> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function fetchAuthUsers(): Promise<Array<{ id: string; name: string; avatar: string; gym: string }>> {
  const res = await fetch(`${BASE}/api/auth/users`);
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}
