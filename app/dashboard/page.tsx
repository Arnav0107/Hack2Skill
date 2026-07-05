"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getCurrentMSMEDashboard } from "@/lib/api";
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
          setFetching(false);
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
                {data.blockchainVerified && (
                  <StatusPill
                    label="Blockchain Verified"
                    variant="verified"
                    icon={
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                )}
              </div>
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
      </main>
    </>
  );
}
