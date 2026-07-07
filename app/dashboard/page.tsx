"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getCurrentMSMEDashboard, recomputeScore } from "@/lib/api";
import CreditBridgeLogo from "@/components/ui/CreditBridgeLogo";
import type { MSMERecord, ScoreBand } from "@/lib/mockData";
import SourceIcon from "@/components/ui/SourceIcon";
import Navbar from "@/components/layout/Navbar";
import ScoreGauge from "@/components/ui/ScoreGauge";
import TrendChart from "@/components/ui/TrendChart";
import DataCompletenessPanel from "@/components/msme/DataCompletenessPanel";
import ScoreCard from "@/components/msme/ScoreCard";
import WhatIfSimulator from "@/components/msme/WhatIfSimulator";
import StatusPill from "@/components/ui/StatusPill";
import { staggerDelay } from "@/lib/utils";
import Link from "next/link";

export default function MSMEDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<MSMERecord | null>(null);
  const [fetching, setFetching] = useState(true);
  const [showSourcesPanel, setShowSourcesPanel] = useState(false);
  const [recomputeBanner, setRecomputeBanner] = useState<{
    oldScore: number;
    newScore: number;
    delta: number;
    sourceName: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role !== "msme") router.push("/bank");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return; // Prevent early API calls before auth finishes
    getCurrentMSMEDashboard()
      .then((d) => {
        if (!d) {
          console.warn("No MSME profile found, redirecting to onboarding.");
          router.push("/onboarding");
        } else {
          setData(d);
          setFetching(false);
        }
      })
      .catch((err) => {
        console.error("Dashboard load failed", err);
        setFetching(false);
      });
  }, [user, router]);

  useEffect(() => {
    const recomputeParam = searchParams.get("recompute");
    const oldScoreParam = searchParams.get("oldScore");
    const sourceParam = searchParams.get("source");

    if (recomputeParam && oldScoreParam && data && !recomputeBanner) {
      const oldVal = parseInt(oldScoreParam, 10);
      recomputeScore(data.id)
        .then((res) => {
          if (res.success) {
            const newVal = res.score;
            const diff = newVal - oldVal;
            if (diff > 0) {
              setRecomputeBanner({
                oldScore: oldVal,
                newScore: newVal,
                delta: diff,
                sourceName:
                  sourceParam === "epfo"
                    ? "EPFO Records"
                    : sourceParam === "credit"
                    ? "Credit Bureau"
                    : sourceParam === "gst"
                    ? "GST Data"
                    : sourceParam === "upi"
                    ? "UPI Transactions"
                    : "New Source",
              });
            }
            setData((prev) => (prev ? { ...prev, score: newVal, band: res.band as ScoreBand } : null));
          }
        })
        .catch((err) => console.error("Recompute failed", err));
    }
  }, [searchParams, data, recomputeBanner]);

  if (isLoading || fetching || !data) {
    return (
      <>
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "2px solid rgba(201,166,107,0.3)",
                borderTop: "2px solid #C9A66B",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 1rem",
              }}
            />
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188" }}>
              Loading your CreditBridge Profile…
            </p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
        }}
        className="page-enter"
      >
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>
            CreditBridge Profile
          </p>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(1.5rem, 3vw, 2rem)",
                  fontWeight: 600,
                  color: "#3A342C",
                  margin: "0 0 0.5rem",
                }}
              >
                {data.businessName}
              </h1>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <StatusPill label={data.sector} variant="gold" />
                <StatusPill label={data.registrationType} variant="neutral" />
                {data.isProvisional ? (
                  <StatusPill label="Provisional Score" variant="neutral" />
                ) : (
                  data.blockchainVerified && (
                    <StatusPill
                      label="Blockchain Verified"
                      variant="verified"
                      icon={
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      }
                    />
                  )
                )}
              </div>
              {data.gstin && (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#9B9188", margin: "0.5rem 0 0" }}>
                  GSTIN: {data.gstin}
                </p>
              )}
            </div>
            <Link
              href={`/audit/${data.auditId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#8B6914",
                textDecoration: "none",
                padding: "0.45rem 0.875rem",
                border: "1px solid rgba(201,166,107,0.4)",
                borderRadius: "4px",
                transition: "background 200ms",
              }}
            >
              View Audit Record →
            </Link>
          </div>
        </div>

        <hr className="gold-divider" style={{ margin: "1.5rem 0" }} />

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
          <button
            onClick={() => setShowSourcesPanel(false)}
            style={{
              background: "none",
              border: "none",
              borderBottom: !showSourcesPanel ? "3.5px solid #1B3A2F" : "3.5px solid transparent",
              color: !showSourcesPanel ? "#1B3A2F" : "#9B9188",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              paddingBottom: "0.4rem",
              cursor: "pointer",
              transition: "all 200ms"
            }}
          >
            OVERVIEW
          </button>
          <button
            id="data-sources-tab"
            onClick={() => setShowSourcesPanel(true)}
            style={{
              background: "none",
              border: "none",
              borderBottom: showSourcesPanel ? "3.5px solid #1B3A2F" : "3.5px solid transparent",
              color: showSourcesPanel ? "#1B3A2F" : "#9B9188",
              fontFamily: "Inter, sans-serif",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              paddingBottom: "0.4rem",
              cursor: "pointer",
              transition: "all 200ms"
            }}
          >
            DATA SOURCES
          </button>
        </div>

        {/* Score Improvement Banner */}
        {recomputeBanner && (
          <div
            style={{
              backgroundColor: "#E5EDE9",
              border: "1px solid rgba(27,58,47,0.3)",
              borderLeft: "5px solid #2E6B3E",
              borderRadius: "5px",
              padding: "1.1rem 1.35rem",
              marginBottom: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div>
              <strong style={{ display: "block", color: "#1B3A2F", fontSize: "0.92rem", fontFamily: "Inter, sans-serif", marginBottom: "0.25rem" }}>
                🎉 Score Boost Active!
              </strong>
              <p style={{ margin: 0, fontSize: "0.84rem", color: "#2E6B3E", fontFamily: "Inter, sans-serif", lineHeight: 1.5 }}>
                Connecting <strong>{recomputeBanner.sourceName}</strong> improved your CreditBridge score from <strong>{recomputeBanner.oldScore}</strong> to <strong>{recomputeBanner.newScore}</strong> (a <strong>+{recomputeBanner.delta} point</strong> increase!).
              </p>
            </div>
            <button
              onClick={() => setRecomputeBanner(null)}
              style={{
                background: "none",
                border: "none",
                color: "#1B3A2F",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: "pointer",
                padding: "0.25rem"
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Toggled Views */}
        {!showSourcesPanel ? (
          <div>
            {/* Score section — side by side desktop, stacked mobile */}
            <section style={{ marginBottom: "2.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                {/* Left: Gauge */}
                <div
                  className="card-static"
                  style={{ padding: "2rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}
                >
                  <p className="eyebrow" style={{ alignSelf: "flex-start", marginBottom: "0" }}>
                    Overall Financial Health Score
                  </p>
                  <ScoreGauge score={data.score} size={200} />
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.78rem",
                      color: "#9B9188",
                      textAlign: "center",
                      margin: "0.25rem 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    Assessed {new Date(data.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                  <Link
                    href={`/score/${data.id}`}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#8B6914",
                      textDecoration: "none",
                      marginTop: "0.5rem",
                    }}
                  >
                    Full Score Breakdown →
                  </Link>
                </div>

                {/* Right: Data completeness */}
                <DataCompletenessPanel
                  connected={data.dataCompleteness.connected}
                  total={data.dataCompleteness.total}
                  sources={data.dataSources}
                />
              </div>
            </section>

            {/* Loan Eligibility Banner */}
            {data.loanEligibility && (
              <div
                style={{
                  marginBottom: "2.5rem",
                  padding: "1.25rem 1.5rem",
                  borderRadius: "6px",
                  border: `1px solid ${
                    data.loanEligibility.color === "green"
                      ? "rgba(34, 197, 94, 0.3)"
                      : data.loanEligibility.color === "amber"
                      ? "rgba(245, 158, 11, 0.3)"
                      : "rgba(239, 68, 68, 0.3)"
                  }`,
                  backgroundColor:
                    data.loanEligibility.color === "green"
                      ? "rgba(240, 253, 244, 0.8)"
                      : data.loanEligibility.color === "amber"
                      ? "rgba(255, 251, 235, 0.8)"
                      : "rgba(254, 242, 242, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <p
                    className="eyebrow"
                    style={{
                      margin: "0 0 0.25rem 0",
                      color:
                        data.loanEligibility.color === "green"
                          ? "#15803d"
                          : data.loanEligibility.color === "amber"
                          ? "#b45309"
                          : "#b91c1c",
                    }}
                  >
                    Estimated Loan Eligibility Range
                  </p>
                  <p
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "1.25rem",
                      fontWeight: 600,
                      margin: 0,
                      color: "#3A342C",
                    }}
                  >
                    {data.loanEligibility.label}
                  </p>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor:
                      data.loanEligibility.color === "green"
                        ? "#dcfce7"
                        : data.loanEligibility.color === "amber"
                        ? "#fef3c7"
                        : "#fee2e2",
                    color:
                      data.loanEligibility.color === "green"
                        ? "#15803d"
                        : data.loanEligibility.color === "amber"
                        ? "#b45309"
                        : "#b91c1c",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                  }}
                >
                  {data.loanEligibility.eligible ? "✓" : "✗"}
                </span>
              </div>
            )}

            {/* Trend chart */}
            <section className="card-static" style={{ padding: "1.5rem", marginBottom: "2.5rem" }}>
              <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Score Trend</p>
              <h2
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#3A342C",
                  margin: "0 0 1rem",
                }}
              >
                Last 6 Months
              </h2>
              <TrendChart scores={data.trendScores} labels={data.trendLabels} height={130} />
            </section>

            {/* Sub-score cards */}
            <section style={{ marginBottom: "2.5rem" }}>
              <div style={{ marginBottom: "1rem" }}>
                <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Score Breakdown</p>
                <h2
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#3A342C",
                    margin: 0,
                  }}
                >
                  What drives your score?
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}
              >
                {data.subScores.map((sub, i) => (
                  <ScoreCard key={sub.id} subScore={sub} animationDelay={i * 90} />
                ))}
              </div>
            </section>

            {/* What-If Simulator */}
            <section style={{ marginBottom: "2.5rem" }}>
              <WhatIfSimulator baseScore={data.score} />
            </section>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }} className="fade-in">
            {/* Data Sources List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.dataSources.map((src) => {
                const isConnected = src.connected;
                let metadataStr = "";
                let recommendation = "";
                let actionBtn = null;

                if (src.id === "gst") {
                  metadataStr = isConnected 
                    ? `GSTIN: ${data.gstin || "Connected"} • Filing Status: Active • 12 consecutive months on time`
                    : "GST data not connected.";
                } else if (src.id === "upi") {
                  metadataStr = isConnected
                    ? "UPI transactions stream active • 30 days historical volume indexed • Zero circular transaction flags"
                    : "UPI transactions stream not connected.";
                } else if (src.id === "epfo") {
                  if (isConnected) {
                    metadataStr = "EPFO records verified • Monthly contributions active • Employee headcount validated";
                  } else {
                    recommendation = "Connect your EPFO data now to verify operational stability and boost your score by up to +8 points!";
                    actionBtn = (
                      <Link
                        href={`/onboarding?step=3&source=epfo&oldScore=${data.score}`}
                        className="btn-primary"
                        style={{ textDecoration: "none", fontSize: "0.75rem", padding: "0.5rem 1.25rem", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        Connect EPFO Now (+8 pts)
                      </Link>
                    );
                  }
                } else if (src.id === "credit") {
                  if (isConnected) {
                    metadataStr = `Credit Bureau file linked • Debt-to-asset ratio assessed`;
                  } else {
                    recommendation = "Connect your Credit Bureau records now to verify repayment history and boost your score by up to +5 points!";
                    actionBtn = (
                      <Link
                        href={`/onboarding?step=3&source=credit&oldScore=${data.score}`}
                        className="btn-primary"
                        style={{ textDecoration: "none", fontSize: "0.75rem", padding: "0.5rem 1.25rem", alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        Connect Bureau Now (+5 pts)
                      </Link>
                    );
                  }
                }

                return (
                  <div
                    key={src.id}
                    className="card-static"
                    style={{
                      padding: "1.5rem",
                      borderLeft: `4px solid ${isConnected ? "#2E6B3E" : "#C9A66B"}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <SourceIcon source={src.id} active={isConnected} size={32} showLabel={false} />
                        <div>
                          <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "0.95rem", fontWeight: 600, color: "#3A342C", margin: 0 }}>
                            {src.label}
                          </h4>
                          <span style={{ fontSize: "0.75rem", color: isConnected ? "#2E6B3E" : "#B38F00", fontWeight: 600 }}>
                            {isConnected ? "Connected" : "Not Linked"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isConnected && (
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#6B6259", margin: 0, backgroundColor: "#FAF8F3", padding: "0.75rem", borderRadius: "4px", border: "1px solid rgba(201,166,107,0.12)" }}>
                        <strong>Active Metadata:</strong> {metadataStr}
                      </p>
                    )}

                    {!isConnected && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#8B6914", margin: 0 }}>
                          {recommendation}
                        </p>
                        {actionBtn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
