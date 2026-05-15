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
  LuLayoutGrid,
  LuTable2,
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
  /** Shown as the primary card title */
  cardTitle?: boolean;
  /** Shown as the secondary card subtitle */
  cardSubtitle?: boolean;
  /** Exclude from card body fields */
  hideInCard?: boolean;
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
  columns: ColumnDef<T>[];
  fetchData: (
    params: FetchParams,
  ) => Promise<{ data: T[]; meta: PaginationMeta }>;
  rowKey: keyof T;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
  selectable?: boolean;
  onSelectionChange?: (rows: T[]) => void;
  exportable?: boolean;
  title?: string;
  perPageOptions?: number[];
  searchDebounce?: number;
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

// ─── Sort Icon ────────────────────────────────────────────────────────────────

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
  dropdownAlign = "right",
}: {
  row: T;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
  dropdownAlign?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open]);

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Row actions"
        className={`p-1.5 rounded-md transition-colors ${
          open
            ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        }`}
      >
        <LuEllipsis className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 w-40 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 ${
            dropdownAlign === "left" ? "left-0" : "right-0"
          }`}
          style={{ top: "100%" }}
        >
          {onView && (
            <button
              type="button"
              onClick={() => {
                onView(row);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
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
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
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
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

// ─── Data Card ────────────────────────────────────────────────────────────────

function DataCard<T extends { [key: string]: unknown }>({
  row,
  columns,
  onView,
  onEdit,
  onDelete,
  extraActions,
  selectable,
  isSelected,
  onToggleSelect,
}: {
  row: T;
  columns: ColumnDef<T>[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraActions?: (row: T) => React.ReactNode;
  selectable?: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const visibleCols = columns.filter((c) => !c.hidden);
  const titleCol = visibleCols.find((c) => c.cardTitle) ?? visibleCols[0];
  const subtitleCol = visibleCols.find((c) => c.cardSubtitle) ?? visibleCols[1];
  const bodyFields = visibleCols.filter(
    (c) =>
      c.key !== titleCol?.key && c.key !== subtitleCol?.key && !c.hideInCard,
  );
  const hasActions = onView || onEdit || onDelete || extraActions;
  const titleVal = titleCol ? get(row, titleCol.key as string) : null;
  const subtitleVal = subtitleCol ? get(row, subtitleCol.key as string) : null;

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-900 rounded-lg border transition-all duration-100 ${
        isSelected
          ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm"
      }`}
    >
      {/* ── Card header ── */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3.5">
        {selectable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-0.5 shrink-0 rounded border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-400 cursor-pointer w-4 h-4"
          />
        )}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
              {titleCol?.render
                ? titleCol.render(titleVal, row)
                : String(titleVal ?? "—")}
            </p>
            {subtitleCol && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                {subtitleCol.render
                  ? subtitleCol.render(subtitleVal, row)
                  : String(subtitleVal ?? "—")}
              </p>
            )}
          </div>
          {hasActions && (
            <div className="shrink-0 -mt-0.5 -mr-1">
              <RowActionsDropdown
                row={row}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                extraActions={extraActions}
                dropdownAlign="right"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Field grid ── */}
      {bodyFields.length > 0 && (
        <div className="px-4 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-x-4 gap-y-3">
          {bodyFields.map((col) => {
            const raw = get(row, col.key as string);
            return (
              <div key={col.key as string} className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5 leading-none">
                  {col.label}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                  {col.render ? col.render(raw, row) : String(raw ?? "—")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="px-4 pt-4 pb-3.5 flex flex-col gap-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/5" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      </div>
      <div className="px-4 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-x-4 gap-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-1.5" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pagination Button ────────────────────────────────────────────────────────

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
      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

// ─── View Toggle ─────────────────────────────────────────────────────────────

function ViewToggle({
  viewMode,
  onChange,
}: {
  viewMode: "auto" | "table" | "cards";
  onChange: (v: "auto" | "table" | "cards") => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-700">
      <button
        title="Card view"
        onClick={() => onChange(viewMode === "cards" ? "auto" : "cards")}
        className={`px-2 py-1.5 flex items-center justify-center transition-colors ${
          viewMode === "cards"
            ? "bg-blue-500 text-white"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
        }`}
      >
        <LuLayoutGrid className="w-3.5 h-3.5" />
      </button>
      <div className="w-px h-4 bg-gray-200 dark:bg-gray-600" />
      <button
        title="Table view"
        onClick={() => onChange(viewMode === "table" ? "auto" : "table")}
        className={`px-2 py-1.5 flex items-center justify-center transition-colors ${
          viewMode === "table"
            ? "bg-blue-500 text-white"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600"
        }`}
      >
        <LuTable2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main DataTable Component ────────────────────────────────────────────────

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

  // "auto"  → cards on <sm, table on sm+
  // "table" → always table
  // "cards" → always cards (grid layout on larger screens)
  const [viewMode, setViewMode] = useState<"auto" | "table" | "cards">("auto");

  const abortRef = useRef<AbortController | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
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
      setSelected(new Set());
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
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters, perPage]);

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

  const toggleColumn = (key: string) =>
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c)),
    );

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
  const hasActions = !!(onEdit || onDelete || onView || extraActions);
  const filterableColumns = columns.filter((c) => c.filterable);

  const canPrev = page > 1;
  const canNext = page < meta.totalPages;
  const pageNumbers = Array.from({ length: meta.totalPages }, (_, i) => i + 1);
  const displayedPages = pageNumbers.filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1,
  );

  const isCards = viewMode === "cards";
  const isTable = viewMode === "table";
  const isAuto = viewMode === "auto";

  // ── Empty / loading card content ───────────────────────────────────────────
  const renderCardContent = (forceGrid: boolean) => {
    const gridClass = forceGrid
      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
      : "flex flex-col gap-2.5";

    if (loading && rows.length === 0) {
      return (
        <div className={`p-3 ${gridClass}`}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          {forceGrid && <SkeletonCard />}
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400 dark:text-gray-500 text-sm">
          <LuSearch className="w-8 h-8 opacity-25" />
          <p>{emptyMessage}</p>
          {(search || activeFilterCount > 0) && (
            <button
              onClick={() => {
                setSearch("");
                clearFilters();
              }}
              className="text-xs text-blue-500 hover:underline"
            >
              Clear search & filters
            </button>
          )}
        </div>
      );
    }
    return (
      <>
        {selectable && (
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-0">
            <input
              type="checkbox"
              checked={rows.length > 0 && selected.size === rows.length}
              ref={(el) => {
                if (el)
                  el.indeterminate =
                    selected.size > 0 && selected.size < rows.length;
              }}
              onChange={toggleAll}
              className="rounded border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-400 cursor-pointer w-4 h-4"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 select-none">
              Select all
            </span>
          </div>
        )}
        <div
          className={`p-3 ${loading ? "opacity-60 pointer-events-none" : ""} ${gridClass}`}
        >
          {rows.map((row) => {
            const id = row[rowKey];
            return (
              <DataCard
                key={String(id)}
                row={row}
                columns={visibleColumns}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                extraActions={extraActions}
                selectable={selectable}
                isSelected={selected.has(id)}
                onToggleSelect={() => toggleRow(id)}
              />
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* ══ TOOLBAR ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {/* Left */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {title && (
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 shrink-0 hidden sm:block">
              {title}
            </h2>
          )}
          <div className="relative flex-1 max-w-xs">
            <LuSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <LuX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* View toggle */}
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />

          {/* Filter */}
          {filterableColumns.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setFilterOpen((o) => !o);
                  setPendingFilters(filters);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border transition-colors font-medium ${
                  activeFilterCount > 0
                    ? "border-blue-400 text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-600"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                <LuFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-64 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Filters
                    </span>
                    <button
                      onClick={() => setFilterOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {filterableColumns.map((col) => (
                    <div
                      key={col.key as string}
                      className="flex flex-col gap-1"
                    >
                      <label className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
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
                        className="px-2.5 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button
                      onClick={clearFilters}
                      className="flex-1 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={applyFilters}
                      className="flex-1 py-1.5 text-xs rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Column picker — only in table view */}
          {(isTable || isAuto) && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setColPickerOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                <LuColumns4 className="w-3.5 h-3.5" />
                Columns
              </button>
              {colPickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg p-3 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                      Visible columns
                    </span>
                    <button
                      onClick={() => setColPickerOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <LuX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {columns.map((col) => (
                    <button
                      key={col.key as string}
                      onClick={() => toggleColumn(col.key as string)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs text-gray-700 dark:text-gray-200"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${!col.hidden ? "bg-blue-500 border-blue-500 text-white" : "border-gray-300 dark:border-gray-500"}`}
                      >
                        {!col.hidden && <LuCheck className="w-2.5 h-2.5" />}
                      </span>
                      {col.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
          >
            <LuRefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Export */}
          {exportable && (
            <button
              onClick={() => exportToCSV(rows, columns, title ?? "export")}
              title="Export CSV"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              <LuDownload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Selection banner ── */}
      {selectable && selected.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-medium">
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
            Clear
          </button>
        </div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 text-xs text-red-600 dark:text-red-400">
          <LuX className="w-3.5 h-3.5 shrink-0" />
          {error}
          <button
            onClick={load}
            className="ml-auto underline hover:no-underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* ══ CARD VIEW ════════════════════════════════════════════════════════
          - viewMode="cards" → always shown, grid layout on larger screens
          - viewMode="auto"  → shown only on mobile (<sm)
          - viewMode="table" → hidden always
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        className={isCards ? "block" : isTable ? "hidden" : "block sm:hidden"}
      >
        {renderCardContent(isCards)}
      </div>

      {/* ══ TABLE VIEW ═══════════════════════════════════════════════════════
          - viewMode="table" → always shown
          - viewMode="auto"  → shown only on sm+ screens
          - viewMode="cards" → hidden always
         ═══════════════════════════════════════════════════════════════════ */}
      <div
        className={`${isTable ? "block" : isCards ? "hidden" : "hidden sm:block"} overflow-x-auto`}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
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
                    className="rounded border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-400 cursor-pointer"
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col.key as string}
                  style={col.width ? { width: col.width } : undefined}
                  className={`px-4 py-3 font-semibold tracking-wide whitespace-nowrap ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key as string)}
                      className="inline-flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {col.label}
                      <span
                        className={sortKey === col.key ? "text-blue-500" : ""}
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
                <th className="px-4 py-3 text-center w-14">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && rows.length === 0 ? (
              Array.from({ length: Math.min(perPage, 6) }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key as string} className="px-4 py-3">
                      <div
                        className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded"
                        style={{ width: `${50 + Math.random() * 40}%` }}
                      />
                    </td>
                  ))}
                  {hasActions && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-5 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
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
                    <LuSearch className="w-8 h-8 opacity-25" />
                    <span>{emptyMessage}</span>
                    {(search || activeFilterCount > 0) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          clearFilters();
                        }}
                        className="text-xs text-blue-500 hover:underline"
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
                    className={`transition-colors ${loading ? "opacity-50" : ""} ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-900/10"
                        : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                    }`}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                          className="rounded border-gray-300 dark:border-gray-500 text-blue-500 focus:ring-blue-400 cursor-pointer"
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const raw = get(row, col.key as string);
                      return (
                        <td
                          key={col.key as string}
                          className={`px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap text-sm ${
                            col.align === "center"
                              ? "text-center"
                              : col.align === "right"
                                ? "text-right"
                                : "text-left"
                          }`}
                        >
                          {col.render
                            ? col.render(raw, row)
                            : String(raw ?? "—")}
                        </td>
                      );
                    })}
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

      {/* ══ FOOTER / PAGINATION ══════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <label className="hidden sm:inline">Per page:</label>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
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
              ? "No results"
              : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, meta.total)} of ${meta.total.toLocaleString()}`}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <PagBtn
            onClick={() => setPage(1)}
            disabled={!canPrev}
            title="First page"
          >
            {" "}
            <LuChevronsLeft className="w-3.5 h-3.5" />
          </PagBtn>
          <PagBtn
            onClick={() => setPage((p) => p - 1)}
            disabled={!canPrev}
            title="Prev"
          >
            {" "}
            <LuChevronLeft className="w-3.5 h-3.5" />
          </PagBtn>
          {displayedPages.map((p, i, arr) => (
            <>
              {i > 0 && arr[i - 1] !== p - 1 && (
                <span
                  key={`ell-${p}`}
                  className="px-1 text-gray-400 select-none"
                >
                  …
                </span>
              )}
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-7 h-7 px-2 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {p}
              </button>
            </>
          ))}
          <PagBtn
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext}
            title="Next"
          >
            {" "}
            <LuChevronRight className="w-3.5 h-3.5" />
          </PagBtn>
          <PagBtn
            onClick={() => setPage(meta.totalPages)}
            disabled={!canNext}
            title="Last page"
          >
            {" "}
            <LuChevronsRight className="w-3.5 h-3.5" />
          </PagBtn>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
