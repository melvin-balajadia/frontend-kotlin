// src/pages/AddTransactionEntries.tsx
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuArrowLeft, LuPackage, LuSave } from "react-icons/lu";
import {
  TransactionEntryFormSchema,
  type TransactionEntryFormValues,
} from "@/api/transactions/transactionEntries.schema";
import { useCreateTransactionEntry } from "@/hooks/transactions/createTransaction";
import { useToast } from "@/hooks/utils/UseToast";
import { Toaster } from "@/components/ui/Toaster";

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

export default function AddTransactionEntries() {
  const navigate = useNavigate();
  const { toasts, toast, dismiss } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionEntryFormValues>({
    resolver: zodResolver(TransactionEntryFormSchema),
  });

  const { mutate, isPending, isError, error } = useCreateTransactionEntry();

  const onSubmit = (values: TransactionEntryFormValues) => {
    mutate(values, {
      onSuccess: () => {
        toast({
          type: "success",
          title: "Transaction Added",
          description: "Transaction entry has been created successfully.",
        });
        reset();
      },
      onError: (err) => {
        toast({
          type: "error",
          title: "Failed to Add Transaction",
          description:
            (err as Error)?.message ??
            "Something went wrong. Please try again.",
        });
      },
    });
  };

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

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50"
        >
          <LuArrowLeft className="w-3.5 h-3.5" />
          <span className="text-sm font-medium hidden xs:inline sm:inline">
            Go Back
          </span>
        </button>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded shadow border border-gray-200 dark:border-gray-700">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="bg-white mx-2 sm:mx-6 my-2"
        >
          {/* General Info */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            General Info
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {GENERAL_FIELDS.filter(({ name }) =>
              [
                "transaction_idn",
                "transaction_transaction_type",
                "transaction_client",
                "transaction_trucking_pn",
                "transaction_date",
              ].includes(name),
            ).map(({ label, name, type }) => (
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
                  className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                />
                {errors[name] && (
                  <span className="text-xs text-red-500">
                    {errors[name]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800 my-5" />

          {/* Schedule */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Schedule
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {SCHEDULE_FIELDS.filter(({ name }) =>
              ["transaction_start_date", "transaction_end_date"].includes(name),
            ).map(({ label, name, type }) => (
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
                  className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                />
                {errors[name] && (
                  <span className="text-xs text-red-500">
                    {errors[name]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800 my-5" />

          {/* Time */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
            Time
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-800 dark:text-gray-200">
            {TIME_FIELDS.filter(({ name }) =>
              ["transaction_start_time", "transaction_end_time"].includes(name),
            ).map(({ label, name, type }) => (
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
                  className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                />
                {errors[name] && (
                  <span className="text-xs text-red-500">
                    {errors[name]?.message}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-gray-800 my-5" />

          {/* Description */}
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
              className="w-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm resize-none"
            />
          </div>

          {/* API error */}
          {isError && (
            <p className="mt-3 text-sm text-red-500">
              {(error as Error)?.message ??
                "Something went wrong. Please try again."}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
            >
              <LuSave className="text-sm" />
              <span>{isPending ? "Saving…" : "Submit Transaction"}</span>
            </button>
          </div>
        </form>
      </div>
      <Toaster toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
