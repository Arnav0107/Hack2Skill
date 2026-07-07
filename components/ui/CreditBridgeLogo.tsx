"use client";

import React from "react";

interface CreditBridgeLogoProps {
  width?: number;
  height?: number;
  showText?: boolean;
  theme?: "light" | "dark";
  titleSize?: string;
  subtitleSize?: string;
}

export default function CreditBridgeLogo({
  width = 40,
  height = 40,
  showText = false,
  theme = "light",
  titleSize = "1.2rem",
  subtitleSize = "0.55rem",
}: CreditBridgeLogoProps) {
  const primaryColor = theme === "dark" ? "#FFFFFF" : "#1B3A2F"; // dark green or white
  const greenColor = "#10B981"; // dynamic green dot and stay cables

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      {/* Icon Mark */}
      <svg
        viewBox="0 0 100 100"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Horizontal base */}
        <line
          x1="20"
          y1="80"
          x2="80"
          y2="80"
          stroke={primaryColor}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Vertical mast */}
        <line
          x1="75"
          y1="80"
          x2="75"
          y2="25"
          stroke={primaryColor}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Sloped roadway */}
        <line
          x1="20"
          y1="75"
          x2="75"
          y2="42"
          stroke={primaryColor}
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* stay cables */}
        <line
          x1="75"
          y1="25"
          x2="30"
          y2="71"
          stroke={greenColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="75"
          y1="25"
          x2="42"
          y2="63"
          stroke={greenColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="75"
          y1="25"
          x2="54"
          y2="55"
          stroke={greenColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="75"
          y1="25"
          x2="66"
          y2="48"
          stroke={greenColor}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Green dot at mast top */}
        <circle cx="75" cy="25" r="5" fill={greenColor} />
        {/* Black/white dot at roadway start */}
        <circle cx="20" cy="75" r="5" fill={primaryColor} />
      </svg>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: titleSize,
              fontWeight: 700,
              color: primaryColor,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            CreditBridge
          </span>
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: subtitleSize,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: theme === "dark" ? "rgba(255,255,255,0.6)" : "#6B6259",
            }}
          >
            MSME Financial Health Card
          </span>
        </div>
      )}
    </div>
  );
}
