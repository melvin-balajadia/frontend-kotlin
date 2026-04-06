import { z } from "zod";

export const ItemEntrySchema = z.object({
  items_id: z.number(),
  items_hu_id: z.number(),
  items_batch_code: z.string(),
  items_production_code: z.string(),
  items_pd: z.string(),
  items_cu: z.string(),
  items_weight: z.string(),
  items_status: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const ItemEntriesSchema = z.array(ItemEntrySchema);
