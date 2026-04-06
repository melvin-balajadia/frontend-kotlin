// src/components/hu/AddHuModal.tsx
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LuX, LuSave } from "react-icons/lu";
import {
  HuEntryFormSchema,
  type HuEntryFormValues,
} from "@/api/hu/huEntries.schema";
import { useCreateHuEntry } from "@/hooks/hu/huEntries.hooks";
import { useToast } from "@/hooks/utils/UseToast";

interface AddHuModalProps {
  onClose: () => void;
  huId: string | number;
  toast: ReturnType<typeof useToast>["toast"];
}

export function AddHuModal({ onClose, huId, toast }: AddHuModalProps) {
  const { mutate, isPending } = useCreateHuEntry(huId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HuEntryFormValues>({
    resolver: zodResolver(HuEntryFormSchema) as Resolver<HuEntryFormValues>,
    defaultValues: {
      hu_number: "",
      hu_palletnumber: "",
      hu_status: 0,
      hu_transaction_id: huId,
    },
  });

  const onSubmit = (values: HuEntryFormValues) => {
    mutate(values, {
      onSuccess: () => {
        reset();
        toast({
          type: "success",
          title: "Handling Unit Added",
          description: `${values.hu_number} has been created successfully.`,
        });
        onClose();
      },
      onError: (err) => {
        toast({
          type: "error",
          title: "Failed to Add HU",
          description: (err as Error)?.message ?? "Something went wrong.",
        });
      },
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Add Handling Unit
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <form
            onSubmit={handleSubmit(onSubmit, (errs) =>
              console.log("Validation errors:", errs),
            )}
            noValidate
            className="p-5 flex flex-col gap-4"
          >
            {/* HU Number */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="hu_number"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                HU Number
              </label>
              <input
                id="hu_number"
                type="text"
                {...register("hu_number")}
                placeholder="e.g. HU00055"
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
              />
              {errors.hu_number && (
                <span className="text-xs text-red-500">
                  {errors.hu_number.message}
                </span>
              )}
            </div>

            {/* Pallet Number */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="hu_palletnumber"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Pallet No.
              </label>
              <input
                id="hu_palletnumber"
                type="text"
                {...register("hu_palletnumber")}
                placeholder="e.g. PALLET004"
                className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
              />
              {errors.hu_palletnumber && (
                <span className="text-xs text-red-500">
                  {errors.hu_palletnumber.message}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition"
              >
                <LuSave className="w-3.5 h-3.5" />
                {isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast portal — renders above everything */}
    </>
  );
}
