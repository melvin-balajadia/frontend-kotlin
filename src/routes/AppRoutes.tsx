import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "@/layout/MainLayout";
import Loader from "@/utils/Loader";

// Lazy load pages
const Settings = lazy(() => import("@/pages/Settings"));
const TransactionEntries = lazy(() => import("@/pages/TransactionEntries"));
const PageNotFound = lazy(() => import("@/pages/PageNotFound"));

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<MainLayout />}>
            {/* <Route index element={<TransactionEntries />} /> */}
            <Route
              path="transaction-entries"
              element={<TransactionEntries />}
            />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
