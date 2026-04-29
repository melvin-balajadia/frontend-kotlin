// src/components/ProtectedRoute.tsx
//
// Wraps any route that requires authentication.
// Shows nothing while the silent refresh is running (isLoading),
// then redirects to /login if no session is found.

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for the silent refresh before making a redirect decision
  if (isLoading) {
    return null; // or replace with a fullscreen spinner component
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
