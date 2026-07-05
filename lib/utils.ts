import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ScoreBand = "poor" | "fair" | "good" | "excellent";

export function getBandFromScore(score: number): ScoreBand {
  if (score < 40) return "poor";
  if (score < 60) return "fair";
  if (score < 80) return "good";
  return "excellent";
}

export function getBandLabel(band: string | undefined): string {
  if (!band) return "N/A";
  const b = band.toLowerCase();
  if (b === "poor") return "Poor (High Risk)";
  if (b === "fair") return "Fair (Medium Risk)";
  if (b === "good") return "Good (Satisfactory)";
  if (b === "excellent") return "Excellent (Trusted)";
  return band;
}

export function getScoreBandColor(band: string | undefined): string {
  if (!band) return "#9B9188";
  const b = band.toLowerCase();
  if (b === "poor") return "#8B3A3A"; // Red
  if (b === "fair") return "#8B6914"; // Orange/Gold
  if (b === "good") return "#2E5E4E"; // Green/Teal
  if (b === "excellent") return "#1B3A2F"; // Dark Green
  return "#9B9188";
}

export function getScoreBandBg(band: string | undefined): string {
  if (!band) return "rgba(155, 145, 136, 0.08)";
  const b = band.toLowerCase();
  if (b === "poor") return "rgba(139, 58, 58, 0.06)";
  if (b === "fair") return "rgba(139, 105, 20, 0.06)";
  if (b === "good") return "rgba(46, 94, 78, 0.06)";
  if (b === "excellent") return "rgba(27, 58, 47, 0.06)";
  return "rgba(155, 145, 136, 0.08)";
}

export function getScoreBandBorder(band: string | undefined): string {
  if (!band) return "rgba(155, 145, 136, 0.2)";
  const b = band.toLowerCase();
  if (b === "poor") return "rgba(139, 58, 58, 0.18)";
  if (b === "fair") return "rgba(139, 105, 20, 0.18)";
  if (b === "good") return "rgba(46, 94, 78, 0.18)";
  if (b === "excellent") return "rgba(27, 58, 47, 0.18)";
  return "rgba(155, 145, 136, 0.2)";
}

export function staggerDelay(index: number, baseMs: number = 0) {
  return {
    animationDelay: `${index * 50 + baseMs}ms`,
    animationFillMode: "both" as const,
  };
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDatetime(dateString: string | Date | undefined): string {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
