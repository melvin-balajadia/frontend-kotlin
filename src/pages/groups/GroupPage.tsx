// src/pages/groups/GroupsPage.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LuShield,
  LuUsers,
  LuPlus,
  LuPencil,
  LuTrash2,
  LuKey,
  LuX,
  LuSave,
  LuChevronDown,
  LuChevronUp,
  LuSearch,
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuChevronsUpDown,
  LuFilter,
} from "react-icons/lu";
import {
  CreateGroupFormSchema,
  UpdateGroupFormSchema,
  type CreateGroupFormValues,
  type UpdateGroupFormValues,
  type Group,
  type GroupUser,
  type Permission,
} from "@/api/groups/group.schema";
import {
  useGroups,
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  usePermissions,
  useSetGroupPermissions,
  useGroupUsers,
  useReassignGroupUsers,
} from "@/hooks/groups/group.hooks";
import { getPaginatedGroupsApi } from "@/api/groups/group.api";
import type { PaginationMeta } from "@/components/CustomDataTable";
import { useToast } from "@/hooks/utils/UseToast";
import { Toaster } from "@/components/ui/Toaster";

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type SortKey =
  | "group_name"
  | "user_count"
  | "permission_count"
  | "created_at"
  | "group_id";
type SortDir = "asc" | "desc";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; group: Group }
  | { type: "permissions"; group: Group }
  | { type: "delete"; group: Group }
  | { type: "reassign"; group: Group };

// ── Shared components ─────────────────────────────────────────────────────────

function ModalOverlay({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full border border-gray-200 dark:border-gray-700 ${wide ? "max-w-2xl" : "max-w-md"}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

const inputClass =
  "border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm w-full";

const submitBtnClass =
  "inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50";

// ── Pagination Button ─────────────────────────────────────────────────────────
function PagBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

// ── Sort toggle helper ────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <LuChevronsUpDown className="w-3 h-3 opacity-40" />;
  return dir === "asc" ? (
    <LuChevronUp className="w-3 h-3" />
  ) : (
    <LuChevronDown className="w-3 h-3" />
  );
}

// ── Group Card Skeleton ───────────────────────────────────────────────────────
function GroupCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col gap-3 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        </div>
        <div className="h-5 w-14 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20" />
      </div>
      <div className="pt-1 border-t border-gray-50 dark:border-gray-800 flex gap-2">
        <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-12" />
        <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-24" />
        <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-14 ml-auto" />
      </div>
    </div>
  );
}

// ── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { toasts, toast, dismiss } = useToast();
  const { mutate, isPending } = useCreateGroup();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGroupFormValues>({
    resolver: zodResolver(CreateGroupFormSchema),
  });

  const onSubmit = (values: CreateGroupFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Group Created",
          description: "New group has been added.",
        });
        reset();
        setTimeout(onClose, 1000);
      },
      onError: (err) => {
        toast({
          type: "error",
          title: "Failed",
          description: (err as Error)?.message ?? "Something went wrong.",
        });
      },
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormField label="Group Name" error={errors.group_name?.message}>
          <input {...register("group_name")} className={inputClass} />
        </FormField>
        <FormField
          label="Description"
          error={errors.group_description?.message}
        >
          <textarea
            {...register("group_description")}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </FormField>
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={isPending} className={submitBtnClass}>
            <LuSave className="text-sm" />
            {isPending ? "Creating…" : "Create Group"}
          </button>
        </div>
      </form>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Edit Group Modal ──────────────────────────────────────────────────────────

function EditGroupModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { toasts, toast, dismiss } = useToast();
  const { mutate, isPending } = useUpdateGroup(group.group_id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateGroupFormValues>({
    resolver: zodResolver(UpdateGroupFormSchema),
    defaultValues: {
      group_name: group.group_name,
      group_description: group.group_description,
      group_is_active: group.group_is_active === 1,
    },
  });

  const onSubmit = (values: UpdateGroupFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Group Updated",
          description: "Group details have been saved.",
        });
        setTimeout(onClose, 1000);
      },
      onError: (err) => {
        toast({
          type: "error",
          title: "Failed",
          description: (err as Error)?.message ?? "Something went wrong.",
        });
      },
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormField label="Group Name" error={errors.group_name?.message}>
          <input {...register("group_name")} className={inputClass} />
        </FormField>
        <FormField
          label="Description"
          error={errors.group_description?.message}
        >
          <textarea
            {...register("group_description")}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </FormField>
        <div className="flex items-center gap-2">
          <input
            {...register("group_is_active")}
            type="checkbox"
            id="group_is_active"
            className="w-4 h-4 accent-blue-600"
          />
          <label
            htmlFor="group_is_active"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Active
          </label>
        </div>
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={isPending} className={submitBtnClass}>
            <LuSave className="text-sm" />
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Permissions Modal ─────────────────────────────────────────────────────────

function PermissionsModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { toasts, toast, dismiss } = useToast();
  const { data: groupDetail, isLoading: loadingDetail } = useGroup(
    group.group_id,
  );
  const { data: allPermsData, isLoading: loadingPerms } = usePermissions();
  const { mutate, isPending } = useSetGroupPermissions(group.group_id);

  // Use an explicit initialized flag so toggling checkboxes to zero
  // doesn't accidentally re-seed from the server on the next render.
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (groupDetail && !initialized) {
      setSelected(
        new Set(groupDetail.data.permissions.map((p) => p.permission_id)),
      );
      setInitialized(true);
    }
  }, [groupDetail, initialized]);

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (groupName: string, perms: Permission[]) => {
    const allSelected = perms.every((p) => selected.has(p.permission_id));
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) =>
        allSelected ? next.delete(p.permission_id) : next.add(p.permission_id),
      );
      return next;
    });
  };

  const toggleExpand = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(groupName) ? next.delete(groupName) : next.add(groupName);
      return next;
    });
  };

  const handleSave = () => {
    mutate(
      { permission_ids: Array.from(selected) },
      {
        onSuccess: () => {
          toast({
            type: "success",
            title: "Permissions Saved",
            description: `Permissions updated for ${group.group_name}.`,
          });
          setTimeout(onClose, 1000);
        },
        onError: (err) => {
          toast({
            type: "error",
            title: "Failed",
            description: (err as Error)?.message ?? "Something went wrong.",
          });
        },
      },
    );
  };

  const isLoading = loadingDetail || loadingPerms;

  return (
    <>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Assign permissions for{" "}
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {group.group_name}
        </span>
        . Check a category header to toggle all permissions in that group.
      </p>
      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">
          Loading permissions…
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {Object.entries(allPermsData?.grouped ?? {}).map(
            ([groupName, perms]) => {
              const allSelected = perms.every((p) =>
                selected.has(p.permission_id),
              );
              const someSelected = perms.some((p) =>
                selected.has(p.permission_id),
              );
              const isExpanded = expandedGroups.has(groupName);
              return (
                <div
                  key={groupName}
                  className="border border-gray-100 dark:border-gray-800 rounded"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el)
                            el.indeterminate = !allSelected && someSelected;
                        }}
                        onChange={() => toggleGroup(groupName, perms)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        {groupName}
                      </span>
                      <span className="text-xs text-gray-400">
                        (
                        {
                          perms.filter((p) => selected.has(p.permission_id))
                            .length
                        }
                        /{perms.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExpand(groupName)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {isExpanded ? (
                        <LuChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <LuChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                      {perms.map((perm) => (
                        <label
                          key={perm.permission_id}
                          className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(perm.permission_id)}
                            onChange={() => toggle(perm.permission_id)}
                            className="w-4 h-4 accent-blue-600"
                          />
                          <div>
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                              {perm.permission_label}
                            </p>
                            <p className="text-xs text-gray-400 font-mono">
                              {perm.permission_key}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      )}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400">
          {selected.size} permission{selected.size !== 1 ? "s" : ""} selected
        </span>
        <button
          type="button"
          disabled={isPending || isLoading}
          onClick={handleSave}
          className={submitBtnClass}
        >
          <LuKey className="text-sm" />
          {isPending ? "Saving…" : "Save Permissions"}
        </button>
      </div>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Reassign Users Modal ──────────────────────────────────────────────────────
// Shows all active users in the group with an inline dropdown to pick a new group.

function ReassignUsersModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { toasts, toast, dismiss } = useToast();
  const { data: groupsData } = useGroups();
  const { data: usersData, isLoading } = useGroupUsers(group.group_id);
  const { mutate, isPending } = useReassignGroupUsers(group.group_id);

  // Per-user new_group_id selection, keyed by user_id
  const [assignments, setAssignments] = useState<Record<number, number>>({});

  const setAssignment = (userId: number, newGroupId: number) => {
    setAssignments((prev) => ({ ...prev, [userId]: newGroupId }));
  };

  const users: GroupUser[] = usersData?.data ?? [];

  // Other active groups to reassign to (exclude current group)
  const targetGroups =
    groupsData?.data.filter(
      (g) => g.group_id !== group.group_id && g.group_is_active === 1,
    ) ?? [];

  const allAssigned =
    users.length > 0 && users.every((u) => assignments[u.user_id]);

  const handleSave = () => {
    const payload = users
      .filter((u) => assignments[u.user_id])
      .map((u) => ({
        user_id: u.user_id,
        new_group_id: assignments[u.user_id],
      }));

    if (payload.length === 0) {
      toast({
        type: "error",
        title: "Nothing to save",
        description: "Assign a new group to at least one user.",
      });
      return;
    }

    mutate(
      { assignments: payload },
      {
        onSuccess: () => {
          toast({
            type: "success",
            title: "Users Reassigned",
            description: "All selected users have been moved.",
          });
          setTimeout(onClose, 1000);
        },
        onError: (err) => {
          toast({
            type: "error",
            title: "Failed",
            description: (err as Error)?.message ?? "Something went wrong.",
          });
        },
      },
    );
  };

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        The following active users are assigned to{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {group.group_name}
        </span>
        . Select a new group for each user before deactivating or deleting this
        group.
      </p>

      {isLoading ? (
        <div className="py-6 text-center text-sm text-gray-400">
          Loading users…
        </div>
      ) : users.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-400">
          No active users in this group.
        </div>
      ) : (
        <div className="border border-gray-100 dark:border-gray-800 rounded overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                  New Group
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((user) => (
                <tr
                  key={user.user_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                      {user.user_firstname} {user.user_lastname}
                    </p>
                    <p className="text-xs text-gray-400">
                      {user.user_username}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      value={assignments[user.user_id] ?? ""}
                      onChange={(e) =>
                        setAssignment(user.user_id, Number(e.target.value))
                      }
                      className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="" disabled>
                        Select group…
                      </option>
                      {targetGroups.map((g) => (
                        <option key={g.group_id} value={g.group_id}>
                          {g.group_name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!allAssigned && users.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
          Assign a new group to all users to proceed.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={submitBtnClass}>
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending || !allAssigned || users.length === 0}
          onClick={handleSave}
          className={`${submitBtnClass} border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40`}
        >
          {isPending ? "Saving…" : "Save & Reassign"}
        </button>
      </div>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteGroupModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { toasts, toast, dismiss } = useToast();
  const { mutate, isPending } = useDeleteGroup();

  const handleConfirm = () => {
    mutate(group.group_id, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Group Deleted",
          description: `${group.group_name} has been removed.`,
        });
        setTimeout(onClose, 1000);
      },
      onError: (err) => {
        toast({
          type: "error",
          title: "Failed",
          description: (err as Error)?.message ?? "Something went wrong.",
        });
      },
    });
  };

  return (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          {group.group_name}
        </span>
        ?
      </p>
      {group.user_count > 0 && (
        <p className="text-xs text-red-500 mb-4">
          This group has {group.user_count} active user
          {group.user_count !== 1 ? "s" : ""} assigned. Reassign them before
          deleting.
        </p>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onClose} className={submitBtnClass}>
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending || group.user_count > 0}
          onClick={handleConfirm}
          className={`${submitBtnClass} border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40`}
        >
          <LuTrash2 className="text-sm" />
          {isPending ? "Deleting…" : "Delete Group"}
        </button>
      </div>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const PER_PAGE_OPTIONS = [6, 12, 24];

export default function GroupsPage() {
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  // ── Toolbar state ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [sortKey, setSortKey] = useState<SortKey>("group_id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeFilter, setActiveFilter] = useState<"" | "1" | "0">("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Data state ────────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<Group[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    perPage: 12,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  // Reset to page 1 when search/sort/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortKey, sortDir, activeFilter, perPage]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPaginatedGroupsApi({
        page,
        perPage,
        search: debouncedSearch,
        sortKey,
        sortDir,
        filters: activeFilter !== "" ? { group_is_active: activeFilter } : {},
      });
      setGroups(result.data);
      setMeta(result.meta);
    } catch {
      setError("Failed to load groups. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, sortKey, sortDir, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Sort toggle ───────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // ── Pagination helpers ────────────────────────────────────────────────────
  const canPrev = page > 1;
  const canNext = page < meta.totalPages;
  const pageNumbers = Array.from({ length: meta.totalPages }, (_, i) => i + 1);
  const displayedPages = pageNumbers.filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1,
  );

  const closeModal = () => {
    setModal({ type: "none" });
    // Refresh after any mutation
    load();
  };

  const activeFilterCount = activeFilter !== "" ? 1 : 0;

  // ── Sort button component (inline) ────────────────────────────────────────
  const SortBtn = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      type="button"
      onClick={() => handleSort(k)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition font-medium ${
        sortKey === k
          ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700"
          : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
      }`}
    >
      {label}
      <SortIcon active={sortKey === k} dir={sortDir} />
    </button>
  );

  return (
    <div className="p-3 sm:p-4 flex flex-col min-h-screen dark:bg-gray-950">
      {/* ── Header ── */}
      <div className="flex items-center justify-between rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-4 py-3 sm:py-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shrink-0">
            <LuShield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Groups & Permissions
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 hidden sm:block">
              Manage access control groups and their permissions
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
        >
          <LuPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Group</span>
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-4 py-3 mb-1 flex flex-wrap items-center gap-2 justify-between">
        {/* Left: search + sort */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups…"
              className="pl-8 pr-8 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-48"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <LuX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-400 hidden sm:inline">
              Sort:
            </span>
            <SortBtn label="Name" k="group_name" />
            <SortBtn label="Users" k="user_count" />
            <SortBtn label="Permissions" k="permission_count" />
            <SortBtn label="Created" k="created_at" />
          </div>
        </div>

        {/* Right: filter + refresh + per-page + pagination */}
        <div className="flex items-center gap-1.5">
          {/* Active filter */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition font-medium ${
                activeFilterCount > 0
                  ? "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              <LuFilter className="w-3.5 h-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-0.5 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Status
                  </span>
                  <button
                    onClick={() => setFilterOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX className="w-4 h-4" />
                  </button>
                </div>
                {(["", "1", "0"] as const).map((val) => (
                  <label
                    key={val}
                    className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="radio"
                      name="group_is_active"
                      checked={activeFilter === val}
                      onChange={() => {
                        setActiveFilter(val);
                        setFilterOpen(false);
                      }}
                      className="accent-blue-600"
                    />
                    {val === ""
                      ? "All"
                      : val === "1"
                        ? "Active only"
                        : "Inactive only"}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50"
          >
            <LuRefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Per-page */}
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>

          {/* ── Inline pagination ── */}
          {meta.totalPages > 1 && (
            <div className="flex items-center gap-0.5 border-l border-gray-200 dark:border-gray-600 pl-2 ml-0.5">
              <PagBtn
                onClick={() => setPage(1)}
                disabled={page === 1}
                title="First page"
              >
                <LuChevronsLeft className="w-3.5 h-3.5" />
              </PagBtn>
              <PagBtn
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                title="Previous page"
              >
                <LuChevronLeft className="w-3.5 h-3.5" />
              </PagBtn>

              {/* Page counter pill */}
              <span className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg select-none min-w-16 text-center">
                {page} / {meta.totalPages}
              </span>

              <PagBtn
                onClick={() => setPage((p) => p + 1)}
                disabled={page === meta.totalPages}
                title="Next page"
              >
                <LuChevronRight className="w-3.5 h-3.5" />
              </PagBtn>
              <PagBtn
                onClick={() => setPage(meta.totalPages)}
                disabled={page === meta.totalPages}
                title="Last page"
              >
                <LuChevronsRight className="w-3.5 h-3.5" />
              </PagBtn>
            </div>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 mb-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          <LuX className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button
            onClick={load}
            className="ml-auto underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Card Grid ── */}
      <div className="flex-1">
        {loading && groups.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: perPage > 6 ? 6 : perPage }).map((_, i) => (
              <GroupCardSkeleton key={i} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center py-16 text-sm text-gray-400 gap-2">
            <LuSearch className="w-8 h-8 opacity-30" />
            <span>No groups found.</span>
            {(search || activeFilter !== "") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("");
                }}
                className="text-xs text-blue-500 hover:underline mt-1"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ${loading ? "opacity-60 pointer-events-none" : ""}`}
          >
            {groups.map((group) => (
              <div
                key={group.group_id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col gap-3 transition hover:shadow-md"
              >
                {/* Group name + active badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {group.group_name}
                    </h3>
                    {group.group_description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {group.group_description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      group.group_is_active
                        ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                    }`}
                  >
                    {group.group_is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {group.user_count}
                    </span>{" "}
                    user{group.user_count !== 1 ? "s" : ""}
                  </span>
                  <span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {group.permission_count}
                    </span>{" "}
                    permission{group.permission_count !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-1 border-t border-gray-50 dark:border-gray-800">
                  <button
                    type="button"
                    title="Edit group"
                    onClick={() => setModal({ type: "edit", group })}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    <LuPencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    title="Manage permissions"
                    onClick={() => setModal({ type: "permissions", group })}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                  >
                    <LuKey className="w-3 h-3" /> Permissions
                  </button>
                  {group.user_count > 0 && (
                    <button
                      type="button"
                      title="Reassign users"
                      onClick={() => setModal({ type: "reassign", group })}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                    >
                      <LuUsers className="w-3 h-3" /> Reassign
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete group"
                    onClick={() => setModal({ type: "delete", group })}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition ml-auto"
                  >
                    <LuTrash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination Footer ── */}
      {meta.totalPages > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded mt-1 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            {meta.total === 0
              ? "0 results"
              : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, meta.total)} of ${meta.total.toLocaleString()} group${meta.total !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-1">
            <PagBtn
              onClick={() => setPage(1)}
              disabled={!canPrev}
              title="First page"
            >
              <LuChevronsLeft className="w-3.5 h-3.5" />
            </PagBtn>
            <PagBtn
              onClick={() => setPage((p) => p - 1)}
              disabled={!canPrev}
              title="Previous page"
            >
              <LuChevronLeft className="w-3.5 h-3.5" />
            </PagBtn>

            {displayedPages.map((p, i, arr) => (
              <>
                {i > 0 && arr[i - 1] !== p - 1 && (
                  <span key={`ellipsis-${p}`} className="px-1.5 select-none">
                    …
                  </span>
                )}
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`min-w-7 h-7 px-2 rounded-lg text-xs font-medium transition ${
                    p === page
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              </>
            ))}

            <PagBtn
              onClick={() => setPage((p) => p + 1)}
              disabled={!canNext}
              title="Next page"
            >
              <LuChevronRight className="w-3.5 h-3.5" />
            </PagBtn>
            <PagBtn
              onClick={() => setPage(meta.totalPages)}
              disabled={!canNext}
              title="Last page"
            >
              <LuChevronsRight className="w-3.5 h-3.5" />
            </PagBtn>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal.type === "create" && (
        <ModalOverlay title="Add New Group" onClose={closeModal}>
          <CreateGroupModal onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "edit" && (
        <ModalOverlay title="Edit Group" onClose={closeModal}>
          <EditGroupModal group={modal.group} onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "permissions" && (
        <ModalOverlay title="Manage Permissions" onClose={closeModal} wide>
          <PermissionsModal group={modal.group} onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "reassign" && (
        <ModalOverlay title="Reassign Users" onClose={closeModal} wide>
          <ReassignUsersModal group={modal.group} onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "delete" && (
        <ModalOverlay title="Delete Group" onClose={closeModal}>
          <DeleteGroupModal group={modal.group} onClose={closeModal} />
        </ModalOverlay>
      )}
    </div>
  );
}
