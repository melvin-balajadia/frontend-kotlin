// src/hooks/hu/huEntries.hooks.ts  (add create hook)
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHuEntry,
  getHuEntriesByTransactionId,
} from "@/api/hu/huEntries.api";
import type { HuEntryFormValues } from "@/api/hu/huEntries.schema";
import { queryKeys } from "@/config/queryKeys";

export const useHuEntries = (transactionId: string | number) => {
  return useQuery({
    queryKey: queryKeys.huEntries.list(transactionId),
    queryFn: () => getHuEntriesByTransactionId(transactionId),
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateHuEntry = (transactionId: string | number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HuEntryFormValues) => createHuEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.huEntries.list(transactionId),
      });
    },
  });
};
