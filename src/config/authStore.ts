// src/store/authStore.ts
//
// ALL auth state lives here in memory only.
// Nothing is written to localStorage, sessionStorage, or cookies.
// The access token is intentionally never persisted to the DOM.

import type { AuthState, AuthUser } from "@/types/auth.types";

let state: AuthState = {
  user: null,
  accessToken: null,
};

export const authStore = {
  /** Returns the current in-memory access token. */
  getToken(): string | null {
    return state.accessToken;
  },

  /** Returns the current logged-in user info. */
  getUser(): AuthUser | null {
    return state.user;
  },

  /** Returns true if an access token is present in memory. */
  isAuthenticated(): boolean {
    return !!state.accessToken;
  },

  /** Called after a successful login or token refresh. */
  setAuth(user: AuthUser, accessToken: string): void {
    state = { user, accessToken };
  },

  /** Wipes all in-memory auth state on logout or auth failure. */
  clearAuth(): void {
    state = { user: null, accessToken: null };
  },
};
