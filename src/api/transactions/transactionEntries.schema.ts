import { z } from "zod";

export const TransactionEntry = z.object({
  transaction_id: z.number(),
  transaction_idn: z.string(),
  transaction_transaction_type: z.string(),
  transaction_client: z.string(),
  transaction_trucking_pn: z.string(),
  transaction_start_date: z.string().nullable(),
  transaction_end_date: z.string().nullable(),
  transaction_start_time: z.string().nullable(),
  transaction_end_time: z.string().nullable(),
  transaction_date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TransactionEntriesSchema = z.array(TransactionEntry);
