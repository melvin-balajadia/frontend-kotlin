// src/pages/EditTransactionEntries.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LuArrowLeft,
  LuCheck,
  LuClock,
  LuEllipsis,
  LuPackage,
  LuPackage2,
  LuPenLine,
  LuPlus,
  LuSave,
  LuSaveAll,
  LuTimer,
  LuTrash2,
  LuUndo2,
  LuX,
} from "react-icons/lu";
import {
  TransactionEntryFormSchema,
  type TransactionEntryFormValues,
} from "@/api/transactions/transactionEntries.schema";
import { type ApprovalLog } from "@/api/transactions/transactionApproval.schema";
import { useTransactionEntry } from "@/hooks/transactions/transactionEntries.hooks";
import { useUpdateTransactionEntry } from "@/hooks/transactions/updateTransaction";
import { useHuEntries } from "@/hooks/hu/huEntries.hooks";
import {
  useApprovalLogs,
  useSubmitTransaction,
  useApproveTransaction,
  useRejectTransaction,
  useReturnTransaction,
} from "@/hooks/transactions/approvalTransaction";
import { AddHuModal } from "@/components/hu/AddHUModal";
import { Toaster } from "@/components/ui/Toaster";
import { useToast } from "@/hooks/utils/UseToast";

// ── Field definitions ────────────────────────────────────────────────────────

const GENERAL_FIELDS = [
  { label: "IDN No./WIL No.", name: "transaction_idn", type: "text" },
  {
    label: "Transaction Type",
    name: "transaction_transaction_type",
    type: "text",
  },
  { label: "Client Name", name: "transaction_client", type: "text" },
  { label: "Plate Number", name: "transaction_trucking_pn", type: "text" },
  { label: "Transaction Date", name: "transaction_date", type: "date" },
] as const;

const SCHEDULE_FIELDS = [
  { label: "Start Date", name: "transaction_start_date", type: "date" },
  { label: "End Date", name: "transaction_end_date", type: "date" },
] as const;

const TIME_FIELDS = [
  { label: "Start Time", name: "transaction_start_time", type: "time" },
  { label: "End Time", name: "transaction_end_time", type: "time" },
] as const;

type DropdownItem = { hu_id: number | string; [key: string]: unknown };

// ── Approval action modal ─────────────────────────────────────────────────────
// Shared modal for Reject and Return — shows an optional comment field.

type ActionModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: string;
  isPending: boolean;
  onConfirm: (comment?: string) => void;
  onClose: () => void;
};

function ActionModal({
  title,
  description,
  confirmLabel,
  confirmClass,
  isPending,
  onConfirm,
  onClose,
}: ActionModalProps) {
  const [comment, setComment] = useState("");

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
            className="text-gray-400 hover:text-gray-600"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Comment{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a reason or note…"
              className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none transition text-sm resize-none w-full"
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => onConfirm(comment.trim() || undefined)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition disabled:opacity-50 ${confirmClass}`}
            >
              {isPending ? "Processing…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Approval Timeline ─────────────────────────────────────────────────────────

type ApprovalStep = {
  label: string;
  status: "completed" | "current" | "pending" | "rejected";
  date?: string;
  actor?: string;
  comment?: string;
};

function ApprovalTimeline({
  transactionStatus,
  logs,
}: {
  transactionStatus: number;
  logs: ApprovalLog[];
}) {
  // Build a lookup: toStatus → the log entry for that step
  const logByToStatus = logs.reduce<Record<number, ApprovalLog>>((acc, log) => {
    acc[log.log_to_status] = log;
    return acc;
  }, {});

  // Find the last rejection/return log if status is 5 or 6
  const terminalLog =
    transactionStatus === 5 || transactionStatus === 6
      ? [...logs]
          .reverse()
          .find((l) => l.log_action === "reject" || l.log_action === "return")
      : undefined;

  const getStepStatus = (stepIndex: number): ApprovalStep["status"] => {
    const isTerminal = transactionStatus === 5 || transactionStatus === 6;

    if (isTerminal) {
      const rejectedAtStatus = terminalLog?.log_from_status ?? 1;
      const rejectedAtStep = rejectedAtStatus; // status == step index here
      if (stepIndex < rejectedAtStep) return "completed";
      if (stepIndex === rejectedAtStep) return "rejected";
      return "pending";
    }

    if (transactionStatus === 0) return stepIndex === 0 ? "current" : "pending";
    if (transactionStatus === 4) return "completed";
    if (stepIndex < transactionStatus) return "completed";
    if (stepIndex === transactionStatus) return "current";
    return "pending";
  };

  const STEP_DEFINITIONS = [
    { label: "Draft", toStatus: 0 },
    { label: "Submitted", toStatus: 1 },
    { label: "Checked by", toStatus: 2 },
    { label: "Noted by", toStatus: 3 },
    { label: "Completed", toStatus: 4 },
  ];

  const steps: ApprovalStep[] = STEP_DEFINITIONS.map((def, idx) => {
    const log = logByToStatus[def.toStatus];
    return {
      label: def.label,
      status: getStepStatus(idx),
      date: log
        ? new Date(log.log_created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : undefined,
      actor: log?.log_actor_name,
      comment: log?.log_comment ?? undefined,
    };
  });

  const statusConfig = {
    completed: {
      dot: "bg-green-500 border-green-500",
      icon: <LuCheck className="w-3 h-3 text-white" />,
      label: "text-green-600 dark:text-green-400",
      line: "bg-green-400",
    },
    current: {
      dot: "bg-blue-500 border-blue-500 animate-pulse",
      icon: <LuClock className="w-3 h-3 text-white" />,
      label: "text-blue-600 dark:text-blue-400 font-semibold",
      line: "bg-gray-200 dark:bg-gray-700",
    },
    pending: {
      dot: "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
      icon: null,
      label: "text-gray-400 dark:text-gray-500",
      line: "bg-gray-200 dark:bg-gray-700",
    },
    rejected: {
      dot: "bg-red-500 border-red-500",
      icon: <LuX className="w-3 h-3 text-white" />,
      label: "text-red-500 dark:text-red-400 font-semibold",
      line: "bg-gray-200 dark:bg-gray-700",
    },
  };

  const statusBadge: Record<number, { label: string; className: string }> = {
    0: {
      label: "Draft",
      className:
        "bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700",
    },
    1: {
      label: "Pending — Checked by",
      className:
        "bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800",
    },
    2: {
      label: "Pending — Noted by",
      className:
        "bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800",
    },
    3: {
      label: "Pending — Completion",
      className:
        "bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200 dark:border-blue-800",
    },
    4: {
      label: "Completed",
      className:
        "bg-green-50 dark:bg-green-900/30 text-green-600 border border-green-200 dark:border-green-800",
    },
    5: {
      label: "Rejected",
      className:
        "bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800",
    },
    6: {
      label: "Returned",
      className:
        "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 border border-yellow-200 dark:border-yellow-800",
    },
  };

  const badge = statusBadge[transactionStatus] ?? statusBadge[0];

  // Show rejection/return banner if terminal
  const showBanner = transactionStatus === 5 || transactionStatus === 6;

  return (
    <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-sm">
          <LuTimer className="text-blue-500 w-4 h-4" />
          <span>Approval Status</span>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Rejection/Return banner */}
      {showBanner && terminalLog && (
        <div
          className={`mb-4 rounded-lg px-3 py-2.5 text-xs border ${
            transactionStatus === 5
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400"
          }`}
        >
          <span className="font-semibold">{terminalLog.log_actor_name}</span>{" "}
          {transactionStatus === 5 ? "rejected" : "returned"} this transaction
          {terminalLog.log_comment && (
            <span className="block mt-1 italic">
              "{terminalLog.log_comment}"
            </span>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const cfg = statusConfig[step.status];
          const isLast = idx === steps.length - 1;

          return (
            <div
              key={step.label}
              className="flex items-start flex-1 last:flex-none"
            >
              {/* Step dot + label + meta */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${cfg.dot}`}
                >
                  {cfg.icon}
                </div>
                <span className={`text-xs whitespace-nowrap ${cfg.label}`}>
                  {step.label}
                </span>
                {step.actor && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {step.actor}
                  </span>
                )}
                {step.date && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {step.date}
                  </span>
                )}
              </div>

              {/* Connector */}
              {!isLast && (
                <div className={`h-0.5 flex-1 mx-2 mt-3.5 ${cfg.line}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Action Dropdown ───────────────────────────────────────────────────────────

function ActionDropdown({ item }: { item: DropdownItem }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: "Edit",
      icon: <LuPenLine className="w-3.5 h-3.5" />,
      onClick: () =>
        navigate(`/transaction-entries/item-entries/${item.hu_id}`),
    },
    {
      label: "Delete",
      icon: <LuTrash2 className="w-3.5 h-3.5" />,
      onClick: () => console.log("Delete", item.hu_id),
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <LuEllipsis className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                item.danger
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type ActiveModal = "none" | "reject" | "return";

export default function EditTransactionEntries() {
  const [isAddHuOpen, setIsAddHuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: huEntries = [], isLoading: huLoading } = useHuEntries(id!);
  const { data: logsData = [] } = useApprovalLogs(id!);

  const {
    data: transactionEntriesData,
    isLoading: transactionEntriesLoading,
    isError: transactionEntriesError,
  } = useTransactionEntry(id!);

  const {
    mutate: updateMutate,
    isPending,
    isError: isMutateError,
    error,
  } = useUpdateTransactionEntry(id!);

  const { mutate: submitMutate, isPending: isSubmitting } =
    useSubmitTransaction(id!);
  const { mutate: approveMutate, isPending: isApproving } =
    useApproveTransaction(id!);
  const { mutate: rejectMutate, isPending: isRejecting } = useRejectTransaction(
    id!,
  );
  const { mutate: returnMutate, isPending: isReturning } = useReturnTransaction(
    id!,
  );

  const { toasts, toast, dismiss } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TransactionEntryFormValues>({
    resolver: zodResolver(TransactionEntryFormSchema),
  });

  useEffect(() => {
    if (!transactionEntriesData) return;
    reset({
      transaction_idn: transactionEntriesData.transaction_idn,
      transaction_transaction_type:
        transactionEntriesData.transaction_transaction_type,
      transaction_client: transactionEntriesData.transaction_client,
      transaction_trucking_pn: transactionEntriesData.transaction_trucking_pn,
      transaction_date: transactionEntriesData.transaction_date ?? "",
      transaction_start_date:
        transactionEntriesData.transaction_start_date ?? "",
      transaction_end_date: transactionEntriesData.transaction_end_date ?? "",
      transaction_start_time:
        transactionEntriesData.transaction_start_time ?? "",
      transaction_end_time: transactionEntriesData.transaction_end_time ?? "",
      transaction_description:
        transactionEntriesData.transaction_description ?? "",
    });
  }, [transactionEntriesData, reset]);

  // ── Form submit (Submit for Approval) ──
  const onSubmit = (values: TransactionEntryFormValues) => {
    updateMutate(
      { ...values, is_draft: false },
      {
        onSuccess: () => {
          // After saving fields, submit for approval
          submitMutate(undefined, {
            onSuccess: () => {
              toast({
                type: "success",
                title: "Submitted for Approval",
                description: "Transaction has been submitted.",
              });
              navigate(-1);
            },
            onError: (err) => {
              toast({
                type: "error",
                title: "Submit Failed",
                description: (err as Error)?.message ?? "Something went wrong.",
              });
            },
          });
        },
        onError: (err) => {
          toast({
            type: "error",
            title: "Failed to Save",
            description: (err as Error)?.message ?? "Something went wrong.",
          });
        },
      },
    );
  };

  // ── Save Draft ──
  const onSaveDraft = () => {
    const values = getValues();
    updateMutate(
      { ...values, is_draft: true },
      {
        onSuccess: () => {
          toast({
            type: "success",
            title: "Saved as Draft",
            description: "Transaction entry has been saved as draft.",
          });
        },
        onError: (err) => {
          toast({
            type: "error",
            title: "Failed to Save",
            description: (err as Error)?.message ?? "Something went wrong.",
          });
        },
      },
    );
  };

  // ── Approve ──
  const handleApprove = () => {
    approveMutate(undefined, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Approved",
          description: "Transaction has been approved and advanced.",
        });
        navigate(-1);
      },
      onError: (err) => {
        toast({
          type: "error",
          title: "Approval Failed",
          description: (err as Error)?.message ?? "Something went wrong.",
        });
      },
    });
  };

  // ── Reject ──
  const handleReject = (comment?: string) => {
    rejectMutate(comment, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Rejected",
          description: "Transaction has been rejected.",
        });
        setActiveModal("none");
        navigate(-1);
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

  // ── Return ──
  const handleReturn = (comment?: string) => {
    returnMutate(comment, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Returned",
          description: "Transaction has been returned to the creator.",
        });
        setActiveModal("none");
        navigate(-1);
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

  // ── Loading state ──
  if (transactionEntriesLoading) {
    return (
      <div className="p-3 sm:p-4 flex flex-col min-h-screen dark:bg-gray-950">
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading transaction…</span>
          </div>
        </div>
      </div>
    );
  }

  if (transactionEntriesError || !transactionEntriesData) {
    return (
      <div className="p-3 sm:p-4 flex flex-col min-h-screen dark:bg-gray-950">
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-3 text-red-400">
            <span className="text-sm">
              Failed to load transaction. Please try again.
            </span>
            <button
              onClick={() => navigate(-1)}
              className="text-xs text-blue-500 underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const txStatus = transactionEntriesData.transaction_status ?? 0;
  const isApprovalView = txStatus === 1 || txStatus === 2 || txStatus === 3;

  // Editable when Draft or Returned
  const isEditable = txStatus === 0 || txStatus === 6;

  return (
    <div className="p-3 sm:p-4 flex flex-col min-h-screen dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm px-4 py-3 sm:py-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shrink-0">
            <LuPackage className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Transaction Entries
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 hidden sm:block">
              Manage and track all transaction records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile approval quick-actions */}
          {isApprovalView && (
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-green-300 dark:border-green-700 text-green-600 bg-white dark:bg-gray-700 hover:bg-green-50 transition font-medium disabled:opacity-50"
              >
                <LuCheck className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveModal("reject")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-red-300 dark:border-red-700 text-red-600 bg-white dark:bg-gray-700 hover:bg-red-50 transition font-medium"
              >
                <LuX className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
          >
            <LuArrowLeft className="w-3.5 h-3.5" />
            <span className="text-sm font-medium hidden xs:inline sm:inline">
              Go Back
            </span>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded shadow border border-gray-200 dark:border-gray-700">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-white dark:bg-gray-900 mx-2 sm:mx-6 my-2"
        >
          {/* General Info */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            General Info
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {GENERAL_FIELDS.map(({ label, name, type }) => (
              <div key={name} className="flex flex-col gap-1">
                <label
                  htmlFor={name}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  {...register(name)}
                  disabled={!isEditable}
                  className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {errors[name] && (
                  <span className="text-xs text-red-500">
                    {errors[name]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 my-5" />

          {/* Schedule */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Schedule
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {SCHEDULE_FIELDS.map(({ label, name, type }) => (
              <div key={name} className="flex flex-col gap-1">
                <label
                  htmlFor={name}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  {...register(name)}
                  disabled={!isEditable}
                  className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {errors[name] && (
                  <span className="text-xs text-red-500">
                    {errors[name]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 my-5" />

          {/* Time */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Time
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {TIME_FIELDS.map(({ label, name, type }) => (
              <div key={name} className="flex flex-col gap-1">
                <label
                  htmlFor={name}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {label}
                </label>
                <input
                  id={name}
                  type={type}
                  {...register(name)}
                  disabled={!isEditable}
                  className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {errors[name] && (
                  <span className="text-xs text-red-500">
                    {errors[name]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 my-5" />

          {/* Notes */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Notes
          </p>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="transaction_description"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="transaction_description"
              rows={4}
              {...register("transaction_description")}
              disabled={!isEditable}
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 outline-none transition text-sm resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Handling Units */}
          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200 font-semibold text-sm sm:text-base">
                <LuPackage2 className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
                <span>Handling Unit</span>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => setIsAddHuOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
                >
                  <LuPlus className="w-3.5 h-3.5" />
                  Add HU
                </button>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block w-full rounded border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <tr>
                    {[
                      "HU Number",
                      "Batch Code",
                      "Pallet No.",
                      "Item Count",
                      "Date",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 font-semibold tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {huLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-gray-400"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : huEntries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-gray-400"
                      >
                        No handling units found.
                      </td>
                    </tr>
                  ) : (
                    huEntries.map((item) => (
                      <tr
                        key={item.hu_id}
                        className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          {item.hu_number}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {item.hu_batch_code}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.hu_palletnumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                            0/32
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <ActionDropdown item={item} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval Timeline */}
          <ApprovalTimeline transactionStatus={txStatus} logs={logsData} />

          {/* API error */}
          {isMutateError && (
            <p className="mt-3 text-sm text-red-500">
              {(error as Error)?.message ??
                "Something went wrong. Please try again."}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            {isApprovalView ? (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal("return")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 transition font-medium"
                >
                  <LuUndo2 className="text-sm" />
                  <span>Return</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal("reject")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 transition font-medium"
                >
                  <LuX className="text-sm" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-white dark:bg-gray-700 hover:bg-green-50 transition font-medium disabled:opacity-50"
                >
                  <LuCheck className="text-sm" />
                  <span>{isApproving ? "Approving…" : "Approve"}</span>
                </button>
              </div>
            ) : isEditable ? (
              <>
                <button
                  type="button"
                  onClick={onSaveDraft}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 transition font-medium disabled:opacity-50"
                >
                  <LuSave className="text-sm" />
                  <span>{isPending ? "Saving..." : "Save as Draft"}</span>
                </button>
                <button
                  type="submit"
                  disabled={isPending || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 hover:bg-blue-50 transition font-medium disabled:opacity-50"
                >
                  <LuSaveAll className="text-sm" />
                  <span>
                    {isPending || isSubmitting
                      ? "Submitting..."
                      : "Submit For Approval"}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </form>
      </div>

      {/* Add HU Modal */}
      {isAddHuOpen && (
        <AddHuModal
          toast={toast}
          huId={id!}
          onClose={() => setIsAddHuOpen(false)}
        />
      )}

      {/* Reject Modal */}
      {activeModal === "reject" && (
        <ActionModal
          title="Reject Transaction"
          description="This will permanently reject the transaction. The creator will not be able to re-submit it."
          confirmLabel="Reject"
          confirmClass="border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50"
          isPending={isRejecting}
          onConfirm={handleReject}
          onClose={() => setActiveModal("none")}
        />
      )}

      {/* Return Modal */}
      {activeModal === "return" && (
        <ActionModal
          title="Return Transaction"
          description="This will return the transaction to the creator for revision. They can edit and re-submit."
          confirmLabel="Return"
          confirmClass="border border-yellow-300 dark:border-yellow-700 text-yellow-600 dark:text-yellow-400 bg-white dark:bg-gray-700 hover:bg-yellow-50"
          isPending={isReturning}
          onConfirm={handleReturn}
          onClose={() => setActiveModal("none")}
        />
      )}

      <Toaster toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
