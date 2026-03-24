import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

interface AuthContextData {
  user: any;
  isGuest: boolean; // <-- NEW
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: any) => void;
  continueAsGuest: () => void;
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
        const storedUser = await SecureStore.getItemAsync("userData"); // NEW

        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          setIsGuest(false);
        } else if (token) {
          setUser({ token });
          setIsGuest(false);
        }
      } catch (error) {
        console.error("Failed to load token", error);
      } finally {
        setLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // The variables now perfectly match the JSON keys Django expects
      const payload = {
        email: email,
        password: password,
      };

      const response = await api.post("/auth/login/", payload);

      // Extract the data
      const {
        tokens,
        user_id,
        email: userEmail,
        first_name: userfirstName,
        last_name: userlastName,
      } = response.data;

      await SecureStore.setItemAsync("userToken", tokens.access);

      // Create the user object
      const userData = {
        id: user_id,
        email: userEmail,
        first_name: userfirstName,
        last_name: userlastName,
      };

      // Save it to state AND to the secure vault
      setUser(userData);
      await SecureStore.setItemAsync("userData", JSON.stringify(userData)); // NEW

      setIsGuest(false);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    try {
      const payload = {
        email: email,
        username: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        user_type: "Regular",
      };

      const response = await api.post("/auth/register/", payload);
      return response.data;
    } catch (error) {
      console.error("Registration Error:", error);
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
        setUser,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
