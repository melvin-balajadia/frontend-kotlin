// src/hooks/transactions/approvalTransaction.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import {
  getApprovalLogs,
  submitTransactionApi,
  approveTransactionApi,
  rejectTransactionApi,
  returnTransactionApi,
} from "@/api/transactions/transactionApproval.api";

// ── Approval logs query (feeds the timeline) ──────────────────────────────────
export const useApprovalLogs = (transactionId: string | number) => {
  return useQuery({
    queryKey: [...queryKeys.transactionEntries.detail(transactionId), "logs"],
    queryFn: () => getApprovalLogs(transactionId),
    enabled: !!transactionId,
  });
};

// ── Shared invalidation helper ────────────────────────────────────────────────
const useInvalidateTransaction = (transactionId: string | number) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.transactionEntries.detail(transactionId),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.transactionEntries.list(),
    });
  };
};

// ── Submit ────────────────────────────────────────────────────────────────────
export const useSubmitTransaction = (transactionId: string | number) => {
  const invalidate = useInvalidateTransaction(transactionId);
  return useMutation({
    mutationFn: (comment?: string) =>
      submitTransactionApi(transactionId, comment),
    onSuccess: invalidate,
  });
};

// ── Approve ───────────────────────────────────────────────────────────────────
export const useApproveTransaction = (transactionId: string | number) => {
  const invalidate = useInvalidateTransaction(transactionId);
  return useMutation({
    mutationFn: (comment?: string) =>
      approveTransactionApi(transactionId, comment),
    onSuccess: invalidate,
  });
};

// ── Reject ────────────────────────────────────────────────────────────────────
export const useRejectTransaction = (transactionId: string | number) => {
  const invalidate = useInvalidateTransaction(transactionId);
  return useMutation({
    mutationFn: (comment?: string) =>
      rejectTransactionApi(transactionId, comment),
    onSuccess: invalidate,
  });
};

// ── Return ────────────────────────────────────────────────────────────────────
export const useReturnTransaction = (transactionId: string | number) => {
  const invalidate = useInvalidateTransaction(transactionId);
  return useMutation({
    mutationFn: (comment?: string) =>
      returnTransactionApi(transactionId, comment),
    onSuccess: invalidate,
  });
};
