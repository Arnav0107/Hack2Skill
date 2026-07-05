import type { MSMERecord } from "@/lib/mockData";

interface FraudAlertPanelProps {
  applicants: MSMERecord[];
  onSelect: (id: string) => void;
}

export default function FraudAlertPanel({ applicants, onSelect }: FraudAlertPanelProps) {
  const flagged = applicants.filter((a) => a.fraudFlag);

  return (
    <div className="card-static" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "rgba(139,58,58,0.12)",
            flexShrink: 0,
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L9 9H1L5 1Z" stroke="#8B3A3A" strokeWidth="1.2" fill="none" />
            <rect x="4.5" y="4" width="1" height="2.5" rx="0.5" fill="#8B3A3A" />
            <rect x="4.5" y="7.2" width="1" height="1" rx="0.5" fill="#8B3A3A" />
          </svg>
        </span>
        <p className="eyebrow" style={{ color: "#8B3A3A", margin: 0 }}>
          Fraud Alert Panel
        </p>
        <span
          style={{
            marginLeft: "auto",
            backgroundColor: "rgba(139,58,58,0.1)",
            color: "#8B3A3A",
            border: "1px solid rgba(139,58,58,0.22)",
            borderRadius: "3px",
            padding: "0.08rem 0.45rem",
            fontSize: "0.62rem",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          {flagged.length} flagged
        </span>
      </div>

      {flagged.length === 0 ? (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: "#9B9188", margin: 0 }}>
          No fraud flags in the current portfolio.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {flagged.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a.id)}
              style={{
                textAlign: "left",
                backgroundColor: "rgba(139,58,58,0.04)",
                border: "1px solid rgba(139,58,58,0.22)",
                borderLeft: "3px solid rgba(139,58,58,0.5)",
                borderRadius: "4px",
                padding: "0.75rem 0.875rem",
                cursor: "pointer",
                width: "100%",
                transition: "background 200ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(139,58,58,0.07)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(139,58,58,0.04)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <span
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#3A342C",
                  }}
                >
                  {a.businessName}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#8B3A3A",
                  }}
                >
                  Score: {a.score}
                </span>
              </div>
              {a.fraudNote && (
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.73rem",
                    color: "#8B3A3A",
                    margin: 0,
                    lineHeight: 1.5,
                    opacity: 0.85,
                  }}
                >
                  {a.fraudNote}
                </p>
              )}
              <span
                style={{
                  display: "inline-block",
                  marginTop: "0.4rem",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "#8B3A3A",
                  opacity: 0.7,
                }}
              >
                View full record →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
