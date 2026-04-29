// src/types/auth.types.ts

export interface AuthUser {
  userId: number;
  groupId: number;
  departmentId: number;
  userSite: string;
  userFullname: string;
  resetStatus: number;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
}

export interface LoginCredentials {
  user_name: string;
  user_password: string;
}

export interface LoginResponse extends AuthUser {
  errorStatus: boolean;
  accessToken: string;
  message?: string;
}

export interface RefreshResponse extends AuthUser {
  accessToken: string;
}
