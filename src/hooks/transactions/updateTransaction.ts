// src/hooks/useUpdateTransactionEntry.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTransactionEntry } from "@/api/transactions/transactionEntries.api";
import { queryKeys } from "@/config/queryKeys";
import type { TransactionEntryFormValues } from "@/api/transactions/transactionEntries.schema";

type UpdateTransactionPayload = TransactionEntryFormValues & {
  is_draft: boolean;
};

export const useUpdateTransactionEntry = (id: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateTransactionPayload) =>
      updateTransactionEntry({ id, payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactionEntries.list(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactionEntries.detail(id),
      });
    },
  });
};
