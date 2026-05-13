// src/api/groups/group.api.ts
import axios from "axios";
import { axiosClient } from "@/config/axiosClient";
import { ApiError } from "@/api/auth/auth.api";
import type {
  GroupListResponse,
  GroupDetailResponse,
  PermissionListResponse,
  CreateGroupFormValues,
  UpdateGroupFormValues,
  SetGroupPermissionsValues,
  PatchGroupPermissionsValues,
  GroupUsersResponse,
  ReassignUsersValues,
} from "@/api/groups/group.schema";

import type { FetchParams, PaginationMeta } from "@/components/CustomDataTable";
import type { Group } from "@/api/groups/group.schema";

export interface PaginatedGroupsResult {
  data: Group[];
  meta: PaginationMeta;
}

const resolveApiError = (error: unknown, fallback: string): ApiError => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? fallback;
    const statusCode = error.response?.status;
    return new ApiError(message, statusCode);
  }
  return new ApiError(fallback);
};

// ── Get all groups ───────────────────────────────────────────────────────────
export const getGroupsApi = async (): Promise<GroupListResponse> => {
  try {
    const { data } = await axiosClient.get<GroupListResponse>("/groups");
    return data;
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch groups.");
  }
};

// ── Get single group with permissions ────────────────────────────────────────
export const getGroupByIdApi = async (
  groupId: number | string,
): Promise<GroupDetailResponse> => {
  try {
    const { data } = await axiosClient.get<GroupDetailResponse>(
      `/groups/${groupId}`,
    );
    return data;
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch group.");
  }
};

// ── Get all permissions ──────────────────────────────────────────────────────
export const getPermissionsApi = async (): Promise<PermissionListResponse> => {
  try {
    const { data } =
      await axiosClient.get<PermissionListResponse>("/permissions");
    return data;
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch permissions.");
  }
};

// ── Create group ─────────────────────────────────────────────────────────────
export const createGroupApi = async (
  payload: CreateGroupFormValues,
): Promise<void> => {
  try {
    await axiosClient.post("/groups", payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to create group.");
  }
};

// ── Update group ─────────────────────────────────────────────────────────────
export const updateGroupApi = async (
  groupId: number | string,
  payload: UpdateGroupFormValues,
): Promise<void> => {
  try {
    await axiosClient.patch(`/groups/${groupId}`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to update group.");
  }
};

// ── Delete group ─────────────────────────────────────────────────────────────
export const deleteGroupApi = async (
  groupId: number | string,
): Promise<void> => {
  try {
    await axiosClient.delete(`/groups/${groupId}`);
  } catch (error) {
    throw resolveApiError(error, "Failed to delete group.");
  }
};

// ── Set group permissions (full replacement) ─────────────────────────────────
export const setGroupPermissionsApi = async (
  groupId: number | string,
  payload: SetGroupPermissionsValues,
): Promise<void> => {
  try {
    await axiosClient.put(`/groups/${groupId}/permissions`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to update group permissions.");
  }
};

// ── Patch group permissions (incremental add/remove) ─────────────────────────
export const patchGroupPermissionsApi = async (
  groupId: number | string,
  payload: PatchGroupPermissionsValues,
): Promise<void> => {
  try {
    await axiosClient.patch(`/groups/${groupId}/permissions`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to patch group permissions.");
  }
};

export const getPaginatedGroupsApi = async (
  params: FetchParams,
): Promise<PaginatedGroupsResult> => {
  try {
    const { page, perPage, search, sortKey, sortDir, filters } = params;

    const { data } = await axiosClient.get("/paginated-groups", {
      params: {
        page,
        per_page: perPage,
        ...(search ? { search } : {}),
        ...(sortKey ? { sort_by: sortKey, sort_dir: sortDir ?? "asc" } : {}),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      },
    });

    return {
      data: data.data,
      meta: {
        page: data.meta.current_page,
        perPage: data.meta.per_page,
        total: data.meta.total,
        totalPages: data.meta.last_page,
      },
    };
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch groups.");
  }
};

// ── Get users in a group ─────────────────────────────────────────────────────
export const getGroupUsersApi = async (
  groupId: number | string,
): Promise<GroupUsersResponse> => {
  try {
    const { data } = await axiosClient.get<GroupUsersResponse>(
      `/groups/${groupId}/users`,
    );
    return data;
  } catch (error) {
    throw resolveApiError(error, "Failed to fetch group users.");
  }
};

// ── Bulk reassign users to new groups ────────────────────────────────────────
export const reassignGroupUsersApi = async (
  groupId: number | string,
  payload: ReassignUsersValues,
): Promise<void> => {
  try {
    await axiosClient.post(`/groups/${groupId}/reassign`, payload);
  } catch (error) {
    throw resolveApiError(error, "Failed to reassign users.");
  }
};
