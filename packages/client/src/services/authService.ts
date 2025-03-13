import axios from "axios";
import { API_URL } from "../config";

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Auth service
const authService = {
  // Register a new user
  register: async (data: RegisterData): Promise<User> => {
    const response = await apiClient.post("/auth/register", data);
    return response.data.user;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", credentials);
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userId", response.data.user.id);
    localStorage.setItem("username", response.data.user.username);
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    // Add token to request
    const token = localStorage.getItem("token");
    const response = await apiClient.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
  },
};

export default authService;
