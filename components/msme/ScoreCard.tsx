"use client";

import { useState } from "react";
import {
  getScoreBandColor,
  getScoreBandBg,
  getScoreBandBorder,
  getBandLabel,
} from "@/lib/utils";
import type { SubScore } from "@/lib/mockData";

interface ScoreCardProps {
  subScore: SubScore;
  animationDelay?: number;
}

export default function ScoreCard({ subScore, animationDelay = 0 }: ScoreCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { score, band, label, summary, hasInsufficientData, missingSource, whyFactors } = subScore;

  const color = getScoreBandColor(band);
  const bg = getScoreBandBg(band);
  const border = getScoreBandBorder(band);

  // Insufficient data state overrides normal card style
  const isInsufficient = hasInsufficientData;

  return (
    <div
      className="stagger-item"
      style={{
        animationDelay: `${animationDelay}ms`,
        backgroundColor: "#FAF8F3",
        border: isInsufficient
          ? "1.5px dashed rgba(201,166,107,0.55)"
          : `1px solid rgba(201,166,107,0.2)`,
        borderTop: isInsufficient
          ? `2px dashed rgba(201,166,107,0.55)`
          : `3px solid ${color}`,
        borderRadius: "5px",
        boxShadow: "0 2px 8px rgba(58, 52, 44, 0.055)",
        overflow: "hidden",
        transition: "transform 200ms cubic-bezier(0.22,1,0.36,1), box-shadow 200ms cubic-bezier(0.22,1,0.36,1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(58,52,44,0.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(58,52,44,0.055)";
      }}
    >
      <div style={{ padding: "1rem 1.125rem" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <h3
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#3A342C",
              margin: 0,
              lineHeight: 1.3,
              opacity: isInsufficient ? 0.6 : 1,
            }}
          >
            {label}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            {/* Insufficient data badge — DISTINCT from score badge */}
            {isInsufficient ? (
              <span
                className="completeness-badge"
                style={{ fontSize: "0.575rem" }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <circle cx="4" cy="4" r="3.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5" />
                </svg>
                Insufficient data
              </span>
            ) : (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  backgroundColor: bg,
                  color,
                  border: `1px solid ${border}`,
                  borderRadius: "3px",
                  padding: "0.15rem 0.45rem",
                  fontSize: "0.65rem",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                }}
              >
                {score}
                <span style={{ fontSize: "0.58rem", opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {getBandLabel(band)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Summary */}
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.8rem",
            color: isInsufficient ? "#9B9188" : "#6B6259",
            margin: "0 0 0.75rem",
            lineHeight: 1.55,
          }}
        >
          {isInsufficient
            ? `${label}: insufficient ${missingSource} data — score based on other signals`
            : summary}
        </p>

        {/* "Why?" toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            backgroundColor: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#9B9188",
            transition: "color 200ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A66B")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9B9188")}
        >
          <span
            style={{
              display: "inline-block",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 300ms cubic-bezier(0.22,1,0.36,1)",
              fontSize: "0.7rem",
            }}
          >
            ›
          </span>
          Why this score?
        </button>
      </div>

      {/* Expandable "Why?" section */}
      <div
        style={{
          maxHeight: expanded ? "300px" : "0px",
          opacity: expanded ? 1 : 0,
          overflow: "hidden",
          transition: `max-height ${expanded ? "300ms" : "200ms"} ${expanded ? "cubic-bezier(0.22,1,0.36,1)" : "ease-in"}, opacity ${expanded ? "300ms" : "200ms"} ${expanded ? "ease-out" : "ease-in"}`,
        }}
      >
        <div
          style={{
            borderTop: "1px solid rgba(201,166,107,0.2)",
            backgroundColor: "#F7F4ED",
            padding: "0.875rem 1.125rem",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "0.5rem", color: "#9B9188" }}>
            Contributing factors
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {whyFactors.map((factor, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.78rem",
                  color: "#3A342C",
                  lineHeight: 1.5,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <span style={{ color: "#C9A66B", marginTop: "0.2rem", flexShrink: 0 }}>—</span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
