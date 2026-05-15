// ─── ADD THESE to your existing transactionEntries.api.ts ────────────────────
// Add the import at the top of that file, then paste the functions at the bottom.

import axios from "axios";
import { axiosClient } from "@/config/axiosClient";
import { ApiError } from "@/api/auth/auth.api";
import {
  ApprovalLogsSchema,
  type ApprovalLog,
} from "./transactionApproval.schema";

const resolveApiError = (error: unknown, fallback: string): ApiError => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? fallback;
    const statusCode = error.response?.status;
    return new ApiError(message, statusCode);
  }
  return new ApiError(fallback);
};

// ── Get approval logs (timeline data) ────────────────────────────────────────
export const getApprovalLogs = async (
  transactionId: string | number,
): Promise<ApprovalLog[]> => {
  try {
    const { data } = await axiosClient.get(
      `/transaction-entry/${transactionId}/logs`,
    );
    return ApprovalLogsSchema.parse(data.data);
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch approval logs.");
  }
};

// ── Submit for approval ───────────────────────────────────────────────────────
export const submitTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  try {
    await axiosClient.post(`/transaction-entry/${transactionId}/submit`, {
      comment,
    });
  } catch (error) {
    throw resolveApiError(error, "Failed to submit transaction.");
  }
};

// ── Approve ───────────────────────────────────────────────────────────────────
export const approveTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  try {
    await axiosClient.post(`/transaction-entry/${transactionId}/approve`, {
      comment,
    });
  } catch (error) {
    throw resolveApiError(error, "Failed to approve transaction.");
  }
};

// ── Reject ────────────────────────────────────────────────────────────────────
export const rejectTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  try {
    await axiosClient.post(`/transaction-entry/${transactionId}/reject`, {
      comment,
    });
  } catch (error) {
    throw resolveApiError(error, "Failed to reject transaction.");
  }
};

// ── Return to creator ─────────────────────────────────────────────────────────
export const returnTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  try {
    await axiosClient.post(`/transaction-entry/${transactionId}/return`, {
      comment,
    });
  } catch (error) {
    throw resolveApiError(error, "Failed to return transaction.");
  }
};
