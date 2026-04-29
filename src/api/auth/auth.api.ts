import axios from "axios";
import { axiosPublic } from "@/config/axiosClient";
import { authStore } from "@/config/authStore";
import type {
  LoginCredentials,
  LoginResponse,
  AuthUser,
} from "@/types/auth.types";

// ── Typed API error ─────────────────────────────────────────────────────────
// Carry the backend message + HTTP status through the call stack
// so UI layers can display exactly what the server said.
export class ApiError extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

// Extracts the backend message from an Axios error, with a safe fallback.
const resolveApiError = (error: unknown, fallback: string): ApiError => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? fallback;
    const statusCode = error.response?.status;
    return new ApiError(message, statusCode);
  }
  return new ApiError(fallback);
};

// ── Login ───────────────────────────────────────────────────────────────────
export const loginApi = async (
  credentials: LoginCredentials,
): Promise<AuthUser> => {
  try {
    const { data } = await axiosPublic.post<LoginResponse>(
      "/auth-login",
      credentials,
    );

    const user: AuthUser = {
      userId: data.userId,
      groupId: data.groupId,
      departmentId: data.departmentId,
      userSite: data.userSite,
      userFullname: data.userFullname,
      resetStatus: data.resetStatus,
    };

    authStore.setAuth(user, data.accessToken);
    return user;
  } catch (error) {
    throw resolveApiError(error, "Login failed. Please try again.");
  }
};

// ── Logout ──────────────────────────────────────────────────────────────────
export const logoutApi = async (): Promise<void> => {
  try {
    await axiosPublic.post("/auth-logout");
  } finally {
    // Always clear memory even if the server call fails
    authStore.clearAuth();
  }
};

// ── Reset password ──────────────────────────────────────────────────────────
export const resetPasswordApi = async (
  userId: number | string,
  newPassword: string,
): Promise<void> => {
  try {
    await axiosPublic.patch(`/auth-reset/${userId}`, {
      user_password: newPassword,
    });
  } catch (error) {
    throw resolveApiError(error, "Password reset failed. Please try again.");
  }
};
