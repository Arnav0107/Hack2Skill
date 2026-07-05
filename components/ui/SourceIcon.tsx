// Source icon for GST / UPI / EPFO / Credit Bureau
// active = solid with color; inactive = outlined/dashed/faded

interface SourceIconProps {
  source: "gst" | "upi" | "epfo" | "credit";
  active: boolean;
  size?: number;
  showLabel?: boolean;
}

const SOURCE_CONFIG = {
  gst: { label: "GST", abbr: "G", color: "#3E6B45" },
  upi: { label: "UPI", abbr: "U", color: "#1B3A2F" },
  epfo: { label: "EPFO", abbr: "E", color: "#8B6914" },
  credit: { label: "Credit", abbr: "CB", color: "#3A342C" },
};

export default function SourceIcon({
  source,
  active,
  size = 40,
  showLabel = true,
}: SourceIconProps) {
  const config = SOURCE_CONFIG[source];
  const fontSize = size * 0.3;
  const labelFontSize = size * 0.22;

  return (
    <div
      className="flex flex-col items-center gap-1"
      style={{ opacity: active ? 1 : 0.38 }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "5px",
          border: active
            ? `1.5px solid ${config.color}`
            : "1.5px dashed rgba(58,52,44,0.3)",
          backgroundColor: active ? `${config.color}14` : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize,
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            color: active ? config.color : "#9B9188",
            letterSpacing: "0.02em",
          }}
        >
          {config.abbr}
        </span>
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: labelFontSize,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            color: active ? "#3A342C" : "#9B9188",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
