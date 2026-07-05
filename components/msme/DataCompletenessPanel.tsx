import SourceIcon from "@/components/ui/SourceIcon";
import type { DataSource } from "@/lib/mockData";

interface DataCompletenessPanelProps {
  connected: number;
  total: number;
  sources: DataSource[];
}

export default function DataCompletenessPanel({
  connected,
  total,
  sources,
}: DataCompletenessPanelProps) {
  return (
    <div className="card-static" style={{ padding: "1.5rem" }}>
      {/* Header */}
      <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>
        Data Completeness
      </p>
      <h3
        style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "1rem",
          fontWeight: 600,
          color: "#3A342C",
          margin: "0 0 0.25rem",
        }}
      >
        Score based on{" "}
        <span style={{ color: "#1B3A2F" }}>
          {connected} of {total}
        </span>{" "}
        data sources
      </h3>
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "0.78rem",
          color: "#9B9188",
          margin: "0 0 1.25rem",
          lineHeight: 1.5,
        }}
      >
        {total - connected > 0
          ? `Connect ${total - connected} more source${total - connected > 1 ? "s" : ""} to improve score accuracy.`
          : "All data sources connected — full confidence score."}
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: "3px",
          backgroundColor: "rgba(201,166,107,0.18)",
          borderRadius: "2px",
          marginBottom: "1.25rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${(connected / total) * 100}%`,
            backgroundColor: "#C9A66B",
            borderRadius: "2px",
            transition: "width 600ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      {/* Source icons */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {sources.map((src) => (
          <SourceIcon
            key={src.id}
            source={src.id}
            active={src.connected}
            size={44}
            showLabel={true}
          />
        ))}
      </div>

      {/* Missing source notes */}
      {sources.some((s) => !s.connected) && (
        <div
          style={{
            marginTop: "1rem",
            borderTop: "1px solid rgba(201,166,107,0.18)",
            paddingTop: "0.875rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.375rem",
          }}
        >
          {sources
            .filter((s) => !s.connected)
            .map((s) => (
              <p
                key={s.id}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.75rem",
                  color: "#9B9188",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                <span className="completeness-badge" style={{ marginRight: "0.4rem" }}>
                  {s.label}
                </span>
                not connected — your score may be based on fewer data signals.
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
