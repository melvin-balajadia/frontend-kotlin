// src/components/transactions/PrintReportButton.tsx
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { useTransactionReport } from "@/hooks/transactions/transactionEntries.hooks";
import type {
  HuEntryReport,
  ItemEntryReport,
} from "@/api/transactions/transactionEntries.schema";
import logo from "@/assets/logo.png";

// ─── Props ────────────────────────────────────────────────────────────────────
interface PrintReportButtonProps {
  transactionId: string | number;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: string | null | undefined) => v ?? "—";

const calcTotalWeight = (items: ItemEntryReport[]) =>
  items.reduce((sum, i) => sum + (parseFloat(i.items_weight ?? "0") || 0), 0);

const fmtWeight = (w: number) =>
  w.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Print styles ─────────────────────────────────────────────────────────────
// Layout target:
//   Page 1 — full header + transaction info + summary stats + 2 HUs (2×1)
//   Page 2+ — compact header + 4 HUs per page (2×2)
//
// A4 @ 10mm margins = ~277mm printable height
// Page 1: header block ≈ 60mm + 2 HU blocks ≈ 105mm each = ~210mm  ✓
// Page 2+: compact header ≈ 12mm + 4 HU blocks ≈ 58mm each = ~244mm ✓
const printStyles = `
  @page {
    size: A4 portrait;
    margin: 5mm 6mm 5mm 6mm;
  }
  @media print {
    html, body { margin: 0; padding: 0; }
    body * { visibility: hidden; }
    #print-report, #print-report * { visibility: visible; }
    #print-report { position: absolute; inset: 0; }
    .print-page-break { page-break-before: always; }
    .hu-block { break-inside: avoid; }
  }
`;

// ─── Main export ──────────────────────────────────────────────────────────────
export default function PrintReportButton({
  transactionId,
  label = "Print Report",
  icon,
  className,
}: PrintReportButtonProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data, isLoading, isError } = useTransactionReport(transactionId);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Transaction-Report-${data?.transaction_idn ?? transactionId}`,
    onBeforePrint: async () => setIsPrinting(true),
    onAfterPrint: () => setIsPrinting(false),
  });

  const isDisabled = isLoading || isError || !data;
  const defaultClassName =
    "flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded transition-colors cursor-pointer";

  return (
    <>
      <button
        type="button"
        onClick={() => handlePrint()}
        disabled={isDisabled}
        className={className ?? defaultClassName}
      >
        {isLoading || isPrinting ? <SpinnerIcon /> : (icon ?? <PrintIcon />)}
        {isLoading ? "Loading…" : isPrinting ? "Preparing…" : label}
      </button>

      <div className="hidden print:block">
        <div ref={printRef}>{data && <TransactionReport data={data} />}</div>
      </div>

      <style>{printStyles}</style>
    </>
  );
}

// ─── Report layout ────────────────────────────────────────────────────────────
type ReportData = NonNullable<ReturnType<typeof useTransactionReport>["data"]>;

function TransactionReport({ data }: { data: ReportData }) {
  const allItems = data.hu_list.flatMap((hu) => hu.items);
  const grandWeight = calcTotalWeight(allItems);

  const printedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Page 1: first 2 HUs. Remaining HUs in groups of 4.
  const firstPageHUs = data.hu_list.slice(0, 2);
  const remainingHUs = data.hu_list.slice(2);
  const extraPages: (typeof data.hu_list)[] = [];
  for (let i = 0; i < remainingHUs.length; i += 4) {
    extraPages.push(remainingHUs.slice(i, i + 4));
  }
  const totalPages = 1 + extraPages.length;

  return (
    <div
      id="print-report"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#fff",
        color: "#111",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — Full header + summary + first 2 HUs
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "0 0 10mm" }}>
        {/* ── Brand + Reference ───────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={logo}
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
              alt="Logo"
            />
            <div>
              <p
                style={{
                  fontSize: "7px",
                  fontWeight: 700,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  marginBottom: "2px",
                }}
              >
                SmartScan System
              </p>
              <h1
                style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1,
                  letterSpacing: "-0.4px",
                }}
              >
                Transaction Report
              </h1>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "6.5px",
                color: "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "2px",
              }}
            >
              Reference No.
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "monospace",
                color: "#0f172a",
                letterSpacing: "0.03em",
              }}
            >
              {fmt(data.transaction_idn)}
            </p>
            <p style={{ fontSize: "7px", color: "#9ca3af", marginTop: "3px" }}>
              {printedAt}
            </p>
          </div>
        </div>

        {/* ── Hairline divider ────────────────────────────────────────────── */}
        <div
          style={{ height: "1px", background: "#e5e7eb", marginBottom: "10px" }}
        />

        {/* ── Transaction info grid ───────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "#e5e7eb",
            border: "1px solid #e5e7eb",
            borderRadius: "5px",
            overflow: "hidden",
            marginBottom: "10px",
          }}
        >
          {/* Row 1 */}
          <div style={{ ...infoCell, gridColumn: "span 2" }}>
            <InfoLabel>Client</InfoLabel>
            <InfoValue>{fmt(data.transaction_client)}</InfoValue>
          </div>
          <div style={infoCell}>
            <InfoLabel>Type</InfoLabel>
            <InfoValue>{fmt(data.transaction_transaction_type)}</InfoValue>
          </div>
          <div style={infoCell}>
            <InfoLabel>Plate No.</InfoLabel>
            <InfoValue mono>{fmt(data.transaction_trucking_pn)}</InfoValue>
          </div>
          {/* Row 2 */}
          <div style={infoCell}>
            <InfoLabel>Transaction Date</InfoLabel>
            <InfoValue>{fmt(data.transaction_date)}</InfoValue>
          </div>
          <div style={infoCell}>
            <InfoLabel>Start Date</InfoLabel>
            <InfoValue>{fmt(data.transaction_start_date)}</InfoValue>
          </div>
          <div style={infoCell}>
            <InfoLabel>End Date</InfoLabel>
            <InfoValue>{fmt(data.transaction_end_date)}</InfoValue>
          </div>
          <div style={infoCell}>
            <InfoLabel>Start Time / End Time</InfoLabel>
            <InfoValue>
              {fmt(data.transaction_start_time)} –{" "}
              {fmt(data.transaction_end_time)}
            </InfoValue>
          </div>
        </div>

        {/* ── Summary stat cards ──────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <StatCard
            label="Total HUs"
            value={String(data.hu_list.length)}
            sub="Handling units scanned"
          />
          <StatCard
            label="Total Items"
            value={String(allItems.length)}
            sub="Across all HUs"
          />
          <StatCard
            label="Total Weight"
            value={`${fmtWeight(grandWeight)} kg`}
            sub="Combined gross weight"
            accent
          />
        </div>

        {/* ── HUs 1–2 ─────────────────────────────────────────────────────── */}
        <div className="border border-gray-300 my-4" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {firstPageHUs.map((hu, i) => (
            <HuSection key={hu.hu_id} hu={hu} index={i + 1} />
          ))}
        </div>

        <PageFooter
          id={data.transaction_id}
          idn={data.transaction_idn}
          page={1}
          total={totalPages}
          printedAt={printedAt}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2+ — Compact header + 4 HUs per page
      ══════════════════════════════════════════════════════════════════════ */}
      {extraPages.map((pageHUs, pi) => {
        const startIdx = 2 + pi * 4;
        return (
          <div
            key={pi}
            className="print-page-break"
            style={{ padding: "0 0 10mm" }}
          >
            {/* Compact repeat header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "7px",
                paddingBottom: "6px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <img
                  src={logo}
                  style={{
                    height: "22px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                  alt="Logo"
                />
                <div>
                  <p
                    style={{
                      fontSize: "6.5px",
                      fontWeight: 700,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                    }}
                  >
                    SmartScan System
                  </p>
                  <p
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "#0f172a",
                    }}
                  >
                    Transaction Report
                  </p>
                </div>
              </div>
              <p
                style={{
                  fontSize: "9px",
                  fontFamily: "monospace",
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                {fmt(data.transaction_idn)}
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
              }}
            >
              {pageHUs.map((hu, i) => (
                <HuSection
                  key={hu.hu_id}
                  hu={hu}
                  index={startIdx + i + 1}
                  compact
                />
              ))}
            </div>

            <PageFooter
              id={data.transaction_id}
              idn={data.transaction_idn}
              page={pi + 2}
              total={totalPages}
              printedAt={printedAt}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── HU Section ──────────────────────────────────────────────────────────────
function HuSection({
  hu,
  index,
  compact = false,
}: {
  hu: HuEntryReport;
  index: number;
  compact?: boolean;
}) {
  const huWeight = calcTotalWeight(hu.items);

  return (
    <div
      className="hu-block"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* HU header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "#f8fafc",
          borderBottom: "1px solid #e5e7eb",
          padding: compact ? "3px 7px" : "4px 8px",
        }}
      >
        <span
          style={{
            fontSize: "6.5px",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            flexShrink: 0,
          }}
        >
          HU {index}
        </span>
        <span
          style={{
            width: "1px",
            height: "9px",
            background: "#cbd5e1",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "8.5px",
            fontWeight: 700,
            fontFamily: "monospace",
            color: "#0f172a",
          }}
        >
          {fmt(hu.hu_number)}
        </span>
        {hu.hu_palletnumber && (
          <span
            style={{
              fontSize: "6.5px",
              color: "#94a3b8",
              whiteSpace: "nowrap",
            }}
          >
            · Pallet: {hu.hu_palletnumber}
          </span>
        )}
        {hu.hu_batch_code && (
          <span
            style={{
              fontSize: "6.5px",
              color: "#94a3b8",
              whiteSpace: "nowrap",
            }}
          >
            · Batch: {hu.hu_batch_code}
          </span>
        )}
        {hu.hu_description && (
          <span
            style={{
              fontSize: "6.5px",
              color: "#94a3b8",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            · {hu.hu_description}
          </span>
        )}
        <span
          style={{
            marginLeft: "auto",
            fontSize: "6.5px",
            color: "#94a3b8",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {hu.items.length} item{hu.items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items table */}
      {hu.items.length > 0 ? (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: "7.5px",
          }}
        >
          <colgroup>
            <col style={{ width: "14px" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "27%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "13%" }} />
          </colgroup>
          <thead>
            <tr style={{ background: "#fff" }}>
              {(
                [
                  "#",
                  "Item Code",
                  "Description",
                  "Batch",
                  "PD",
                  "CU",
                  "Wt (kg)",
                ] as const
              ).map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "3px 4px",
                    fontSize: "6px",
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    borderBottom: "1px solid #e5e7eb",
                    textAlign:
                      i === 0
                        ? "center"
                        : i === 6
                          ? "right"
                          : i >= 4
                            ? "center"
                            : "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hu.items.map((item, i) => (
              <tr
                key={item.items_id}
                style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}
              >
                <td
                  style={td({ align: "center", color: "#cbd5e1", size: "7px" })}
                >
                  {i + 1}
                </td>
                <td style={td({ mono: true, color: "#1e293b" })}>
                  {fmt(item.items_item_code)}
                </td>
                <td style={td({ color: "#94a3b8", size: "7px" })}>
                  {fmt(item.items_item_description)}
                </td>
                <td style={td({ mono: true, color: "#94a3b8", size: "7px" })}>
                  {fmt(item.items_batch_code)}
                </td>
                <td
                  style={td({ align: "center", color: "#64748b", size: "7px" })}
                >
                  {fmt(item.items_pd)}
                </td>
                <td
                  style={td({ align: "center", color: "#64748b", size: "7px" })}
                >
                  {fmt(item.items_cu)}
                </td>
                <td
                  style={td({ align: "right", color: "#0f172a", weight: 700 })}
                >
                  {item.items_weight
                    ? parseFloat(item.items_weight).toFixed(2)
                    : "—"}
                </td>
              </tr>
            ))}
            {/* Subtotal row */}
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "3px 4px",
                  textAlign: "right",
                  fontSize: "6.5px",
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.09em",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                Total weight
              </td>
              <td
                style={{
                  padding: "3px 4px",
                  textAlign: "right",
                  fontSize: "8.5px",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontVariantNumeric: "tabular-nums",
                  background: "#f8fafc",
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                {huWeight.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div
          style={{
            padding: "8px",
            textAlign: "center",
            fontSize: "7px",
            color: "#cbd5e1",
          }}
        >
          No items in this HU.
        </div>
      )}
    </div>
  );
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
const infoCell: React.CSSProperties = {
  background: "#fff",
  padding: "7px 10px",
};

function td({
  align = "left",
  color = "#374151",
  mono = false,
  weight = 400,
  size = "7.5px",
}: {
  align?: "left" | "center" | "right";
  color?: string;
  mono?: boolean;
  weight?: number;
  size?: string;
}): React.CSSProperties {
  return {
    padding: "1px 4px",
    textAlign: align,
    color,
    fontFamily: mono ? "monospace" : "inherit",
    fontWeight: weight,
    fontSize: size,
    fontVariantNumeric: "tabular-nums",
    borderBottom: "1px solid #f8fafc",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
}

// ─── Small UI sub-components ─────────────────────────────────────────────────
function InfoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: "6.5px",
        fontWeight: 700,
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        marginBottom: "2px",
      }}
    >
      {children}
    </p>
  );
}

function InfoValue({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <p
      style={{
        fontSize: "9px",
        fontWeight: 700,
        color: "#0f172a",
        fontFamily: mono ? "monospace" : "inherit",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </p>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        border: accent ? "1px solid #0f172a" : "1px solid #e5e7eb",
        borderRadius: "5px",
        padding: "9px 12px",
        background: accent ? "#0f172a" : "#fff",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <p
        style={{
          fontSize: "7px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: accent ? "#64748b" : "#9ca3af",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: accent ? "18px" : "16px",
          fontWeight: 700,
          color: accent ? "#f8fafc" : "#0f172a",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: "7px", color: accent ? "#475569" : "#9ca3af" }}>
        {sub}
      </p>
    </div>
  );
}

function PageFooter({
  id,
  idn,
  page,
  total,
  printedAt,
}: {
  id: string | number;
  idn: string | null | undefined;
  page: number;
  total: number;
  printedAt: string;
}) {
  return (
    <div
      style={{
        marginTop: "10px",
        paddingTop: "5px",
        borderTop: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "6.5px",
        color: "#94a3b8",
      }}
    >
      <span>
        Transaction #{id} · {fmt(idn)}
      </span>
      <span>
        Page {page} / {total} · Printed {printedAt}
      </span>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function PrintIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
