// src/config/axiosClient.ts
//
// Two axios instances:
//   axiosClient       — for all protected API calls (auto-attaches Bearer token,
//                        auto-refreshes on 401, queues concurrent retries)
//   axiosPublic       — for unauthenticated calls (login, refresh, public endpoints)

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { authStore } from "@/config/authStore";

const BASE_URL = import.meta.env.VITE_API_URL;

// ─── Public client (no token logic) ─────────────────────────────────────────
export const axiosPublic: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // needed so the jwt refresh cookie is sent/received
});

// ─── Private client (protected routes) ──────────────────────────────────────
export const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // sends the httpOnly refresh cookie on every request
});

// ─── Refresh token queue ─────────────────────────────────────────────────────
// If multiple requests fail with 401 at the same time, we queue them and
// replay them all once a single refresh succeeds — avoiding a refresh storm.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Request interceptor — attach access token ───────────────────────────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStore.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — silent token refresh on 401 ─────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt a refresh once per request, and only on 401
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another refresh is already in flight — queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosClient(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Hit the refresh endpoint — the httpOnly cookie is sent automatically
      const { data } = await axiosPublic.get<{
        accessToken: string;
        userId: number;
        groupId: number;
        departmentId: number;
        userSite: string;
        userFullname: string;
        resetStatus: number;
      }>("/auth-refresh");

      // Update in-memory store with the new token
      authStore.setAuth(
        {
          userId: data.userId,
          groupId: data.groupId,
          departmentId: data.departmentId,
          userSite: data.userSite,
          userFullname: data.userFullname,
          resetStatus: data.resetStatus,
        },
        data.accessToken,
      );

      // Replay queued requests with the new token
      processQueue(null, data.accessToken);

      // Retry the original failed request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return axiosClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed (cookie expired or revoked) — force logout
      processQueue(refreshError, null);
      authStore.clearAuth();

      // Redirect to login without touching history
      window.location.replace("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
