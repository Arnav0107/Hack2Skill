// StatusPill — generic small caps tracked uppercase status tag
// Used for sector tags, status labels, verified badges, etc.

interface StatusPillProps {
  label: string;
  variant?: "gold" | "forest" | "neutral" | "fraud" | "verified";
  icon?: React.ReactNode;
  outlined?: boolean;
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  gold: {
    color: "#8B6914",
    backgroundColor: "transparent",
    border: "1px solid rgba(201,166,107,0.55)",
  },
  forest: {
    color: "#1B3A2F",
    backgroundColor: "#E5EDE9",
    border: "1px solid rgba(27,58,47,0.25)",
  },
  neutral: {
    color: "#6B6259",
    backgroundColor: "transparent",
    border: "1px solid rgba(58,52,44,0.2)",
  },
  fraud: {
    color: "#8B3A3A",
    backgroundColor: "rgba(139,58,58,0.06)",
    border: "1px solid rgba(139,58,58,0.28)",
  },
  verified: {
    color: "#1B3A2F",
    backgroundColor: "transparent",
    border: "1px solid rgba(201,166,107,0.55)",
  },
};

import type React from "react";

export default function StatusPill({
  label,
  variant = "neutral",
  icon,
  outlined,
}: StatusPillProps) {
  const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.neutral;

  return (
    <span
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        borderRadius: "3px",
        padding: "0.15rem 0.5rem",
        fontSize: "0.6rem",
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {icon && <span style={{ display: "flex", alignItems: "center" }}>{icon}</span>}
      {label}
    </span>
  );
}
