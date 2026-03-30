import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically attach the token to every request
api.interceptors.request.use(
  async (config) => {
    // Make sure "userToken" is the exact key you use when saving the token during Login
    const token = await SecureStore.getItemAsync("userToken");

    if (token) {
      // CHANGED: SimpleJWT requires 'Bearer ' instead of 'Token '
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
