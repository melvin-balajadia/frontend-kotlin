// ─── ADD THESE to your existing transactionEntries.api.ts ────────────────────
// Add the import at the top of that file, then paste the functions at the bottom.

import { axiosClient } from "@/config/axiosClient";
import {
  ApprovalLogsSchema,
  type ApprovalLog,
} from "./transactionApproval.schema";

// ── Get approval logs (timeline data) ────────────────────────────────────────
export const getApprovalLogs = async (
  transactionId: string | number,
): Promise<ApprovalLog[]> => {
  const { data } = await axiosClient.get(
    `/transaction-entry/${transactionId}/logs`,
  );
  return ApprovalLogsSchema.parse(data.data);
};

// ── Submit for approval ───────────────────────────────────────────────────────
export const submitTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  await axiosClient.post(`/transaction-entry/${transactionId}/submit`, {
    comment,
  });
};

// ── Approve ───────────────────────────────────────────────────────────────────
export const approveTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  await axiosClient.post(`/transaction-entry/${transactionId}/approve`, {
    comment,
  });
};

// ── Reject ────────────────────────────────────────────────────────────────────
export const rejectTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  await axiosClient.post(`/transaction-entry/${transactionId}/reject`, {
    comment,
  });
};

// ── Return to creator ─────────────────────────────────────────────────────────
export const returnTransactionApi = async (
  transactionId: string | number,
  comment?: string,
): Promise<void> => {
  await axiosClient.post(`/transaction-entry/${transactionId}/return`, {
    comment,
  });
};
