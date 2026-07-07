"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, type UserRole } from "@/lib/auth";
import { loginUser, verifyOtp } from "@/lib/api";
import CreditBridgeLogo from "@/components/ui/CreditBridgeLogo";


import SplitText from "@/components/ui/textanimation";
import ClickSpark from '@/components/ClickSpark';
import Antigravity from '@/components/Antigravity';


export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("msme");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginUser(email, password, role);
    if (result.success) {
      if (result.otpRequired) {
        setOtpRequired(true);
      } else {
        login(email, role);
        if (role === "bank_officer") router.push("/bank");
        else if (role === "admin") router.push("/admin");
        else router.push("/dashboard");
      }
    } else {
      setError(result.error ?? "Login failed.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await verifyOtp(email, otp);
    if (result.success) {
      login(email, role);
      if (role === "bank_officer") router.push("/bank");
      else if (role === "admin") router.push("/admin");
      else router.push("/dashboard");
    } else {
      setError(result.error ?? "OTP verification failed.");
    }
    setLoading(false);
  };

  const ROLES: { value: UserRole; label: string; description: string }[] = [
    { value: "msme", label: "MSME", description: "View your CreditBridge Profile" },
    { value: "bank_officer", label: "Bank Officer", description: "Review applicant portfolio" },
    { value: "admin", label: "Admin", description: "Manage users and roles" },
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

        {/* Right panel — login card */}
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
            <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>{otpRequired ? "Verification" : "Sign In"}</p>
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "#3A342C",
                margin: "0 0 1.75rem",
              }}
            >
              {otpRequired ? "Verify your identity" : "Access your account"}
            </h2>

            <form onSubmit={otpRequired ? handleVerifyOtp : handleLogin}>
              {!otpRequired ? (
                <>
                  {/* Role toggle */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label className="eyebrow" style={{ display: "block", marginBottom: "0.5rem", color: "#6B6259" }}>
                      Sign in as
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
                    />
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom: "1.25rem" }}>
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
                      autoComplete="current-password"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }} htmlFor="otp">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      id="otp"
                      className="input-field"
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      style={{
                        fontSize: "1.25rem",
                        textAlign: "center",
                        letterSpacing: "0.4em",
                        fontFamily: "monospace"
                      }}
                      autoComplete="one-time-code"
                      required
                    />
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.74rem", color: "#8B6914", marginTop: "0.75rem", lineHeight: 1.5 }}>
                      ℹ️ An OTP has been sent. For this demo, check the <b>backend terminal console log</b> to find the code.
                    </p>
                  </div>
                </>
              )}

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

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
              >
                {loading ? "Verifying…" : otpRequired ? "Verify & Sign In →" : "Sign In →"}
              </button>

              {otpRequired && (
                <div style={{ textAlign: "center", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpRequired(false);
                      setOtp("");
                      setError("");
                    }}
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
                    ← Back to credentials
                  </button>
                </div>
              )}
            </form>

            <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
              <button
                type="button"
                onClick={() => router.push("/signup")}
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
                Don't have an account? Sign Up
              </button>
            </div>

            <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(201,166,107,0.2)", paddingTop: "1rem" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: "#9B9188", margin: "0 0 0.3rem", textAlign: "center", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Demo Credentials
              </p>
              <p style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#6B6259", margin: "0", textAlign: "center", lineHeight: 1.8 }}>
                MSME: owner@arjunatextile.in<br />
                Bank: p.venkataraman@sbi.co.in<br />
                Password: password123
              </p>
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
