// src/hooks/users/user.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { ApiError } from "@/api/auth/auth.api";
import {
  getUsersApi,
  getUserByIdApi,
  createUserApi,
  updateUserApi,
  setUserStatusApi,
  forceResetPasswordApi,
} from "@/api/users/user.api";
import type {
  CreateUserFormValues,
  UpdateUserFormValues,
  SetUserStatusValues,
  ForceResetPasswordValues,
} from "@/api/users/user.schema";

// ── List users ───────────────────────────────────────────────────────────────
export const useUsers = (
  page = 1,
  status: "active" | "inactive" | "all" = "active",
) => {
  return useQuery({
    queryKey: queryKeys.users.list(page, status),
    queryFn: () => getUsersApi(page, 20, status),
  });
};

// ── Single user ──────────────────────────────────────────────────────────────
export const useUser = (userId: number | string) => {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => getUserByIdApi(userId),
    enabled: !!userId,
  });
};

// ── Create user ──────────────────────────────────────────────────────────────
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserFormValues) => createUserApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useCreateUser] Unexpected error:", error);
      }
    },
  });
};

// ── Update user ──────────────────────────────────────────────────────────────
export const useUpdateUser = (userId: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserFormValues) =>
      updateUserApi(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(userId),
      });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useUpdateUser] Unexpected error:", error);
      }
    },
  });
};

// ── Set user status ──────────────────────────────────────────────────────────
export const useSetUserStatus = (userId: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetUserStatusValues) =>
      setUserStatusApi(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useSetUserStatus] Unexpected error:", error);
      }
    },
  });
};

// ── Force reset password ─────────────────────────────────────────────────────
export const useForceResetPassword = (userId: number | string) => {
  return useMutation({
    mutationFn: (payload: ForceResetPasswordValues) =>
      forceResetPasswordApi(userId, payload),
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useForceResetPassword] Unexpected error:", error);
      }
    },
  });
};
