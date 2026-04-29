// src/api/hu/huEntries.schema.ts
import { z } from "zod";

export const HuEntrySchema = z.object({
  hu_id: z.number(),
  hu_transaction_id: z.number(),
  hu_batch_code: z.string().nullable(),
  hu_description: z.string().nullable(),
  hu_number: z.string(),
  hu_palletnumber: z.string().nullable(),
  hu_status: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const HuEntriesSchema = z.array(HuEntrySchema);

export type HuEntry = z.infer<typeof HuEntrySchema>;

export const HuEntryFormSchema = z.object({
  hu_number: z.string().min(1, "HU Number is required"),
  hu_batch_code: z.string().nullable(),
  hu_description: z.string().nullable(),
  hu_status: z.number().int().min(0).max(1),
  hu_transaction_id: z.union([z.string(), z.number()]),
});

export type HuEntryFormValues = z.infer<typeof HuEntryFormSchema>; // ← infer instead of manual
