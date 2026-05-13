// ─── ADD THESE to your existing transactionEntries.schema.ts ─────────────────
// Place after your existing exports at the bottom of the file.

import { z } from "zod";

// ── Approval log entry (from GET /transaction-entry/:id/logs) ─────────────────
export const ApprovalLogSchema = z.object({
  log_id: z.number(),
  log_action: z.enum(["submit", "approve", "reject", "return"]),
  log_from_status: z.number(),
  log_to_status: z.number(),
  log_actor_id: z.number(),
  log_actor_name: z.string(),
  log_step_label: z.string(),
  log_comment: z.string().nullable(),
  log_created_at: z.string(),
});

export const ApprovalLogsSchema = z.array(ApprovalLogSchema);

export type ApprovalLog = z.infer<typeof ApprovalLogSchema>;

// ── Approval action payload (submit / approve / reject / return) ──────────────
export const ApprovalActionSchema = z.object({
  comment: z.string().optional(),
});

export type ApprovalActionValues = z.infer<typeof ApprovalActionSchema>;
