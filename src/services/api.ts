import axios from "axios";
import * as SecureStore from "expo-secure-store";

// REPLACE THIS with your actual local IPv4 address
// Find it by running 'ipconfig' (Windows) or 'ifconfig' (Mac) in your terminal.
const BASE_URL = "http://192.168.8.38:8000/api";

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
