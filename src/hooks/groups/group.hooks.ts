// src/hooks/groups/group.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";
import { ApiError } from "@/api/auth/auth.api";
import {
  getGroupsApi,
  getGroupByIdApi,
  getPermissionsApi,
  createGroupApi,
  updateGroupApi,
  deleteGroupApi,
  setGroupPermissionsApi,
  getGroupUsersApi,
  reassignGroupUsersApi,
} from "@/api/groups/group.api";
import type {
  CreateGroupFormValues,
  UpdateGroupFormValues,
  SetGroupPermissionsValues,
  ReassignUsersValues,
} from "@/api/groups/group.schema";

// ── List groups ──────────────────────────────────────────────────────────────
export const useGroups = () => {
  return useQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: getGroupsApi,
  });
};

// ── Single group with its permissions ────────────────────────────────────────
export const useGroup = (groupId: number | string) => {
  return useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => getGroupByIdApi(groupId),
    enabled: !!groupId,
  });
};

// ── All permissions catalogue ────────────────────────────────────────────────
export const usePermissions = () => {
  return useQuery({
    queryKey: queryKeys.permissions.list(),
    queryFn: getPermissionsApi,
    staleTime: 10 * 60 * 1000, // permissions rarely change — cache 10 min
  });
};

// ── Create group ─────────────────────────────────────────────────────────────
export const useCreateGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGroupFormValues) => createGroupApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useCreateGroup] Unexpected error:", error);
      }
    },
  });
};

// ── Update group ─────────────────────────────────────────────────────────────
export const useUpdateGroup = (groupId: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroupFormValues) =>
      updateGroupApi(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useUpdateGroup] Unexpected error:", error);
      }
    },
  });
};

// ── Delete group ─────────────────────────────────────────────────────────────
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number | string) => deleteGroupApi(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useDeleteGroup] Unexpected error:", error);
      }
    },
  });
};

// ── Set group permissions (full replacement) ─────────────────────────────────
export const useSetGroupPermissions = (groupId: number | string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetGroupPermissionsValues) =>
      setGroupPermissionsApi(groupId, payload),
    onSuccess: () => {
      // Invalidate both the detail (permission list) AND the list (card counts)
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useSetGroupPermissions] Unexpected error:", error);
      }
    },
  });
};

// ── Get users in a group ─────────────────────────────────────────────────────
export const useGroupUsers = (groupId: number | string, enabled = true) => {
  return useQuery({
    queryKey: [...queryKeys.groups.detail(groupId), "users"],
    queryFn: () => getGroupUsersApi(groupId),
    enabled: !!groupId && enabled,
  });
};

// ── Bulk reassign users ───────────────────────────────────────────────────────
export const useReassignGroupUsers = (groupId: number | string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReassignUsersValues) =>
      reassignGroupUsersApi(groupId, payload),
    onSuccess: () => {
      // Refresh the group list (card counts) and the specific group detail
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groups.detail(groupId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        console.error("[useReassignGroupUsers] Unexpected error:", error);
      }
    },
  });
};
