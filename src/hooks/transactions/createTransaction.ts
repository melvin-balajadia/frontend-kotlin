// src/hooks/useCreateUser.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransactionEntry } from "@/api/transactions/transactionEntries.api";
import { queryKeys } from "@/config/queryKeys";

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransactionEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactionEntries.list(),
      });
    },
  });
};
