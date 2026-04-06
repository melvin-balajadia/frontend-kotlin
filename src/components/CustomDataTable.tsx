"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  LuPenLine,
  LuTrash2,
  LuSearch,
  LuChevronUp,
  LuChevronDown,
  LuChevronsUpDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
  LuRefreshCw,
  LuDownload,
  LuFilter,
  LuX,
  LuEye,
  LuColumns4,
  LuCheck,
  LuEllipsis,
} from "react-icons/lu";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  hidden?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface FetchParams {
  page: number;
  perPage: number;
  search: string;
  sortKey: string | null;
  sortDir: SortDirection;
  filters: Record<string, string>;
}

export interface DataTableProps<T extends { [key: string]: unknown }> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Async function to load data from backend */
  fetchData: (
    params: FetchParams,
  ) => Promise<{ data: T[]; meta: PaginationMeta }>;
  /** Row key field */
  rowKey: keyof T;
  /** Called when edit is clicked */
  onEdit?: (row: T) => void;
  /** Called when delete is clicked */
  onDelete?: (row: T) => void;
  /** Called when view is clicked */
  onView?: (row: T) => void;
  /** Extra row actions */
  extraActions?: (row: T) => React.ReactNode;
  /** Enable multi-row selection */
  selectable?: boolean;
  /** Called with selected rows when selection changes */
  onSelectionChange?: (rows: T[]) => void;
  /** Enable CSV export */
  exportable?: boolean;
  /** Table caption / heading */
  title?: string;
  /** Default rows per page options */
  perPageOptions?: number[];
  /** Debounce ms for search */
  searchDebounce?: number;
  /** Empty state message */
  emptyMessage?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function get<T>(obj: T, path: string): unknown {
  return (path as string).split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object")
      return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: ColumnDef<T>[],
  filename: string,
) {
  const visibleCols = columns.filter((c) => !c.hidden);
  const header = visibleCols.map((c) => `"${c.label}"`).join(",");
  const csvRows = rows.map((row) =>
    visibleCols
      .map((c) => {
        const val = get(row, c.key as string);
        return `"${String(val ?? "").replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  const csv = [header, ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === "asc") return <LuChevronUp className="w-3.5 h-3.5" />;
  if (direction === "desc") return <LuChevronDown className="w-3.5 h-3.5" />;
  return <LuChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
}

// ─── Row Actions Dropdown ─────────────────────────────────────────────────────

function RowActionsDropdown<T>({
  row,
  onView,
  onEdit,
  onDelete,
  extraActions,
}: {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Row actions"
        className={`p-1.5 rounded-lg transition text-base
          ${
            open
              ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          }`}
      >
        <LuEllipsis className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1 w-40 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl py-1 overflow-hidden"
          style={{ top: "100%" }}
        >
          {onView && (
            <button
              type="button"
              onClick={() => {
                onView(row);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <LuEye className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              View
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(row);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <LuPenLine className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              Edit
            </button>
          )}
          {onDelete && (
            <>
              {(onView || onEdit) && (
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              )}
              <button
                type="button"
                onClick={() => {
                  onDelete(row);
                  setOpen(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LuTrash2 className="w-3.5 h-3.5 shrink-0" />
                Delete
              </button>
            </>
          )}
          {extraActions?.(row)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DataTable<T extends { [key: string]: unknown }>({
  columns: initialColumns,
  fetchData,
  rowKey,
  onEdit,
  onDelete,
  onView,
  extraActions,
  selectable = false,
  onSelectionChange,
  exportable = false,
  title,
  perPageOptions = [10, 25, 50, 100],
  searchDebounce = 350,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  // ── State ──
  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    perPage: perPageOptions[0],
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, searchDebounce);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(perPageOptions[0]);

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<Record<string, string>>(
    {},
  );

  const [selected, setSelected] = useState<Set<unknown>>(new Set());
  const [columns, setColumns] = useState(initialColumns);
  const [colPickerOpen, setColPickerOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch ──
  const load = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData({
        page,
        perPage,
        search: debouncedSearch,
        sortKey,
        sortDir,
        filters,
      });
      setRows(result.data);
      setMeta(result.meta);
      setSelected(new Set()); // clear selection on refetch
    } catch (e: unknown) {
      if ((e as { name?: string })?.name !== "AbortError")
        setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, debouncedSearch, sortKey, sortDir, filters, fetchData]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 on search/filter change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, perPage]);

  // ── Sort ──
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") setSortDir("desc");
    else {
      setSortKey(null);
      setSortDir(null);
    }
    setPage(1);
  };

  // ── Selection ──
  const toggleRow = (id: unknown) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    onSelectionChange?.(rows.filter((r) => next.has(r[rowKey])));
  };

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set());
      onSelectionChange?.([]);
    } else {
      const next = new Set(rows.map((r) => r[rowKey]));
      setSelected(next);
      onSelectionChange?.(rows);
    }
  };

  // ── Column visibility ──
  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c)),
    );
  };

  // ── Filter apply ──
  const applyFilters = () => {
    setFilters(pendingFilters);
    setFilterOpen(false);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPendingFilters({});
    setFilterOpen(false);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const visibleColumns = columns.filter((c) => !c.hidden);
  const hasActions = onEdit || onDelete || onView || extraActions;
  const filterableColumns = columns.filter((c) => c.filterable);

  // ── Pagination helpers ──
  const canPrev = page > 1;
  const canNext = page < meta.totalPages;
  const pageNumbers = Array.from({ length: meta.totalPages }, (_, i) => i + 1);
  const displayedPages = pageNumbers.filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 2,
  );

  return (
    <div className="flex flex-col gap-0 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {title && (
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mr-2 shrink-0">
              {title}
            </h2>
          )}

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
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
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Filter */}
          {filterableColumns.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setFilterOpen((o) => !o);
                  setPendingFilters(filters);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition font-medium
                  ${
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
                <div className="absolute right-0 top-full mt-1 z-50 w-72 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Filters
                    </span>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <LuX className="w-4 h-4" />
                    </button>
                  </div>
                  {filterableColumns.map((col) => (
                    <div
                      key={col.key as string}
                      className="flex flex-col gap-1"
                    >
                      <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        {col.label}
                      </label>
                      <input
                        type="text"
                        value={pendingFilters[col.key as string] ?? ""}
                        onChange={(e) =>
                          setPendingFilters((p) => ({
                            ...p,
                            [col.key as string]: e.target.value,
                          }))
                        }
                        placeholder={`Filter by ${col.label.toLowerCase()}…`}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={clearFilters}
                      className="flex-1 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyFilters}
                      className="flex-1 py-1.5 text-xs rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Column picker */}
          <div className="relative">
            <button
              onClick={() => setColPickerOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
            >
              <LuColumns4 className="w-3.5 h-3.5" />
              Columns
            </button>
            {colPickerOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Visible columns
                  </span>
                  <button
                    onClick={() => setColPickerOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <LuX className="w-4 h-4" />
                  </button>
                </div>
                {columns.map((col) => (
                  <button
                    key={col.key as string}
                    onClick={() => toggleColumn(col.key as string)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-xs text-gray-700 dark:text-gray-200"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center transition ${!col.hidden ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 dark:border-gray-500"}`}
                    >
                      {!col.hidden && <LuCheck className="w-3 h-3" />}
                    </span>
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50"
          >
            <LuRefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          {/* Export */}
          {exportable && (
            <button
              onClick={() => exportToCSV(rows, columns, title ?? "export")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium"
            >
              <LuDownload className="w-3.5 h-3.5" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* ── Selection banner ── */}
      {selectable && selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-medium">
          <span>
            {selected.size} row{selected.size > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => {
              setSelected(new Set());
              onSelectionChange?.([]);
            }}
            className="underline hover:no-underline"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
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

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selected.size === rows.length}
                    ref={(el) => {
                      if (el)
                        el.indeterminate =
                          selected.size > 0 && selected.size < rows.length;
                    }}
                    onChange={toggleAll}
                    className="rounded border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}

              {visibleColumns.map((col) => (
                <th
                  key={col.key as string}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-3 font-semibold tracking-wide whitespace-nowrap ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key as string)}
                      className="inline-flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 transition group"
                    >
                      {col.label}
                      <span
                        className={`transition ${sortKey === col.key ? "text-blue-500" : ""}`}
                      >
                        <SortIcon
                          direction={sortKey === col.key ? sortDir : null}
                        />
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}

              {hasActions && (
                <th className="px-4 py-3 text-center w-16">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && rows.length === 0 ? (
              // Skeleton
              Array.from({ length: perPage > 5 ? 5 : perPage }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3">
                      <div
                        className="h-4 bg-gray-200 dark:bg-gray-700 rounded"
                        style={{ width: `${Math.random() * 40 + 50}%` }}
                      />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    visibleColumns.length +
                    (selectable ? 1 : 0) +
                    (hasActions ? 1 : 0)
                  }
                  className="text-center py-16 text-gray-400 dark:text-gray-500 text-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <LuSearch className="w-8 h-8 opacity-30" />
                    <span>{emptyMessage}</span>
                    {(search || activeFilterCount > 0) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          clearFilters();
                        }}
                        className="mt-1 text-xs text-blue-500 hover:underline"
                      >
                        Clear search & filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = row[rowKey];
                const isSelected = selected.has(id);
                return (
                  <tr
                    key={String(id)}
                    className={`transition-colors ${isSelected ? "bg-blue-50/60 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"} ${loading ? "opacity-50" : ""}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="rounded border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {visibleColumns.map((col) => {
                      const raw = get(row, col.key as string);
                      return (
                        <td
                          key={col.key as string}
                          className={`px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap text-sm ${col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"}`}
                        >
                          {col.render
                            ? col.render(raw, row)
                            : String(raw ?? "—")}
                        </td>
                      );
                    })}

                    {/* ── Three-dot actions dropdown ── */}
                    {hasActions && (
                      <td className="px-4 py-3">
                        <RowActionsDropdown
                          row={row}
                          onView={onView}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          extraActions={extraActions}
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500 dark:text-gray-400">
        {/* Per-page + info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="text-xs">Rows per page:</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              {perPageOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <span>
            {meta.total === 0
              ? "0 results"
              : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, meta.total)} of ${meta.total.toLocaleString()}`}
          </span>
        </div>

        {/* Page controls */}
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
                onClick={() => setPage(p)}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-medium transition
                  ${
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
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

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
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  );
}

export default DataTable;
