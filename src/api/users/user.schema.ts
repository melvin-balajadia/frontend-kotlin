// src/api/users/user.schema.ts
import { z } from "zod";

// ── Response schemas ─────────────────────────────────────────────────────────

export const UserSchema = z.object({
  user_id: z.number(),
  user_username: z.string(),
  user_firstname: z.string(),
  user_lastname: z.string(),
  user_groupid: z.number().nullable(),
  group_name: z.string().nullable(),
  user_departmentid: z.number().nullable(),
  user_site: z.string().nullable(),
  user_status: z.enum(["active", "inactive"]),
  user_resetstatus: z.number(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const UsersSchema = z.array(UserSchema);

export const UserMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const UserListResponseSchema = z.object({
  errorStatus: z.boolean(),
  data: UsersSchema,
  meta: UserMetaSchema,
});

export const UserDetailResponseSchema = z.object({
  errorStatus: z.boolean(),
  data: UserSchema,
});

// ── Inferred types ───────────────────────────────────────────────────────────

export type User = z.infer<typeof UserSchema>;
export type UserRow = User & Record<string, unknown>; // ← add this
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UserDetailResponse = z.infer<typeof UserDetailResponseSchema>;

// ── Form schemas ─────────────────────────────────────────────────────────────

export const CreateUserFormSchema = z.object({
  user_username: z.string().min(1, "Username is required"),
  user_password: z.string().min(8, "Password must be at least 8 characters"),
  user_firstname: z.string().min(1, "First name is required"),
  user_lastname: z.string().min(1, "Last name is required"),
  user_groupid: z.number().min(1, "Group is required"),
  user_departmentid: z.number().nullable().optional(),
  user_site: z.string().nullable().optional(),
});

export const UpdateUserFormSchema = z.object({
  user_firstname: z.string().min(1, "First name is required").optional(),
  user_lastname: z.string().min(1, "Last name is required").optional(),
  user_groupid: z.number().optional(),
  user_departmentid: z.number().nullable().optional(),
  user_site: z.string().nullable().optional(),
});

export const SetUserStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const ForceResetPasswordSchema = z.object({
  new_password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Inferred form types ──────────────────────────────────────────────────────

export type CreateUserFormValues = z.infer<typeof CreateUserFormSchema>;
export type UpdateUserFormValues = z.infer<typeof UpdateUserFormSchema>;
export type SetUserStatusValues = z.infer<typeof SetUserStatusSchema>;
export type ForceResetPasswordValues = z.infer<typeof ForceResetPasswordSchema>;
