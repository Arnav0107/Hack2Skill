"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getMSMEById } from "@/lib/api";
import type { MSMERecord } from "@/lib/mockData";
import Navbar from "@/components/layout/Navbar";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataCompletenessBadge from "@/components/ui/DataCompletenessBadge";
import StatusPill from "@/components/ui/StatusPill";
import { formatDate, staggerDelay } from "@/lib/utils";
import Link from "next/link";

export default function ScoreBreakdownPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<MSMERecord | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    getMSMEById(id).then((d) => {
      setData(d);
      setFetching(false);
    });
  }, [id]);

  if (fetching || !data) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div
            style={{
              width: 28,
              height: 28,
              border: "2px solid rgba(201,166,107,0.3)",
              borderTop: "2px solid #C9A66B",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        style={{ maxWidth: "860px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
        className="page-enter"
      >
        {/* Breadcrumb */}
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#9B9188", marginBottom: "1.5rem" }}>
          <Link href="/dashboard" style={{ color: "#8B6914", textDecoration: "none" }}>Dashboard</Link>
          {" / "}
          <span>Score Breakdown</span>
        </p>

        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Full Score Breakdown</p>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              fontWeight: 600,
              color: "#3A342C",
              margin: "0 0 0.625rem",
            }}
          >
            {data.businessName}
          </h1>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <ScoreBadge score={data.score} band={data.band} size="md" />
            <DataCompletenessBadge connected={data.dataCompleteness.connected} total={data.dataCompleteness.total} />
            <StatusPill label={data.sector} variant="gold" />
            <StatusPill label={formatDate(data.date)} variant="neutral" />
          </div>
        </div>

        <hr className="gold-divider" />

        {/* Sub-scores vertical list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {data.subScores.map((sub, i) => (
            <div
              key={sub.id}
              className="card-static stagger-item"
              style={{
                ...staggerDelay(i, 90),
                padding: "1.5rem",
                borderTop: sub.hasInsufficientData
                  ? "2px dashed rgba(201,166,107,0.55)"
                  : `3px solid ${sub.band === "poor" ? "#8B3A3A" : sub.band === "fair" ? "#8B6914" : sub.band === "good" ? "#3E6B45" : "#1B3A2F"}`,
              }}
            >
              {/* Sub-score header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <h2
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "1.05rem",
                      fontWeight: 600,
                      color: "#3A342C",
                      margin: "0 0 0.25rem",
                      opacity: sub.hasInsufficientData ? 0.65 : 1,
                    }}
                  >
                    {sub.label}
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#9B9188", margin: 0 }}>
                    {sub.hasInsufficientData
                      ? `Insufficient ${sub.missingSource} data — score based on available signals`
                      : sub.summary}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem", flexShrink: 0 }}>
                  {sub.hasInsufficientData ? (
                    <span className="completeness-badge">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <circle cx="4" cy="4" r="3.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5" />
                      </svg>
                      Insufficient data
                    </span>
                  ) : (
                    <ScoreBadge score={sub.score} band={sub.band} size="md" />
                  )}
                  <DataCompletenessBadge
                    connected={sub.dataCompleteness.current}
                    total={sub.dataCompleteness.total}
                    showLabel={false}
                  />
                </div>
              </div>

              {/* Data completeness detail */}
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.72rem",
                  color: "#9B9188",
                  margin: "0 0 1rem",
                  padding: "0.375rem 0.625rem",
                  backgroundColor: "#F0EDE7",
                  borderRadius: "3px",
                  display: "inline-block",
                }}
              >
                Based on{" "}
                <strong style={{ color: "#6B6259" }}>
                  {sub.dataCompleteness.current} of {sub.dataCompleteness.total} {sub.dataCompleteness.unit}
                </strong>
              </p>

              {/* SHAP-style contributor bars */}
              <div>
                <p className="eyebrow" style={{ marginBottom: "0.625rem", color: "#9B9188" }}>
                  Top Contributing Factors
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {sub.contributors.map((c, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.76rem",
                          color: "#3A342C",
                          minWidth: "200px",
                          flex: "0 0 200px",
                          lineHeight: 1.35,
                        }}
                      >
                        {c.label}
                      </span>
                      <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(201,166,107,0.15)", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.abs(c.impact)}%`,
                            backgroundColor: c.positive ? "#3E6B45" : "#8B3A3A",
                            borderRadius: "3px",
                            opacity: 0.75,
                            transition: `width ${600 + j * 100}ms cubic-bezier(0.22,1,0.36,1)`,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "0.7rem",
                          color: c.positive ? "#3E6B45" : "#8B3A3A",
                          fontWeight: 600,
                          minWidth: "36px",
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {c.positive ? "+" : ""}{c.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why factors */}
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(201,166,107,0.18)" }}>
                <p className="eyebrow" style={{ marginBottom: "0.5rem", color: "#9B9188" }}>Detailed Factors</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {sub.whyFactors.map((f, k) => (
                    <li key={k} style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#6B6259", lineHeight: 1.5, display: "flex", gap: "0.5rem" }}>
                      <span style={{ color: "#C9A66B", flexShrink: 0 }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/dashboard" style={{ fontFamily: "Inter", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8B6914", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
          <Link href={`/audit/${data.auditId}`} style={{ fontFamily: "Inter", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8B6914", textDecoration: "none" }}>
            View Audit Record →
          </Link>
        </div>
      </main>
    </>
  );
}
