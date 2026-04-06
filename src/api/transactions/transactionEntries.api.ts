// src/api/transactions/transactionEntry.api.ts
import { axiosClient } from "@/config/axiosClient";
import {
  TransactionEntriesSchema,
  TransactionEntrySchema,
} from "./transactionEntries.schema";
import type { TransactionEntryFormValues } from "./transactionEntries.schema";
import type { FetchParams, PaginationMeta } from "@/components/CustomDataTable";

export interface Transaction extends Record<string, unknown> {
  transaction_id: number;
  transaction_idn: string;
  transaction_transaction_type: string;
  transaction_client: string;
  transaction_trucking_pn: string;
  transaction_date: string | null;
}

export const getTransactionEntries = async () => {
  const response = await axiosClient.get("/transaction-entry");
  return TransactionEntriesSchema.parse(response.data.data);
};

export const getPaginatedTransactionEntries = async (
  params: FetchParams,
): Promise<{ data: Transaction[]; meta: PaginationMeta }> => {
  const { page, perPage, search, sortKey, sortDir, filters } = params;

  const response = await axiosClient.get("/paginated-transaction", {
    params: {
      page,
      per_page: perPage,
      ...(search ? { search } : {}),
      ...(sortKey ? { sort_by: sortKey, sort_dir: sortDir ?? "asc" } : {}),
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    },
  });

  const json = response.data;
  return {
    data: TransactionEntriesSchema.parse(json.data),
    meta: {
      page: json.meta.current_page,
      perPage: json.meta.per_page,
      total: json.meta.total,
      totalPages: json.meta.last_page,
    },
  };
};

// ── Typed create ──────────────────────────────────────────────────────────────
export const createTransactionEntry = async (
  payload: TransactionEntryFormValues,
) => {
  const { data } = await axiosClient.post("/transaction-entry", payload);
  return data;
};

export const getTransactionEntryById = async (id: string | number) => {
  const { data } = await axiosClient.get(`/transaction-entry/${id}`);
  return TransactionEntrySchema.parse(data.data); // ✅ single schema, not array
};

export const updateTransactionEntry = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: TransactionEntryFormValues;
}) => {
  const { data } = await axiosClient.put(`/transaction-entry/${id}`, payload);
  return data;
};
