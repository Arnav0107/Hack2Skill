"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAuditRecord, verifyAuditHash } from "@/lib/api";
import type { AuditRecord } from "@/lib/mockData";
import Navbar from "@/components/layout/Navbar";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataCompletenessBadge from "@/components/ui/DataCompletenessBadge";
import SourceIcon from "@/components/ui/SourceIcon";
import { formatDatetime } from "@/lib/utils";
import { getBandFromScore } from "@/lib/utils";
import Link from "next/link";

export default function AuditPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [record, setRecord] = useState<AuditRecord | null>(null);
  const [fetching, setFetching] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; hash: string } | null>(null);

  useEffect(() => {
    getAuditRecord(auditId).then((r) => {
      setRecord(r);
      setFetching(false);
    });
  }, [auditId]);

  const handleVerify = async () => {
    if (!record || verifying) return;
    setVerifying(true);
    setVerifyResult(null);
    const result = await verifyAuditHash(auditId);
    setVerifyResult(result);
    setVerifying(false);
  };

  const sourceIds = ["gst", "upi", "epfo", "credit"] as const;

  if (fetching || !record) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ width: 28, height: 28, border: "2px solid rgba(201,166,107,0.3)", borderTop: "2px solid #C9A66B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        style={{ maxWidth: "760px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
        className="page-enter"
      >
        {/* Breadcrumb */}
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#9B9188", marginBottom: "1.5rem" }}>
          <Link href="/dashboard" style={{ color: "#8B6914", textDecoration: "none" }}>Dashboard</Link>
          {" / "}
          <span>Blockchain Audit Record</span>
        </p>

        {/* Ledger card */}
        <div
          style={{
            backgroundColor: "#FAF8F3",
            border: "1px solid rgba(201,166,107,0.3)",
            borderRadius: "5px",
            boxShadow: "0 2px 12px rgba(58,52,44,0.07)",
            overflow: "hidden",
          }}
        >
          {/* Card header — document style */}
          <div
            style={{
              backgroundColor: "#1B3A2F",
              padding: "1.25rem 1.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(201,166,107,0.7)",
                  margin: "0 0 0.25rem",
                }}
              >
                Blockchain Audit Record
              </p>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "#F7F4ED",
                  margin: 0,
                }}
              >
                {record.businessName}
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.65rem",
                  color: "rgba(247,244,237,0.5)",
                  margin: "0 0 0.25rem",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Audit ID
              </p>
              <span
                className="hash-mono"
                style={{ color: "rgba(201,166,107,0.85)", fontSize: "0.8rem" }}
              >
                {record.auditId}
              </span>
            </div>
          </div>

          {/* Body — ledger rows */}
          <div style={{ padding: "1.75rem" }}>
            {/* Score & completeness */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#F0EDE7",
                  borderRadius: "4px",
                  textAlign: "center",
                }}
              >
                <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Score</p>
                <span style={{ fontFamily: "Playfair Display, serif", fontSize: "2.25rem", fontWeight: 700, color: "#1B3A2F", lineHeight: 1 }}>
                  {record.score}
                </span>
                <div style={{ marginTop: "0.5rem" }}>
                  <ScoreBadge score={record.score} band={record.band} size="sm" />
                </div>
              </div>
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#F0EDE7",
                  borderRadius: "4px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <p className="eyebrow" style={{ marginBottom: "0" }}>Data Sources</p>
                <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", justifyContent: "center" }}>
                  {sourceIds.map((sid) => (
                    <SourceIcon
                      key={sid}
                      source={sid}
                      active={record.sourcesPresent.some((s) =>
                        s.toLowerCase().includes(sid === "credit" ? "credit" : sid)
                      )}
                      size={32}
                      showLabel={false}
                    />
                  ))}
                </div>
                <DataCompletenessBadge connected={record.dataCompleteness.connected} total={record.dataCompleteness.total} />
              </div>
            </div>

            <hr className="gold-divider" />

            {/* Ledger fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "MSME ID", value: record.msmeId, mono: false },
                { label: "Timestamp", value: formatDatetime(record.timestamp), mono: false },
                { label: "Model Version", value: record.modelVersion || "CB-v1.0-hackathon", mono: false },
                {
                  label: "Transaction ID",
                  value: (
                    <a 
                      href={`https://amoy.polygonscan.com/tx/${record.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 underline break-all hover:text-amber-900"
                      style={{ color: "#8B6914", textDecoration: "underline" }}
                    >
                      {record.transactionId}
                    </a>
                  ),
                  mono: true
                },
                {
                  label: "IPFS Record",
                  value: (
                    <>
                      <span className="font-mono text-sm">
                        {record.ipfsCid?.slice(0, 20)}...
                      </span>
                      <a 
                        href={`https://ipfs.io/ipfs/${record.ipfsCid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-amber-700 underline text-sm"
                        style={{ color: "#8B6914", textDecoration: "underline", marginLeft: "0.5rem" }}
                      >
                        VIEW ON IPFS ↗
                      </a>
                    </>
                  ),
                  mono: false
                },
                { label: "Block Hash", value: record.blockHash, mono: true },
                { label: "Inputs Hash", value: record.inputsHash, mono: true },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1.5rem",
                    padding: "0.75rem 0",
                    borderBottom: i < arr.length - 1 ? "1px solid rgba(201,166,107,0.12)" : "none",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#9B9188",
                      flexShrink: 0,
                      paddingTop: "1px",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    className={row.mono ? "hash-mono" : ""}
                    style={
                      row.mono
                        ? {}
                        : {
                            fontFamily: "Inter, sans-serif",
                            fontSize: "0.82rem",
                            color: "#3A342C",
                            textAlign: "right",
                          }
                    }
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <hr className="gold-divider" />

            {/* Verify section */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Integrity Verification</p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#9B9188", margin: 0 }}>
                  Re-compute the hash and verify it matches the on-chain record.
                </p>
              </div>
              <button
                onClick={handleVerify}
                disabled={verifying}
                style={{
                  backgroundColor: verifying ? "rgba(201,166,107,0.15)" : "#1B3A2F",
                  color: verifying ? "#9B9188" : "#C9A66B",
                  border: "none",
                  borderRadius: "4px",
                  padding: "0.625rem 1.25rem",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  cursor: verifying ? "not-allowed" : "pointer",
                  transition: "background 200ms",
                  flexShrink: 0,
                }}
              >
                {verifying ? "Verifying…" : "Verify Hash"}
              </button>
            </div>

            {verifying && (
              <p className="text-sm text-amber-700 mt-2" style={{ color: "#8B6914", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Verifying on-chain record...
              </p>
            )}
            {verifyResult && (
              <div className={`mt-3 p-3 rounded text-sm font-medium ${
                verifyResult.verified 
                  ? "bg-green-50 text-green-700 border border-green-200" 
                  : "bg-red-50 text-red-700 border border-red-200"
              }`} style={{
                marginTop: "0.75rem",
                padding: "0.75rem",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: verifyResult.verified ? "#f0fdf4" : "#fef2f2",
                color: verifyResult.verified ? "#15803d" : "#b91c1c",
                border: `1px solid ${verifyResult.verified ? "#bbf7d0" : "#fecaca"}`
              }}>
                {verifyResult.verified 
                  ? "✅ Hash Verified — Score Integrity Confirmed" 
                  : "❌ Hash Mismatch — Integrity Breach Detected"}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/dashboard" style={{ fontFamily: "Inter", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8B6914", textDecoration: "none" }}>
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </>
  );
}
