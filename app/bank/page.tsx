"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getAllMSMEs, getMSMEDetail } from "@/lib/api";
import type { MSMERecord } from "@/lib/mockData";
import Navbar from "@/components/layout/Navbar";
import ApplicantTable from "@/components/bank/ApplicantTable";
import FraudAlertPanel from "@/components/bank/FraudAlertPanel";
import DetailDrawer from "@/components/bank/DetailDrawer";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataCompletenessBadge from "@/components/ui/DataCompletenessBadge";

export default function BankOfficerDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [applicants, setApplicants] = useState<MSMERecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedMSME, setSelectedMSME] = useState<MSMERecord | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (!isLoading && user?.role === "msme") router.push("/dashboard");
  }, [user, isLoading, router]);

  useEffect(() => {
    getAllMSMEs().then((data) => {
      setApplicants(data);
      setFetching(false);
    });
  }, []);

  const handleSelectMSME = async (id: string) => {
    const detail = await getMSMEDetail(id);
    setSelectedMSME(detail);
  };

  // Summary stats
  const stats = {
    total: applicants.length,
    excellent: applicants.filter((a) => a.band === "excellent").length,
    good: applicants.filter((a) => a.band === "good").length,
    fair: applicants.filter((a) => a.band === "fair").length,
    poor: applicants.filter((a) => a.band === "poor").length,
    flagged: applicants.filter((a) => a.fraudFlag).length,
    fullData: applicants.filter((a) => a.dataCompleteness.connected === a.dataCompleteness.total).length,
  };

  if (isLoading || fetching) {
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
              Loading portfolio…
            </p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main
        style={{ maxWidth: "1440px", margin: "0 auto", padding: "2.5rem 1.5rem" }}
        className="page-enter"
      >
        {/* Page header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Bank Officer Dashboard</p>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              fontWeight: 600,
              color: "#3A342C",
              margin: "0 0 0.25rem",
            }}
          >
            MSME Applicant Portfolio
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: 0 }}>
            {user?.name} — Review, filter, and take action on MSME credit applications.
          </p>
        </div>

        {/* Summary stats strip */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          {[
            { label: "Total", value: stats.total, color: "#3A342C" },
            { label: "Excellent", value: stats.excellent, color: "#1B3A2F" },
            { label: "Good", value: stats.good, color: "#3E6B45" },
            { label: "Fair", value: stats.fair, color: "#8B6914" },
            { label: "Poor", value: stats.poor, color: "#8B3A3A" },
            { label: "Fraud Flagged", value: stats.flagged, color: "#8B3A3A" },
            { label: "Full Data", value: stats.fullData, color: "#8B6914" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="card-static stagger-item"
              style={{
                padding: "0.875rem 1.125rem",
                flex: "1 1 90px",
                minWidth: "80px",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <p className="eyebrow" style={{ marginBottom: "0.2rem", fontSize: "0.58rem" }}>
                {stat.label}
              </p>
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1.1,
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* Main layout: table + fraud sidebar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr min(280px, 28%)",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Main table */}
          <div>
            <ApplicantTable applicants={applicants} onSelect={handleSelectMSME} />
          </div>

          {/* Fraud sidebar */}
          <div style={{ position: "sticky", top: "76px" }}>
            <FraudAlertPanel applicants={applicants} onSelect={handleSelectMSME} />
          </div>
        </div>
      </main>

      {/* Detail Drawer */}
      <DetailDrawer msme={selectedMSME} onClose={() => setSelectedMSME(null)} />
    </>
  );
}
