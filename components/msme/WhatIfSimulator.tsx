"use client";

import { useState } from "react";
import { simulateScore } from "@/lib/api";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { getBandFromScore, getScoreBandColor, getBandLabel } from "@/lib/utils";

interface WhatIfSimulatorProps {
  baseScore: number;
}

export default function WhatIfSimulator({ baseScore }: WhatIfSimulatorProps) {
  const [gstCompliance, setGstCompliance] = useState(75);
  const [upiTurnover, setUpiTurnover] = useState(8);
  const [creditRatio, setCreditRatio] = useState(0.35);

  const simScore = simulateScore({
    gstCompliancePercent: gstCompliance,
    avgMonthlyUPITurnoverLakh: upiTurnover,
    outstandingCreditRatio: creditRatio,
  });

  const band = getBandFromScore(simScore);
  const color = getScoreBandColor(band);

  const sliders = [
    {
      id: "gst",
      label: "GST Compliance Rate",
      value: gstCompliance,
      min: 0,
      max: 100,
      step: 1,
      suffix: "%",
      onChange: setGstCompliance,
      hint: "Percentage of months with on-time GST return filing",
    },
    {
      id: "upi",
      label: "Avg. Monthly UPI Turnover",
      value: upiTurnover,
      min: 0,
      max: 50,
      step: 0.5,
      suffix: "L",
      onChange: setUpiTurnover,
      hint: "Average monthly UPI credit in lakhs (₹)",
    },
    {
      id: "credit",
      label: "Outstanding Credit Ratio",
      value: Math.round(creditRatio * 100),
      min: 0,
      max: 100,
      step: 1,
      suffix: "%",
      onChange: (v: number) => setCreditRatio(v / 100),
      hint: "Outstanding credit vs. credit limit (lower is better)",
    },
  ];

  return (
    <div className="card-static" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: "0.25rem" }}>
            What-If Simulator
          </p>
          <h3
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "1rem",
              fontWeight: 600,
              color: "#3A342C",
              margin: 0,
            }}
          >
            Explore how changes affect your score
          </h3>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: "#9B9188", margin: "0.25rem 0 0" }}>
            Adjust the sliders to simulate different scenarios. No data is changed.
          </p>
        </div>

        {/* Live score preview */}
        <div
          style={{
            textAlign: "center",
            flexShrink: 0,
            backgroundColor: "#F7F4ED",
            border: `1.5px solid ${color}30`,
            borderRadius: "5px",
            padding: "0.625rem 1rem",
            minWidth: "80px",
          }}
        >
          <AnimatedNumber
            value={simScore}
            className="font-serif"
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "2rem",
              fontWeight: 600,
              color,
              lineHeight: 1,
              display: "block",
            } as React.CSSProperties}
          />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color,
              display: "block",
              marginTop: "0.2rem",
            }}
          >
            {getBandLabel(band)}
          </span>
        </div>
      </div>

      {/* Sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {sliders.map((slider) => (
          <div key={slider.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.375rem" }}>
              <label
                htmlFor={`sim-${slider.id}`}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  color: "#3A342C",
                }}
              >
                {slider.label}
              </label>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#1B3A2F",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {slider.value}{slider.suffix}
              </span>
            </div>
            <input
              id={`sim-${slider.id}`}
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={slider.value}
              onChange={(e) => slider.onChange(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#A8854A",
              }}
            />
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.7rem",
                color: "#9B9188",
                margin: "0.25rem 0 0",
              }}
            >
              {slider.hint}
            </p>
          </div>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          setGstCompliance(75);
          setUpiTurnover(8);
          setCreditRatio(0.35);
        }}
        style={{
          marginTop: "1.25rem",
          backgroundColor: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#9B9188",
          transition: "color 200ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A66B")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#9B9188")}
      >
        Reset to defaults
      </button>
    </div>
  );
}
