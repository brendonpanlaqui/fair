import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
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

  const [hasSynced, setHasSynced] = useState(false);

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D32F2F",
      });
    }

    if (Device.isDevice || Platform.OS === "android") {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return null;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          "384baf46-d97e-4fba-a3aa-3424e504ba0d";

        if (!projectId) {
          throw new Error("Project ID is missing!");
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;
        console.log("Push Token Generated:", token);
      } catch (e) {
        console.warn("Error fetching Expo Push Token:", e);
      }
    }

    return token;
  };

  const refreshProfileStatus = async () => {
    try {
      const response = await api.get("/users/me/");
      const updatedProfile = response.data;

      setIsDiscountVerified(updatedProfile.is_discount_verified);
      setUserType(updatedProfile.user_type);

      if (user) {
        const updatedUser = { ...user, ...updatedProfile };
        setUser(updatedUser);
        await SecureStore.setItemAsync("userData", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.warn("Failed to fetch profile status", error);
    }
  };

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync("userToken");
        const storedUser = await SecureStore.getItemAsync("userData");
        const guestFlag = await SecureStore.getItemAsync("isGuestFlag");

        if (token) {
          if (guestFlag === "true") {
            // They are a guest with a temporary token
            setIsGuest(true);
            setUser({ id: "guest", first_name: "Guest", last_name: "" });
          } else if (storedUser) {
            // They are a fully registered user
            setUser(JSON.parse(storedUser));
            setIsGuest(false);
          } else {
            // fallback
            setUser({ token });
            setIsGuest(false);
          }
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
    // Only run this if the user exists AND we haven't synced yet!
    if (user && !isGuest && !hasSynced) {
      refreshProfileStatus();

      const syncPushToken = async () => {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            // FIX: Changed URL to match your urls.py exactly!
            await api.post("/fcm/tokens/update/", { fcm_token: pushToken });
            console.log("Successfully synced Push Token to Django");
          }
        } catch (error) {
          console.warn("Failed to sync push token with backend", error);
        }
      };

      syncPushToken();

      // STOP THE LOOP
      setHasSynced(true);
    }
  }, [user, isGuest, hasSynced]);

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

  const continueAsGuest = async () => {
    try {
      // 1. Fetch the temporary guest token from your new Django endpoint
      const response = await api.post("/auth/guest-login/");
      const { access, refresh } = response.data;

      // 2. Save it exactly like a normal user token so api.ts can use it!
      if (access) await SecureStore.setItemAsync("userToken", access);
      if (refresh) await SecureStore.setItemAsync("refreshToken", refresh);

      // 3. Set a flag so the app remembers they are a guest on reload
      await SecureStore.setItemAsync("isGuestFlag", "true");

      setIsGuest(true);
      setUser({ id: "guest", first_name: "Guest", last_name: "" });
      setIsDiscountVerified(false);
      setUserType("Regular");
    } catch (error) {
      console.error("Failed to fetch guest token:", error);
      // Fallback just in case the server is down
      setIsGuest(true);
      setUser(null);
    }
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
    try {
      await api.post("/fcm/tokens/clear/");
    } catch (error) {
      console.warn("Could not clear FCM token on backend", error);
    }

    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("userData");
    await SecureStore.deleteItemAsync("isGuestFlag"); // ADD THIS LINE

    setUser(null);
    setIsGuest(false);
    setIsDiscountVerified(false);
    setUserType("Regular");
    setHasSynced(false);
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
