// src/pages/users/UsersPage.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LuUsers,
  LuPlus,
  LuKeyRound,
  LuUserCheck,
  LuUserX,
  LuX,
  LuSave,
} from "react-icons/lu";
import {
  CreateUserFormSchema,
  UpdateUserFormSchema,
  ForceResetPasswordSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
  type ForceResetPasswordValues,
  type User,
} from "@/api/users/user.schema";
import {
  useCreateUser,
  useUpdateUser,
  useSetUserStatus,
  useForceResetPassword,
} from "@/hooks/users/user.hooks";
import { useGroups } from "@/hooks/groups/group.hooks";
import { useToast } from "@/hooks/utils/UseToast";
import { Toaster } from "@/components/ui/Toaster";
import { DataTable, type ColumnDef } from "@/components/CustomDataTable";
import { type UserRow } from "@/api/users/user.schema";
import { getPaginatedUsers } from "@/api/users/user.api";

// ── Column definitions ────────────────────────────────────────────────────────

const columns: ColumnDef<UserRow>[] = [
  {
    key: "user_username",
    label: "Username",
    sortable: true,
    filterable: true,
  },
  {
    key: "user_firstname",
    label: "First Name",
    sortable: true,
  },
  {
    key: "user_lastname",
    label: "Last Name",
    sortable: true,
  },
  {
    key: "group_name",
    label: "Group",
    sortable: false,
    render: (value) => (value ? String(value) : "—"),
  },
  {
    key: "user_site",
    label: "Site",
    filterable: true,
    render: (value) => (value ? String(value) : "—"),
  },
  {
    key: "user_status",
    label: "Status",
    sortable: true,
    render: (value) => {
      const status = value as "active" | "inactive";
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            status === "active"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {status === "active" ? "Active" : "Inactive"}
        </span>
      );
    },
  },
];

// ── Modal types ───────────────────────────────────────────────────────────────

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; user: User }
  | { type: "reset"; user: User }
  | { type: "status"; user: User };

// ── Shared UI primitives ──────────────────────────────────────────────────────

function ModalOverlay({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
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

// ── Create User Modal ─────────────────────────────────────────────────────────

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const { toasts, toast, dismiss } = useToast();
  const { data: groupsData } = useGroups();
  const { mutate, isPending } = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserFormSchema),
  });

  const onSubmit = (values: CreateUserFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "User Created",
          description: "New user account has been created.",
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" error={errors.user_firstname?.message}>
            <input {...register("user_firstname")} className={inputClass} />
          </FormField>
          <FormField label="Last Name" error={errors.user_lastname?.message}>
            <input {...register("user_lastname")} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Username" error={errors.user_username?.message}>
          <input
            {...register("user_username")}
            className={inputClass}
            autoComplete="off"
          />
        </FormField>

        <FormField label="Password" error={errors.user_password?.message}>
          <input
            {...register("user_password")}
            type="password"
            className={inputClass}
            autoComplete="new-password"
          />
        </FormField>

        <FormField label="Group" error={errors.user_groupid?.message}>
          <select
            {...register("user_groupid", { valueAsNumber: true })}
            className={inputClass}
            defaultValue=""
          >
            <option value="" disabled>
              Select a group
            </option>
            {groupsData?.data
              .filter((g) => g.group_is_active)
              .map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Site" error={errors.user_site?.message}>
            <input {...register("user_site")} className={inputClass} />
          </FormField>
          <FormField
            label="Department ID"
            error={errors.user_departmentid?.message}
          >
            <input
              {...register("user_departmentid", { valueAsNumber: true })}
              type="number"
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="flex justify-end mt-2">
          <button type="submit" disabled={isPending} className={submitBtnClass}>
            <LuSave className="text-sm" />
            {isPending ? "Creating…" : "Create User"}
          </button>
        </div>
      </form>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Edit User Modal ───────────────────────────────────────────────────────────

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { toasts, toast, dismiss } = useToast();
  const { data: groupsData } = useGroups();
  const { mutate, isPending } = useUpdateUser(user.user_id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(UpdateUserFormSchema),
    defaultValues: {
      user_firstname: user.user_firstname,
      user_lastname: user.user_lastname,
      user_groupid: user.user_groupid ?? undefined,
      user_departmentid: user.user_departmentid,
      user_site: user.user_site,
    },
  });

  const onSubmit = (values: UpdateUserFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "User Updated",
          description: "User details have been saved.",
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
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" error={errors.user_firstname?.message}>
            <input {...register("user_firstname")} className={inputClass} />
          </FormField>
          <FormField label="Last Name" error={errors.user_lastname?.message}>
            <input {...register("user_lastname")} className={inputClass} />
          </FormField>
        </div>

        <FormField label="Group" error={errors.user_groupid?.message}>
          <select
            {...register("user_groupid", { valueAsNumber: true })}
            className={inputClass}
          >
            {groupsData?.data
              .filter((g) => g.group_is_active)
              .map((g) => (
                <option key={g.group_id} value={g.group_id}>
                  {g.group_name}
                </option>
              ))}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Site" error={errors.user_site?.message}>
            <input {...register("user_site")} className={inputClass} />
          </FormField>
          <FormField
            label="Department ID"
            error={errors.user_departmentid?.message}
          >
            <input
              {...register("user_departmentid", { valueAsNumber: true })}
              type="number"
              className={inputClass}
            />
          </FormField>
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

// ── Force Reset Password Modal ────────────────────────────────────────────────

function ResetPasswordModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { toasts, toast, dismiss } = useToast();
  const { mutate, isPending } = useForceResetPassword(user.user_id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForceResetPasswordValues>({
    resolver: zodResolver(ForceResetPasswordSchema),
  });

  const onSubmit = (values: ForceResetPasswordValues) => {
    mutate(values, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Password Reset",
          description: "Temporary password has been set.",
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
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Setting a temporary password for{" "}
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {user.user_firstname} {user.user_lastname}
        </span>
        . They will be required to change it on next login.
      </p>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-4"
      >
        <FormField
          label="New Temporary Password"
          error={errors.new_password?.message}
        >
          <input
            {...register("new_password")}
            type="password"
            className={inputClass}
            autoComplete="new-password"
          />
        </FormField>
        <div className="flex justify-end mt-2">
          <button type="submit" disabled={isPending} className={submitBtnClass}>
            <LuKeyRound className="text-sm" />
            {isPending ? "Resetting…" : "Set Password"}
          </button>
        </div>
      </form>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Status Confirm Modal ──────────────────────────────────────────────────────

function StatusModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { toasts, toast, dismiss } = useToast();
  const { mutate, isPending } = useSetUserStatus(user.user_id);
  const next = user.user_status === "active" ? "inactive" : "active";

  const handleConfirm = () => {
    mutate(
      { status: next },
      {
        onSuccess: () => {
          toast({
            type: "success",
            title: next === "active" ? "User Activated" : "User Deactivated",
            description: `${user.user_firstname} ${user.user_lastname} has been ${next === "active" ? "activated" : "deactivated"}.`,
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
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Are you sure you want to{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {next === "active" ? "activate" : "deactivate"}
        </span>{" "}
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {user.user_firstname} {user.user_lastname}
        </span>
        ?
        {next === "inactive" && (
          <span className="block mt-1 text-xs text-red-500">
            They will immediately lose access to the system.
          </span>
        )}
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={submitBtnClass}>
          Cancel
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleConfirm}
          className={`${submitBtnClass} ${
            next === "inactive"
              ? "border-red-200 text-red-600 dark:border-red-800 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "border-green-200 text-green-600 dark:border-green-800 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
          }`}
        >
          {next === "active" ? (
            <LuUserCheck className="text-sm" />
          ) : (
            <LuUserX className="text-sm" />
          )}
          {isPending
            ? "Processing…"
            : next === "active"
              ? "Activate"
              : "Deactivate"}
        </button>
      </div>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [modal, setModal] = useState<ModalState>({ type: "none" });

  const closeModal = () => setModal({ type: "none" });

  // Cast UserRow → User for modals (schemas are identical shapes)
  const toUser = (row: UserRow): User => row as unknown as User;

  return (
    <div className="p-3 sm:p-4 flex flex-col min-h-screen dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-sm px-4 py-3 sm:py-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
            <LuUsers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              User Management
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 hidden sm:block">
              Create and manage system user accounts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModal({ type: "create" })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
        >
          <LuPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add User</span>
        </button>
      </div>

      {/* DataTable */}
      <DataTable<UserRow>
        columns={columns}
        fetchData={getPaginatedUsers}
        rowKey="user_id"
        exportable
        perPageOptions={[10, 25, 50]}
        searchDebounce={400}
        emptyMessage="No users found."
        onEdit={(row) => setModal({ type: "edit", user: toUser(row) })}
        extraActions={(row) => (
          <>
            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
            {/* Reset password */}
            <button
              type="button"
              onClick={() => setModal({ type: "reset", user: toUser(row) })}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <LuKeyRound className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              Reset Password
            </button>
            {/* Activate / Deactivate */}
            <button
              type="button"
              onClick={() => setModal({ type: "status", user: toUser(row) })}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs transition ${
                row.user_status === "active"
                  ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
              }`}
            >
              {row.user_status === "active" ? (
                <LuUserX className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <LuUserCheck className="w-3.5 h-3.5 shrink-0" />
              )}
              {row.user_status === "active" ? "Deactivate" : "Activate"}
            </button>
          </>
        )}
      />

      {/* Modals */}
      {modal.type === "create" && (
        <ModalOverlay title="Add New User" onClose={closeModal}>
          <CreateUserModal onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "edit" && (
        <ModalOverlay title="Edit User" onClose={closeModal}>
          <EditUserModal user={modal.user} onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "reset" && (
        <ModalOverlay title="Reset Password" onClose={closeModal}>
          <ResetPasswordModal user={modal.user} onClose={closeModal} />
        </ModalOverlay>
      )}
      {modal.type === "status" && (
        <ModalOverlay title="Change User Status" onClose={closeModal}>
          <StatusModal user={modal.user} onClose={closeModal} />
        </ModalOverlay>
      )}
    </div>
  );
}
