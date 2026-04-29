import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "@/layout/MainLayout";
import Loader from "@/utils/Loader";
import LoginPage from "@/pages/LoginPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoutes";

// Lazy load pages
const Settings = lazy(() => import("@/pages/Settings"));
const TransactionEntries = lazy(
  () => import("@/pages/transaction-entries/TransactionEntries"),
);
const AddTransactionEntries = lazy(
  () => import("@/pages/transaction-entries/AddTransactionEntries"),
);
const EditTransactionEntries = lazy(
  () => import("@/pages/transaction-entries/EditTransactionEntries"),
);

const ItemEntries = lazy(() => import("@/pages/item-entries/ItemEntries"));

const PageNotFound = lazy(() => import("@/pages/PageNotFound"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              {/* <Route index element={<TransactionEntries />} /> */}
              <Route
                path="transaction-entries"
                element={<TransactionEntries />}
              />
              <Route
                path="transaction-entries/add"
                element={<AddTransactionEntries />}
              />
              <Route
                path="transaction-entries/edit/:id"
                element={<EditTransactionEntries />}
              />
              <Route
                path="transaction-entries/item-entries/:id"
                element={<ItemEntries />}
              />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<PageNotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
