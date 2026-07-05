// Data Completeness Badge — ALWAYS neutral gold/charcoal tones
// NEVER uses score band colors — visually distinct at a glance
interface DataCompletenessBadgeProps {
  connected: number;
  total: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function DataCompletenessBadge({
  connected,
  total,
  showLabel = true,
  size = "md",
}: DataCompletenessBadgeProps) {
  const fontSize = size === "sm" ? "0.575rem" : "0.625rem";
  const padX = size === "sm" ? "0.35rem" : "0.5rem";
  const padY = size === "sm" ? "0.1rem" : "0.175rem";

  return (
    <span
      className="completeness-badge"
      style={{ fontSize, padding: `${padY} ${padX}` }}
    >
      {/* Small chart icon */}
      <svg
        width={size === "sm" ? 9 : 10}
        height={size === "sm" ? 9 : 10}
        viewBox="0 0 10 10"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <rect x="0" y="4" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.6" />
        <rect x="3" y="2" width="2" height="8" rx="0.5" fill="currentColor" opacity="0.8" />
        <rect x="6" y="0" width="2" height="10" rx="0.5" fill="currentColor" opacity={connected >= total ? "1" : "0.35"} />
        <rect x="9" y="0" width="1" height="10" rx="0.5" fill="currentColor" opacity="0" />
      </svg>
      {showLabel ? (
        <span>
          {connected} of {total} sources
        </span>
      ) : (
        <span>
          {connected}/{total}
        </span>
      )}
    </span>
  );
}
