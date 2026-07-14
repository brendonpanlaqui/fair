import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// automatically switch between iOS Simulator (localhost) and Android Emulator (10.0.2.2)
const LOCAL_IP =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://localhost:8000/api";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || LOCAL_IP;

console.log("THE API URL IS:", process.env.EXPO_PUBLIC_API_URL);

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("userToken");

    // DEBUG LOG: Check your terminal! If this says "NULL", your login screen isn't saving the token!
    console.log(`[Axios] Sending Request to: ${config.url}`);
    console.log(`[Axios] Token Attached: ${token ? "YES ✅" : "NO ❌ (NULL)"}`);

    if (token) {
      // Ensure the headers object exists before assigning
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("[Axios] 401 Caught! Attempting to refresh token...");

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (refreshToken) {
          const res = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          await SecureStore.setItemAsync("userToken", newAccessToken);

          console.log("[Axios] Token Refreshed Successfully! ✅");

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.warn(
          "[Axios] Refresh token expired or missing. Forcing Logout.",
        );
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("refreshToken");
        await SecureStore.deleteItemAsync("userData");
        router.replace("/");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);
