"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getCurrentMSMEDashboard, getCreditJourney, type CreditJourney } from "@/lib/api";
import type { MSMERecord } from "@/lib/mockData";
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
  const [data, setData] = useState<MSMERecord | null>(null);
  const [journey, setJourney] = useState<CreditJourney | null>(null);
  const [fetching, setFetching] = useState(true);

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
          getCreditJourney(d.id)
            .then((j) => setJourney(j))
            .catch((err) => console.error("Journey fetch failed", err))
            .finally(() => setFetching(false));
        }
      })
      .catch((err) => {
        console.error("Dashboard load failed", err);
        setFetching(false);
      });
  }, [user, router]);

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
              Loading your Financial Health Card…
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
            Financial Health Card
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

        <hr className="gold-divider" />

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

        {/* Credit Journey Roadmap */}
        {journey && (
          <section style={{ marginBottom: "2.5rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>Your Credit Journey</p>
              <h2
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#3A342C",
                  margin: 0,
                }}
              >
                Roadmap to higher credit limits
              </h2>
            </div>

            <div
              style={{
                backgroundColor: "#FAF8F3",
                border: "1px solid rgba(201,166,107,0.2)",
                borderTop: "3px solid #8B6914",
                borderRadius: "5px",
                boxShadow: "0 2px 8px rgba(58, 52, 44, 0.055)",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#6B6259",
                    }}
                  >
                    Current Stage:
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      backgroundColor:
                        journey.stage === "fully_scored"
                          ? "#E5EDE9"
                          : journey.stage === "established"
                          ? "#FAF3E5"
                          : "#FAF8F3",
                      color:
                        journey.stage === "fully_scored"
                          ? "#1B3A2F"
                          : journey.stage === "established"
                          ? "#8B6914"
                          : "#6B6259",
                      border: `1px solid ${
                        journey.stage === "fully_scored"
                          ? "rgba(27,58,47,0.2)"
                          : "rgba(139,105,20,0.2)"
                      }`,
                      borderRadius: "3px",
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.68rem",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {journey.stage.replace("_", " ")}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.78rem",
                    color: "#8B6914",
                    fontWeight: 600,
                  }}
                >
                  Complete these steps → score could reach {journey.projected_score_low} – {journey.projected_score_high}
                </div>
              </div>

              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.88rem",
                  color: "#3A342C",
                  lineHeight: 1.6,
                  margin: 0,
                  backgroundColor: "rgba(201,166,107,0.06)",
                  padding: "1rem",
                  borderRadius: "4px",
                  borderLeft: "3px solid #C9A66B",
                }}
              >
                <strong>Next Action:</strong> {journey.next_action}
              </p>
            </div>
          </section>
        )}

        {/* What-If Simulator */}
        <section style={{ marginBottom: "2.5rem" }}>
          <WhatIfSimulator baseScore={data.score} />
        </section>
      </main>
    </>
  );
}
