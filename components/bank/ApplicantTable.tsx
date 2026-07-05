"use client";

import { useState, useMemo } from "react";
import type { MSMERecord, ScoreBand } from "@/lib/mockData";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataCompletenessBadge from "@/components/ui/DataCompletenessBadge";
import { formatDate, staggerDelay } from "@/lib/utils";

interface ApplicantTableProps {
  applicants: MSMERecord[];
  onSelect: (id: string) => void;
}

type SortKey = "businessName" | "score" | "dataCompleteness" | "date";
type SortDir = "asc" | "desc";

const BAND_FILTER_OPTIONS: { label: string; value: ScoreBand | "all" }[] = [
  { label: "All Bands", value: "all" },
  { label: "Excellent", value: "excellent" },
  { label: "Good", value: "good" },
  { label: "Fair", value: "fair" },
  { label: "Poor", value: "poor" },
];

export default function ApplicantTable({ applicants, onSelect }: ApplicantTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [bandFilter, setBandFilter] = useState<ScoreBand | "all">("all");
  const [fraudOnly, setFraudOnly] = useState(false);
  const [completenessFilter, setCompletenessFilter] = useState<"all" | "full" | "partial">("all");
  const [search, setSearch] = useState("");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const filtered = useMemo(() => {
    let result = [...applicants];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) =>
        a.businessName.toLowerCase().includes(q) ||
        a.sector.toLowerCase().includes(q)
      );
    }
    if (bandFilter !== "all") result = result.filter((a) => a.band === bandFilter);
    if (fraudOnly) result = result.filter((a) => a.fraudFlag);
    if (completenessFilter === "full") result = result.filter((a) => a.dataCompleteness.connected === a.dataCompleteness.total);
    if (completenessFilter === "partial") result = result.filter((a) => a.dataCompleteness.connected < a.dataCompleteness.total);

    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      if (sortKey === "score") { aVal = a.score; bVal = b.score; }
      else if (sortKey === "dataCompleteness") { aVal = a.dataCompleteness.connected; bVal = b.dataCompleteness.connected; }
      else if (sortKey === "date") { aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); }
      else { aVal = a.businessName; bVal = b.businessName; }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [applicants, search, bandFilter, fraudOnly, completenessFilter, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span style={{ marginLeft: "0.3rem", opacity: sortKey === col ? 0.9 : 0.3, fontSize: "0.65rem" }}>
      {sortKey === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
    </span>
  );

  return (
    <div>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.625rem",
          marginBottom: "1rem",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search business or sector…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ maxWidth: "220px", fontSize: "0.8rem", padding: "0.45rem 0.75rem" }}
        />
        <select
          value={bandFilter}
          onChange={(e) => setBandFilter(e.target.value as ScoreBand | "all")}
          className="select-field"
          style={{ maxWidth: "140px", fontSize: "0.8rem", padding: "0.45rem 0.75rem" }}
        >
          {BAND_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={completenessFilter}
          onChange={(e) => setCompletenessFilter(e.target.value as "all" | "full" | "partial")}
          className="select-field"
          style={{ maxWidth: "150px", fontSize: "0.8rem", padding: "0.45rem 0.75rem" }}
        >
          <option value="all">All Sources</option>
          <option value="full">Full (4/4)</option>
          <option value="partial">Partial</option>
        </select>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.78rem",
            color: fraudOnly ? "#8B3A3A" : "#6B6259",
            fontWeight: fraudOnly ? 600 : 400,
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={fraudOnly}
            onChange={(e) => setFraudOnly(e.target.checked)}
            style={{ accentColor: "#8B3A3A" }}
          />
          Fraud flags only
        </label>
        <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#9B9188", marginLeft: "auto" }}>
          {filtered.length} of {applicants.length} applicants
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: "5px", border: "1px solid rgba(201,166,107,0.2)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1B3A2F" }}>
              {[
                { key: "businessName", label: "Business" },
                { key: null, label: "Sector" },
                { key: "score", label: "Score" },
                { key: "dataCompleteness", label: "Sources" },
                { key: null, label: "Fraud" },
                { key: "date", label: "Date" },
                { key: null, label: "" },
              ].map((col, i) => (
                <th
                  key={i}
                  onClick={col.key ? () => handleSort(col.key as SortKey) : undefined}
                  style={{
                    padding: "0.625rem 0.875rem",
                    textAlign: "left",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(247,244,237,0.72)",
                    cursor: col.key ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid rgba(201,166,107,0.15)",
                  }}
                >
                  {col.label}
                  {col.key && <SortIcon col={col.key as SortKey} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={row.id}
                className="stagger-item"
                style={{
                  ...staggerDelay(i, 60),
                  backgroundColor: row.fraudFlag ? "rgba(139,58,58,0.04)" : "#FAF8F3",
                  borderLeft: row.fraudFlag ? "3px solid rgba(139,58,58,0.35)" : "3px solid transparent",
                  borderBottom: "1px solid rgba(201,166,107,0.15)",
                  cursor: "pointer",
                  transition: "background-color 150ms",
                }}
                onClick={() => onSelect(row.id)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = row.fraudFlag ? "rgba(139,58,58,0.07)" : "#EDE9DF")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = row.fraudFlag ? "rgba(139,58,58,0.04)" : "#FAF8F3")}
              >
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: "0.88rem", fontWeight: 600, color: "#3A342C" }}>
                    {row.businessName}
                  </span>
                  {row.blockchainVerified && (
                    <span
                      style={{
                        marginLeft: "0.4rem",
                        fontSize: "0.55rem",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#1B3A2F",
                        border: "1px solid rgba(201,166,107,0.5)",
                        borderRadius: "3px",
                        padding: "0.05rem 0.35rem",
                      }}
                    >
                      ✓ Verified
                    </span>
                  )}
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#6B6259" }}>
                    {row.sector}
                  </span>
                  <br />
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "#9B9188" }}>
                    {row.registrationType}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <ScoreBadge score={row.score} band={row.band} size="sm" />
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <DataCompletenessBadge
                    connected={row.dataCompleteness.connected}
                    total={row.dataCompleteness.total}
                    showLabel={false}
                    size="sm"
                  />
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  {row.fraudFlag ? (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        backgroundColor: "rgba(139,58,58,0.08)",
                        color: "#8B3A3A",
                        border: "1px solid rgba(139,58,58,0.25)",
                        borderRadius: "3px",
                        padding: "0.1rem 0.4rem",
                        fontSize: "0.58rem",
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      ⚑ Flagged
                    </span>
                  ) : (
                    <span style={{ color: "#9B9188", fontSize: "0.7rem" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#9B9188" }}>
                    {formatDate(row.date)}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.875rem" }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(row.id); }}
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(201,166,107,0.4)",
                      borderRadius: "3px",
                      padding: "0.2rem 0.6rem",
                      fontSize: "0.68rem",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#8B6914",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 150ms",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(201,166,107,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "#9B9188", fontFamily: "Inter, sans-serif", fontSize: "0.85rem" }}>
                  No applicants match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
