// src/api/transactions/transactionEntry.schema.ts
import { z } from "zod";

// ── Response schema (from API) ────────────────────────────────────────────────
export const TransactionEntrySchema = z.object({
  transaction_id: z.number(),
  transaction_idn: z.string(),
  transaction_transaction_type: z.string(),
  transaction_client: z.string(),
  transaction_trucking_pn: z.string(),
  transaction_start_date: z.string().nullable(),
  transaction_end_date: z.string().nullable(),
  transaction_start_time: z.string().nullable(),
  transaction_end_time: z.string().nullable(),
  transaction_date: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  // 👇 only if your API actually returns this field

  transaction_status: z.number().optional(), // ← add this
  transaction_description: z.string().nullable().optional(),
});

export const TransactionEntriesSchema = z.array(TransactionEntrySchema);

// ── Form/Create schema (what the form submits) ────────────────────────────────
export const TransactionEntryFormSchema = z.object({
  transaction_idn: z.string().min(1, "IDN/WIL No. is required"),
  transaction_transaction_type: z
    .string()
    .min(1, "Transaction type is required"),
  transaction_client: z.string().min(1, "Client name is required"),
  transaction_trucking_pn: z.string().min(1, "Plate number is required"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  transaction_start_date: z.string().min(1, "Start date is required"),
  transaction_end_date: z.string().min(1, "End date is required"),
  transaction_start_time: z.string().min(1, "Start time is required"),
  transaction_end_time: z.string().min(1, "End time is required"),
  transaction_description: z.string().optional(),
});

// Inferred TypeScript type for the form
export type TransactionEntryFormValues = z.infer<
  typeof TransactionEntryFormSchema
>;
