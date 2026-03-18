import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

interface AuthContextData {
  user: any;
  isGuest: boolean; // <-- NEW
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    userType: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void; // <-- NEW
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false); // <-- NEW
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        if (token) {
          setUser({ token });
          setIsGuest(false); // Make sure guest mode is off if they have a token
        }
      } catch (error) {
        console.error("Failed to load token", error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post("/auth/login/", { username, password });
      const { token, user_data } = response.data;

      await SecureStore.setItemAsync("userToken", token);
      setUser(user_data);
      setIsGuest(false); // Turn off guest mode on login
    } catch (error) {
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    userType: string,
  ) => {
    try {
      // ... your existing payload logic
      const payload = {
        email,
        username: email,
        password,
        first_name: firstName,
        last_name: lastName,
        user_type: userType,
      };
      const response = await api.post("/auth/register/", payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // --- NEW: Handle Guest Mode ---
  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    setUser(null);
    setIsGuest(false); // Reset guest state on logout so they go back to the auth screen
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        login,
        register,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
