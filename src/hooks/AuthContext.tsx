import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api";

interface AuthContextData {
  user: any;
  isGuest: boolean;
  loading: boolean;
  isDiscountVerified: boolean;
  userType: string;
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
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  refreshProfileStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isDiscountVerified, setIsDiscountVerified] = useState(false);
  const [userType, setUserType] = useState("Regular");

  const refreshProfileStatus = async () => {
    try {
      const response = await api.get("/users/me/");
      setIsDiscountVerified(response.data.is_discount_verified);
      setUserType(response.data.user_type);
    } catch (error) {
      console.warn("Failed to fetch profile status", error);
    }
  };

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const storedUser = await SecureStore.getItemAsync("userData");

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

  useEffect(() => {
    if (user && !isGuest) {
      refreshProfileStatus();
    }
  }, [user, isGuest]);

  const login = async (email: string, password: string) => {
    try {
      const payload = { email, password };
      const response = await api.post("/auth/login/", payload);

      const {
        tokens,
        user_id,
        email: userEmail,
        first_name,
        last_name,
      } = response.data;

      await SecureStore.setItemAsync("userToken", tokens.access);

      const userData = { id: user_id, email: userEmail, first_name, last_name };
      setUser(userData);
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));
      setIsGuest(false);
    } catch (error: any) {
      const requiresOtp = error.response?.data?.requires_otp;
      if (!requiresOtp) {
        const cleanMessage =
          error.response?.data?.error ||
          error.response?.data?.detail ||
          "Please check your internet connection and try again.";
      }
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
        email,
        username: email,
        password,
        first_name: firstName,
        last_name: lastName,
        user_type: "Regular",
      };
      const response = await api.post("/auth/register/", payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setUser(null);
    setIsDiscountVerified(false);
    setUserType("Regular");
  };

  const verifyOtp = async (email: string, otp: string) => {
    const response = await api.post("/auth/verify-otp/", { email, otp });
    const {
      tokens,
      user_id,
      email: userEmail,
      first_name,
      last_name,
    } = response.data;

    if (tokens?.access) {
      await SecureStore.setItemAsync("userToken", tokens.access);
    }

    const userData = { id: user_id, email: userEmail, first_name, last_name };
    await SecureStore.setItemAsync("userData", JSON.stringify(userData));
    setUser(userData);
  };

  const resendOtp = async (email: string) => {
    try {
      await api.post("/auth/resend-otp/", { email });
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userData");
    setUser(null);
    setIsGuest(false);
    setIsDiscountVerified(false);
    setUserType("Regular");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        isDiscountVerified,
        userType,
        login,
        register,
        logout,
        setUser,
        continueAsGuest,
        verifyOtp,
        resendOtp,
        refreshProfileStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
