// src/api/users/user.api.ts
import axios from "axios";
import { axiosClient } from "@/config/axiosClient";
import { ApiError } from "@/api/auth/auth.api";
import type {
  UserListResponse,
  UserDetailResponse,
  CreateUserFormValues,
  UpdateUserFormValues,
  SetUserStatusValues,
  ForceResetPasswordValues,
  UserRow,
} from "@/api/users/user.schema";
import type { FetchParams, PaginationMeta } from "@/components/CustomDataTable";

const resolveApiError = (error: unknown, fallback: string): ApiError => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? fallback;
    const statusCode = error.response?.status;
    return new ApiError(message, statusCode);
  }
  return new ApiError(fallback);
};

// ── Get all users ────────────────────────────────────────────────────────────
export const getUsersApi = async (
  page = 1,
  limit = 20,
  status: "active" | "inactive" | "all" = "active",
): Promise<UserListResponse> => {
  try {
    const { data } = await axiosClient.get<UserListResponse>("/users", {
      params: { page, limit, status },
    });
    return data;
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch users.");
  }
};

// ── Get single user ──────────────────────────────────────────────────────────
export const getUserByIdApi = async (
  userId: number | string,
): Promise<UserDetailResponse> => {
  try {
    const { data } = await axiosClient.get<UserDetailResponse>(
      `/users/${userId}`,
    );
    return data;
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch user.");
  }
};

// ── Create user ──────────────────────────────────────────────────────────────
export const createUserApi = async (
  payload: CreateUserFormValues,
): Promise<void> => {
  try {
    await axiosClient.post("/users", payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to create user.");
  }
};

// ── Update user ──────────────────────────────────────────────────────────────
export const updateUserApi = async (
  userId: number | string,
  payload: UpdateUserFormValues,
): Promise<void> => {
  try {
    await axiosClient.patch(`/users/${userId}`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to update user.");
  }
};

// ── Set user status (activate / deactivate) ──────────────────────────────────
export const setUserStatusApi = async (
  userId: number | string,
  payload: SetUserStatusValues,
): Promise<void> => {
  try {
    await axiosClient.patch(`/users/${userId}/status`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to update user status.");
  }
};

// ── Force reset password ─────────────────────────────────────────────────────
export const forceResetPasswordApi = async (
  userId: number | string,
  payload: ForceResetPasswordValues,
): Promise<void> => {
  try {
    await axiosClient.patch(`/users/${userId}/force-reset`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to reset password.");
  }
};

export const getPaginatedUsers = async (
  params: FetchParams,
): Promise<{ data: UserRow[]; meta: PaginationMeta }> => {
  const { page, perPage, search, sortKey, sortDir, filters } = params;

  const { data: json } = await axiosClient.get("/paginated-users", {
    params: {
      page,
      per_page: perPage,
      ...(search ? { search } : {}),
      ...(sortKey ? { sort_by: sortKey, sort_dir: sortDir ?? "asc" } : {}),
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    },
  });

  return {
    data: json.data,
    meta: {
      page: json.meta.current_page,
      perPage: json.meta.per_page,
      total: json.meta.total,
      totalPages: json.meta.last_page,
    },
  };
};
