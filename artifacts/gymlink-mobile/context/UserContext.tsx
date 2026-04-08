import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const USER_ID_KEY = "gymlink_user_id";

interface UserContextValue {
  userId: string | null;
  isLoading: boolean;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_ID_KEY).then((stored) => {
      setUserId(stored ?? null);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (id: string) => {
    await AsyncStorage.setItem(USER_ID_KEY, id);
    setUserId(id);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(USER_ID_KEY);
    setUserId(null);
  }, []);

  return (
    <UserContext.Provider value={{ userId, isLoading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
