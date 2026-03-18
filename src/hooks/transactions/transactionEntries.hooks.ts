// src/hooks/useUsers.ts
import { useQuery } from "@tanstack/react-query";
import { getTransactionEntries } from "@/api/transactions/transactionEntries.api";

export const useTransactionEntries = () => {
  return useQuery({
    queryKey: ["transactionEntries"],
    queryFn: getTransactionEntries,
    staleTime: 5 * 60 * 1000,
  });
};
