import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authStore } from "@/config/authStore";
import { loginApi, logoutApi } from "@/api/auth/auth.api";
import { axiosPublic } from "@/config/axiosClient";
import type {
  AuthUser,
  LoginCredentials,
  RefreshResponse,
} from "@/types/auth.types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(authStore.getUser());
  const [isLoading, setIsLoading] = useState(true);

  // ── Silent refresh on mount ───────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } =
          await axiosPublic.get<RefreshResponse>("/auth-refresh");

        const restoredUser: AuthUser = {
          userId: data.userId,
          groupId: data.groupId,
          departmentId: data.departmentId,
          userSite: data.userSite,
          userFullname: data.userFullname,
          resetStatus: data.resetStatus,
        };

        authStore.setAuth(restoredUser, data.accessToken);
        setUser(restoredUser);
      } catch {
        // Cookie missing or expired — requires fresh login
        authStore.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const loggedInUser = await loginApi(credentials);
    setUser(loggedInUser);
    // ApiError thrown by loginApi propagates to the caller (useLogin hook)
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
