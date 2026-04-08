import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const USER_ID_KEY = "gymlink_user_id";
const DEFAULT_USER_ID = "me";

interface UserContextValue {
  userId: string;
  setUserId: (id: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: DEFAULT_USER_ID,
  setUserId: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserIdState] = useState<string>(DEFAULT_USER_ID);

  useEffect(() => {
    AsyncStorage.getItem(USER_ID_KEY).then((stored) => {
      if (stored) setUserIdState(stored);
    });
  }, []);

  const setUserId = useCallback(async (id: string) => {
    await AsyncStorage.setItem(USER_ID_KEY, id);
    setUserIdState(id);
  }, []);

  return (
    <UserContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
