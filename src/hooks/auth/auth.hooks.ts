import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { resetPasswordApi, ApiError } from "@/api/auth/auth.api";
import type { LoginCredentials } from "@/types/auth.types";

export const useLogin = () => {
  const { login } = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onError: (error) => {
      // ApiError.message already contains the backend message
      if (!(error instanceof ApiError)) {
        console.error("[useLogin] Unexpected error:", error);
      }
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuth();

  return useMutation({
    mutationFn: () => logout(),
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({
      userId,
      newPassword,
    }: {
      userId: number | string;
      newPassword: string;
    }) => resetPasswordApi(userId, newPassword),
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useResetPassword] Unexpected error:", error);
      }
    },
  });
};
