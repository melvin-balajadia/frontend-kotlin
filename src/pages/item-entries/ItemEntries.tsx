import { useState, useRef, useEffect } from "react";
import { useItemEntries } from "@/hooks/items/itemEntries.hook";
import {
  LuArrowLeft,
  LuPackage,
  LuPenLine,
  LuRefreshCw,
  LuEllipsis,
  LuTrash2,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/config/queryKeys";

type DropdownItem = {
  items_id: number | string;
  [key: string]: unknown;
};

function ActionDropdown({ item }: { item: DropdownItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: "Edit",
      icon: <LuPenLine className="w-3.5 h-3.5" />,
      onClick: () => console.log("Edit", item.items_id),
    },
    {
      label: "Delete",
      icon: <LuTrash2 className="w-3.5 h-3.5" />,
      onClick: () => console.log("Delete", item.items_id),
      danger: true,
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
      >
        <LuEllipsis className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1">
          {menuItems.map((menuItem, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                menuItem.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors
                ${
                  menuItem.danger
                    ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
            >
              {menuItem.icon}
              {menuItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItemEntriesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: itemEntries = [], isLoading: itemLoading } = useItemEntries(
    id!,
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({
      queryKey: queryKeys.itemEntries.list(id),
    });
    setIsRefreshing(false);
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
              Item Entries
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5 hidden sm:block">
              Manage and track all item records
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

      <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded shadow border border-gray-200 dark:border-gray-700">
        {/* Table Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {!itemLoading && (
              <span>
                <span className="font-bold text-green-500">
                  {itemEntries.length}/32
                </span>{" "}
                record
                {itemEntries.length !== 1 ? "s" : ""} found
              </span>
            )}
          </p>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || itemLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuRefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </span>
          </button>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block w-full rounded border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                {[
                  "Stock/Batch Code",
                  "Production Code",
                  "Item PD",
                  "Item CU",
                  "Weight",
                  "Date Added",
                  "Action",
                ].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            {/* Desktop Table tbody */}
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {itemLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-gray-400"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : itemEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-gray-400"
                  >
                    No items found.
                  </td>
                </tr>
              ) : (
                itemEntries.map((item) => (
                  <tr
                    key={item.items_id}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {item.items_batch_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.items_production_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.items_pd}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.items_cu}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.items_weight}
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
        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {itemLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-400">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          ) : itemEntries.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">
              No handling units found.
            </div>
          ) : (
            itemEntries.map((item) => (
              <div
                key={item.items_id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {item.items_batch_code}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {item.items_batch_code}
                    </p>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/30 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <LuPenLine className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>
                    <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wide text-[10px] font-medium">
                      Pallet
                    </p>
                    <p className="mt-0.5 text-gray-700 dark:text-gray-300 font-medium">
                      {item.items_production_code}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
