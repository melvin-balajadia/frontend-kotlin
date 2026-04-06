// src/pages/TransactionsPage.tsx
import { getPaginatedTransactionEntries } from "@/api/transactions/transactionEntries.api";
import { DataTable, type ColumnDef } from "@/components/CustomDataTable";
import { useNavigate } from "react-router-dom";
import { LuPackage, LuPlus } from "react-icons/lu";

interface Transaction extends Record<string, unknown> {
  transaction_id: number;
  transaction_idn: string;
  transaction_transaction_type: string;
  transaction_client: string;
  transaction_trucking_pn: string;
  transaction_date: string | null;
}

const columns: ColumnDef<Transaction>[] = [
  {
    key: "transaction_idn",
    label: "IDN No. / Wil No.",
    sortable: true,
    filterable: true,
  },
  {
    key: "transaction_transaction_type",
    label: "Transaction Type",
    sortable: true,
    filterable: true,
  },
  {
    key: "transaction_client",
    label: "Client Name",
    sortable: true,
    filterable: true,
  },
  { key: "transaction_trucking_pn", label: "Plate Number", sortable: true },
  {
    key: "transaction_date",
    label: "Date",
    sortable: true,
    render: (value) => {
      if (!value) return "—";
      return new Date(String(value)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
];

export default function TransactionsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-3 sm:p-4 flex flex-col min-h-screen dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-900 shadow-sm px-4 py-3 sm:py-4 mb-1">
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

        {/* Back Button */}
        <button
          onClick={() => navigate("/transaction-entries/add")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition font-medium disabled:opacity-50"
        >
          <LuPlus className={"w-3.5 h-3.5"} />
          New Transaction
        </button>
      </div>

      {/* ── Data table ── */}
      <DataTable<Transaction>
        columns={columns}
        fetchData={getPaginatedTransactionEntries}
        rowKey="transaction_id"
        selectable
        exportable
        perPageOptions={[10, 25, 50, 100]}
        searchDebounce={400}
        emptyMessage="No transactions found."
        onView={(row) => console.log("View", row)}
        onEdit={(row) =>
          navigate(`/transaction-entries/edit/${row.transaction_id}`)
        }
        onDelete={(row) => {
          if (confirm(`Delete transaction ${row.transaction_idn}?`)) {
            console.log("Delete", row);
          }
        }}
        onSelectionChange={(rows) => console.log("Selected:", rows)}
      />
    </div>
  );
}
