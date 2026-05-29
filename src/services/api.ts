import axios from "axios";
import { router } from "expo-router";
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

// an interceptor for handling responses, intercepting 401s to attempt a silent token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // if it's a 401 and we haven't already tried to retry this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (refreshToken) {
          // ask backend for a new access token using the long-lived refresh token
          const res = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const newAccessToken = res.data.access;
          await SecureStore.setItemAsync("userToken", newAccessToken);

          // swap out the old expired token with the new one and retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // the refresh token is also expired or invalid. NOW we log them out.
        console.warn("Refresh token expired. Logging user out...");
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
