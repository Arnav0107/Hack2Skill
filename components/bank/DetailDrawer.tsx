"use client";

import { useEffect, useRef, useState } from "react";
import type { MSMERecord } from "@/lib/mockData";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataCompletenessBadge from "@/components/ui/DataCompletenessBadge";
import SourceIcon from "@/components/ui/SourceIcon";
import StatusPill from "@/components/ui/StatusPill";
import { formatDate } from "@/lib/utils";
import { approveMSME, rejectMSME, requestMoreInfo } from "@/lib/api";
import Link from "next/link";

interface DetailDrawerProps {
  msme: MSMERecord | null;
  onClose: () => void;
}

export default function DetailDrawer({ msme, onClose }: DetailDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [actionState, setActionState] = useState<"idle" | "approving" | "rejecting" | "requesting" | "done">("idle");
  const [actionResult, setActionResult] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msme) {
      // Delay to trigger CSS transition
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [msme]);

  if (!msme && !visible) return null;

  const handleAction = async (type: "approve" | "reject" | "info") => {
    setActionState(type === "approve" ? "approving" : type === "reject" ? "rejecting" : "requesting");
    if (type === "approve") await approveMSME(msme!.id);
    else if (type === "reject") await rejectMSME(msme!.id);
    else await requestMoreInfo(msme!.id);
    setActionResult(
      type === "approve" ? "Application approved and recorded." :
      type === "reject" ? "Application rejected. MSME will be notified." :
      "Request sent. MSME has been asked to connect missing data sources."
    );
    setActionState("done");
  };

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(27,26,22,0.35)",
          zIndex: 100,
          opacity: visible ? 1 : 0,
          transition: "opacity 350ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(520px, 92vw)",
          backgroundColor: "#F7F4ED",
          borderLeft: "1px solid rgba(201,166,107,0.25)",
          boxShadow: "-8px 0 32px rgba(58,52,44,0.12)",
          zIndex: 101,
          overflowY: "auto",
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 350ms cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {msme && (
          <div style={{ padding: "1.75rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Applicant Detail</p>
                <h2
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "1.35rem",
                    fontWeight: 600,
                    color: "#3A342C",
                    margin: "0 0 0.375rem",
                  }}
                >
                  {msme.businessName}
                </h2>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <StatusPill label={msme.sector} variant="gold" />
                  <StatusPill label={msme.registrationType} variant="neutral" />
                  {msme.blockchainVerified && (
                    <StatusPill
                      label="Blockchain Verified"
                      variant="verified"
                      icon={<span style={{ fontSize: "0.65rem" }}>✓</span>}
                    />
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid rgba(201,166,107,0.3)",
                  borderRadius: "4px",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  color: "#9B9188",
                  fontSize: "1.1rem",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Score & completeness row */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <div
                className="card-static"
                style={{ flex: "1 1 120px", padding: "1rem", textAlign: "center" }}
              >
                <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Overall Score</p>
                <div style={{ fontSize: "2.5rem", fontFamily: "Playfair Display, serif", fontWeight: 700, color: "#1B3A2F", lineHeight: 1 }}>
                  {msme.score}
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <ScoreBadge score={msme.score} band={msme.band} size="sm" />
                </div>
              </div>
              <div className="card-static" style={{ flex: "1 1 160px", padding: "1rem" }}>
                <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Data Sources</p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  {msme.dataSources.map((s) => (
                    <SourceIcon key={s.id} source={s.id} active={s.connected} size={36} showLabel={true} />
                  ))}
                </div>
                <div style={{ marginTop: "0.625rem", textAlign: "center" }}>
                  <DataCompletenessBadge connected={msme.dataCompleteness.connected} total={msme.dataCompleteness.total} />
                </div>
              </div>
            </div>

            {/* Fraud alert */}
            {msme.fraudFlag && (
              <div
                style={{
                  backgroundColor: "rgba(139,58,58,0.05)",
                  border: "1px solid rgba(139,58,58,0.25)",
                  borderLeft: "3px solid rgba(139,58,58,0.55)",
                  borderRadius: "4px",
                  padding: "0.875rem 1rem",
                  marginBottom: "1.25rem",
                  animation: "fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <p className="eyebrow" style={{ color: "#8B3A3A", marginBottom: "0.375rem" }}>
                  ⚑ Fraud Flag Active
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#8B3A3A", margin: 0, lineHeight: 1.55 }}>
                  {msme.fraudNote}
                </p>
              </div>
            )}

            {/* Sub-scores */}
            <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>Sub-Score Breakdown</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {msme.subScores.map((sub) => (
                <div
                  key={sub.id}
                  className="card-static"
                  style={{
                    padding: "0.75rem 0.875rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <span style={{ fontFamily: "Playfair Display, serif", fontSize: "0.85rem", fontWeight: 600, color: "#3A342C" }}>
                      {sub.label}
                    </span>
                    {sub.hasInsufficientData && (
                      <span className="completeness-badge" style={{ marginLeft: "0.5rem", fontSize: "0.55rem" }}>
                        Insuff. data
                      </span>
                    )}
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: "#9B9188", margin: "0.2rem 0 0" }}>
                      {sub.dataCompleteness.current}/{sub.dataCompleteness.total} {sub.dataCompleteness.unit}
                    </p>
                  </div>
                  <ScoreBadge score={sub.score} band={sub.band} size="sm" showScore={true} />
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div style={{ marginBottom: "1.5rem" }}>
              <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Record Info</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {[
                  { label: "Date Assessed", value: formatDate(msme.date) },
                  { label: "Audit ID", value: msme.auditId },
                  { label: "Blockchain", value: msme.blockchainVerified ? "Verified ✓" : "Not verified" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter, sans-serif", fontSize: "0.78rem" }}>
                    <span style={{ color: "#9B9188" }}>{row.label}</span>
                    <span style={{ color: "#3A342C", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit link */}
            <Link
              href={`/audit/${msme.auditId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: "#8B6914",
                textDecoration: "none",
                marginBottom: "1.5rem",
              }}
            >
              View Blockchain Audit Record →
            </Link>

            {/* Peer benchmarking placeholder */}
            <div
              className="card-static"
              style={{
                padding: "0.875rem 1rem",
                marginBottom: "1.5rem",
                borderStyle: "dashed",
                opacity: 0.7,
              }}
            >
              <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Peer Benchmarking</p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#9B9188", margin: 0 }}>
                Sector comparison data will appear here once more applicants in {msme.sector} are assessed.
              </p>
            </div>

            {/* Action buttons */}
            {actionState === "done" ? (
              <div
                style={{
                  backgroundColor: "#E5EDE9",
                  border: "1px solid rgba(27,58,47,0.2)",
                  borderRadius: "4px",
                  padding: "0.875rem 1rem",
                  animation: "fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both",
                }}
              >
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#1B3A2F", fontWeight: 500, margin: 0 }}>
                  ✓ {actionResult}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                <button
                  className="btn-approve"
                  onClick={() => handleAction("approve")}
                  disabled={actionState !== "idle"}
                >
                  {actionState === "approving" ? "Approving…" : "Approve"}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleAction("reject")}
                  disabled={actionState !== "idle"}
                >
                  {actionState === "rejecting" ? "Rejecting…" : "Reject"}
                </button>
                <button
                  className="btn-info"
                  onClick={() => handleAction("info")}
                  disabled={actionState !== "idle"}
                  title="Ask MSME to connect missing data sources"
                >
                  {actionState === "requesting" ? "Sending…" : "Request More Info (missing sources)"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
