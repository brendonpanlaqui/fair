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

// an interceptors, for attaching token to every request
api.interceptors.request.use(
  async (config) => {
    // retrieve token from secure storage and attach to headers if it exists
    const token = await SecureStore.getItemAsync("userToken");

    if (token) {
      // kapag SimpleJWT 'Bearer ', instead of 'Token '
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
