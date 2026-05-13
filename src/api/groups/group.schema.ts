// src/api/groups/group.schema.ts
import { z } from "zod";

// ── Response schemas ─────────────────────────────────────────────────────────

export const PermissionSchema = z.object({
  permission_id: z.number(),
  permission_key: z.string(),
  permission_label: z.string(),
  permission_group: z.string().nullable(),
});

export const PermissionsSchema = z.array(PermissionSchema);

export const GroupSchema = z.object({
  group_id: z.number(),
  group_name: z.string(),
  group_description: z.string().nullable(),
  group_is_active: z.number(),
  created_at: z.string().nullable(),
  user_count: z.number(),
  permission_count: z.number(),
});

export const GroupDetailSchema = GroupSchema.extend({
  permissions: PermissionsSchema,
});

export const GroupListResponseSchema = z.object({
  errorStatus: z.boolean(),
  data: z.array(GroupSchema),
});

export const GroupDetailResponseSchema = z.object({
  errorStatus: z.boolean(),
  data: GroupDetailSchema,
});

export const PermissionListResponseSchema = z.object({
  errorStatus: z.boolean(),
  data: PermissionsSchema,
  grouped: z.record(z.string(), PermissionsSchema),
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type Permission = z.infer<typeof PermissionSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type GroupDetail = z.infer<typeof GroupDetailSchema>;
export type GroupListResponse = z.infer<typeof GroupListResponseSchema>;
export type GroupDetailResponse = z.infer<typeof GroupDetailResponseSchema>;
export type PermissionListResponse = z.infer<
  typeof PermissionListResponseSchema
>;

// ── Form schemas ─────────────────────────────────────────────────────────────

export const CreateGroupFormSchema = z.object({
  group_name: z.string().min(1, "Group name is required"),
  group_description: z.string().nullable().optional(),
});

export const UpdateGroupFormSchema = z.object({
  group_name: z.string().min(1, "Group name is required").optional(),
  group_description: z.string().nullable().optional(),
  group_is_active: z.boolean().optional(),
});

export const SetGroupPermissionsSchema = z.object({
  permission_ids: z.array(z.number()),
});

export const PatchGroupPermissionsSchema = z.object({
  add: z.array(z.number()).optional(),
  remove: z.array(z.number()).optional(),
});

// ── Inferred form types ──────────────────────────────────────────────────────

export type CreateGroupFormValues = z.infer<typeof CreateGroupFormSchema>;
export type UpdateGroupFormValues = z.infer<typeof UpdateGroupFormSchema>;
export type SetGroupPermissionsValues = z.infer<
  typeof SetGroupPermissionsSchema
>;
export type PatchGroupPermissionsValues = z.infer<
  typeof PatchGroupPermissionsSchema
>;

// ── Group user (for reassignment modal) ──────────────────────────────────────
export const GroupUserSchema = z.object({
  user_id: z.number(),
  user_username: z.string(),
  user_firstname: z.string(),
  user_lastname: z.string(),
  user_status: z.enum(["active", "inactive"]),
});

export const GroupUsersResponseSchema = z.object({
  errorStatus: z.boolean(),
  data: z.array(GroupUserSchema),
});

export type GroupUser = z.infer<typeof GroupUserSchema>;
export type GroupUsersResponse = z.infer<typeof GroupUsersResponseSchema>;

// ── Reassign payload ──────────────────────────────────────────────────────────
export const ReassignUsersSchema = z.object({
  assignments: z
    .array(
      z.object({
        user_id: z.number(),
        new_group_id: z.number(),
      }),
    )
    .min(1, "At least one assignment is required."),
});

export type ReassignUsersValues = z.infer<typeof ReassignUsersSchema>;
