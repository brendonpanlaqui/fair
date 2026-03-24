import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = "http://192.168.8.35:8000/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically attach the token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("userToken");
    if (token) {
      config.headers.Authorization = `Token ${token}`; // Adjust to 'Bearer' if using simplejwt
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
