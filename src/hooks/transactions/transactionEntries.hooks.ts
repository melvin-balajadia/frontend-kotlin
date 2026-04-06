// src/hooks/useTransactionEntries.ts
import { useQuery } from "@tanstack/react-query";
import {
  getTransactionEntries,
  getTransactionEntryById,
} from "@/api/transactions/transactionEntries.api";
import { queryKeys } from "@/config/queryKeys";

export const useTransactionEntries = () => {
  return useQuery({
    queryKey: queryKeys.transactionEntries.list(),
    queryFn: getTransactionEntries,
    staleTime: 5 * 60 * 1000,
  });
};

export const useTransactionEntry = (id: string | number) => {
  return useQuery({
    queryKey: queryKeys.transactionEntries.detail(id),
    queryFn: () => getTransactionEntryById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
