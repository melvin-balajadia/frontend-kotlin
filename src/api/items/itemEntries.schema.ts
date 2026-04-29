import { z } from "zod";

export const ItemEntrySchema = z.object({
  items_id: z.number(),
  items_hu_id: z.number(),
  items_item_code: z.string().nullable(),
  items_item_description: z.string().nullable(),
  items_batch_code: z.string().nullable(),
  items_pd: z.string().nullable(),
  items_cu: z.string().nullable(),
  items_weight: z.string().nullable(),
  items_status: z.number().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const ItemEntriesSchema = z.array(ItemEntrySchema);
