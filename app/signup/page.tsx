"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";
import type { UserRole } from "@/lib/auth";
import CreditBridgeLogo from "@/components/ui/CreditBridgeLogo";

import SplitText from "@/components/ui/textanimation";
import ClickSpark from '@/components/ClickSpark';
import Antigravity from '@/components/Antigravity';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("msme");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const result = await registerUser(email, password, role);
    if (result.success) {
      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError(result.error ?? "Registration failed.");
    }
    setLoading(false);
  };

  const ROLES: { value: UserRole; label: string; description: string }[] = [
    { value: "msme", label: "MSME", description: "View your CreditBridge Profile" },
    { value: "bank_officer", label: "Bank Officer", description: "Review applicant portfolio" },
  ];

  return (
    <ClickSpark
      sparkColor="#002715ff"
      sparkSize={10}
      sparkRadius={15}
      sparkCount={8}
      duration={400}
    >
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F7F4ED",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {/* Left panel — brand */}
        <div
          style={{
            padding: "3rem 4rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            animation: "fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 0,
            }}
          >
            <Antigravity
              count={200}
              magnetRadius={8}
              ringRadius={7}
              waveSpeed={0.4}
              waveAmplitude={1}
              particleSize={0.7}
              lerpSpeed={0.05}
              color="#002715"
              autoAnimate={false}
              particleVariance={1}
              rotationSpeed={0}
              depthFactor={0.7}
              pulseSpeed={3}
              particleShape="sphere"
              fieldStrength={2.6}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Wordmark */}
            <div style={{ marginBottom: "3rem" }}>
              <CreditBridgeLogo showText={true} width={48} height={48} titleSize="56px" subtitleSize="14px" />
              <SplitText
                tag="h1"
                text="Trusted credit intelligence for India's MSMEs."
                className=""
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "48px",
                  fontWeight: 600,
                  color: "#1B3A2F",
                  margin: "1.5rem 0 1rem",
                  lineHeight: 1.15,
                }}
                splitType="chars"
                delay={20}
                duration={0.6}
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                textAlign="left"
              />
              <SplitText
                tag="p"
                text="A blockchain-verified CreditBridge profile built on GST, UPI, EPFO, and credit bureau data — giving lenders the confidence to say yes."
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "1rem",
                  color: "#6B6259",
                  lineHeight: 1.7,
                  maxWidth: "400px",
                }}
                splitType="words"
                delay={20}
                duration={0.6}
                from={{ opacity: 0, y: 15 }}
                to={{ opacity: 1, y: 0 }}
                textAlign="left"
              />
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: "⬡", label: "Blockchain-verified audit trail" },
                { icon: "◈", label: "4-source data integration: GST, UPI, EPFO, Credit" },
                { icon: "◇", label: "Transparent, explainable sub-scores" },
              ].map((f) => (
                <div
                  key={f.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.82rem",
                    color: "#6B6259",
                  }}
                >
                  <span style={{ color: "#C9A66B", fontSize: "0.9rem", flexShrink: 0 }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>

            {/* Gold divider */}
            <div style={{ marginTop: "3rem", height: "1px", backgroundColor: "rgba(201,166,107,0.3)", maxWidth: "80px" }} />
          </div>
        </div>

        {/* Right panel — register card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            backgroundColor: "#EDE9DF",
            borderLeft: "1px solid rgba(201,166,107,0.2)",
            animation: "fadeUp 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF8F3",
              border: "1px solid rgba(201,166,107,0.25)",
              borderRadius: "6px",
              boxShadow: "0 4px 24px rgba(58,52,44,0.09), 0 1px 4px rgba(58,52,44,0.05)",
              padding: "2.5rem 2.25rem",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Registration</p>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "#3A342C",
                margin: "0 0 1.75rem",
              }}
            >
              Create your account
            </h2>

            <form onSubmit={handleSignup}>
              {/* Role toggle */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label className="eyebrow" style={{ display: "block", marginBottom: "0.5rem", color: "#6B6259" }}>
                  Register as
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        flex: 1,
                        padding: "0.5rem 0.25rem",
                        borderRadius: "4px",
                        border: role === r.value ? "1.5px solid #1B3A2F" : "1px solid rgba(201,166,107,0.35)",
                        backgroundColor: role === r.value ? "#E5EDE9" : "transparent",
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: role === r.value ? "#1B3A2F" : "#9B9188",
                        transition: "all 200ms cubic-bezier(0.22,1,0.36,1)",
                      }}
                      title={r.description}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.7rem", color: "#9B9188", margin: "0.375rem 0 0" }}>
                  {ROLES.find((r) => r.value === role)?.description}
                </p>
              </div>

              {/* Email */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }} htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  className="input-field"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="input-field"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }} htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  className="input-field"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.75rem",
                    color: "#8B3A3A",
                    margin: "0 0 1rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(139,58,58,0.06)",
                    border: "1px solid rgba(139,58,58,0.2)",
                    borderRadius: "4px",
                    animation: "fadeIn 0.3s ease both",
                  }}
                >
                  {error}
                </p>
              )}

              {/* Success */}
              {success && (
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.75rem",
                    color: "#2E5E4E",
                    margin: "0 0 1rem",
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "rgba(46,94,78,0.06)",
                    border: "1px solid rgba(46,94,78,0.2)",
                    borderRadius: "4px",
                    animation: "fadeIn 0.3s ease both",
                  }}
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Registering…" : "Register →"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => router.push("/login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8B6914",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Already have an account? Sign In
              </button>
            </div>
          </div>
        </div>

        {/* Mobile: stack layout */}
        <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="padding: 3rem 4rem"] {
            padding: 2rem 1.5rem !important;
          }
        }
      `}</style>
      </div>
    </ClickSpark>
  );
}
