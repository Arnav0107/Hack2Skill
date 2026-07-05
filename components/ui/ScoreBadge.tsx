import { getBandLabel, getScoreBandColor, getScoreBandBg, getScoreBandBorder } from "@/lib/utils";
import type { ScoreBand } from "@/lib/mockData";

interface ScoreBadgeProps {
  score: number;
  band: ScoreBand;
  size?: "sm" | "md";
  showScore?: boolean;
}

export default function ScoreBadge({
  score,
  band,
  size = "md",
  showScore = true,
}: ScoreBadgeProps) {
  const color = getScoreBandColor(band);
  const bg = getScoreBandBg(band);
  const border = getScoreBandBorder(band);
  const label = getBandLabel(band);

  const padX = size === "sm" ? "0.35rem" : "0.55rem";
  const padY = size === "sm" ? "0.1rem" : "0.175rem";
  const fontSize = size === "sm" ? "0.6rem" : "0.675rem";
  const dotSize = size === "sm" ? 5 : 6;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
        borderRadius: "3px",
        padding: `${padY} ${padX}`,
        fontSize,
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      {showScore && <span style={{ fontVariantNumeric: "tabular-nums" }}>{score}</span>}
      <span>{label}</span>
    </span>
  );
}
