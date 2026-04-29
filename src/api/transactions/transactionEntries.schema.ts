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

export const ItemEntryReportSchema = z.object({
  items_id: z.number(),
  items_hu_id: z.number(),
  items_item_code: z.string().nullable(),
  items_item_description: z.string().nullable(),
  items_batch_code: z.string().nullable(),
  items_pd: z.string().nullable(),
  items_cu: z.string().nullable(),
  items_weight: z.string().nullable(),
  items_status: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const HuEntryReportSchema = z.object({
  hu_id: z.number(),
  hu_transaction_id: z.number(),
  hu_number: z.string().nullable(),
  hu_palletnumber: z.string().nullable(),
  hu_batch_code: z.string().nullable(),
  hu_description: z.string().nullable(),
  hu_status: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  items: z.array(ItemEntryReportSchema),
});

export const TransactionReportSchema = z.object({
  transaction_id: z.number(),
  transaction_idn: z.string().nullable(),
  transaction_transaction_type: z.string().nullable(),
  transaction_client: z.string().nullable(),
  transaction_trucking_pn: z.string().nullable(),
  transaction_start_date: z.string().nullable(),
  transaction_end_date: z.string().nullable(),
  transaction_start_time: z.string().nullable(),
  transaction_end_time: z.string().nullable(),
  transaction_date: z.string().nullable(),
  transaction_status: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  hu_list: z.array(HuEntryReportSchema),
});

export type TransactionReport = z.infer<typeof TransactionReportSchema>;
export type HuEntryReport = z.infer<typeof HuEntryReportSchema>;
export type ItemEntryReport = z.infer<typeof ItemEntryReportSchema>;

// Inferred TypeScript type for the form
export type TransactionEntryFormValues = z.infer<
  typeof TransactionEntryFormSchema
>;
