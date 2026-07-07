"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitBusinessInfo, submitConsent, connectDataSource, generateScore, lookupGstin, sendOtp, verifyOtp, getCurrentMSMEDashboard } from "@/lib/api";
import { SECTORS, REGISTRATION_TYPES } from "@/lib/mockData";
import SourceIcon from "@/components/ui/SourceIcon";
import { useAuth } from "@/lib/auth";
import CreditBridgeLogo from "@/components/ui/CreditBridgeLogo";

const STEPS = ["Business Info", "Data Consent", "Connect Sources", "Generating Score"];

type SourceId = "gst" | "upi" | "epfo" | "credit";
const DATA_SOURCES: { id: SourceId; label: string; description: string }[] = [
  {
    id: "gst",
    label: "GST Data",
    description: "Access your GST filing history to assess tax compliance and revenue patterns over time.",
  },
  {
    id: "upi",
    label: "UPI Transactions",
    description: "Analyse UPI transaction flows to evaluate cash flow stability and business activity.",
  },
  {
    id: "epfo",
    label: "EPFO Records",
    description: "Review employee contribution records to assess operational stability and workforce size.",
  },
  {
    id: "credit",
    label: "Credit Bureau",
    description: "Check your credit bureau report for outstanding credit and repayment history.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceParam = searchParams.get("source");
  const oldScoreParam = searchParams.get("oldScore");
  const { user, isLoading, updateUserName } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }
    if (!isLoading && user?.role !== "msme") {
      router.push("/bank");
      return;
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user || isLoading || sourceParam) return;
    getCurrentMSMEDashboard().then((profile) => {
      if (profile) {
        console.log("Profile already exists, redirecting to dashboard.");
        router.push("/dashboard");
      }
    }).catch(() => {});
  }, [user, isLoading, sourceParam, router]);

  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const stepVal = searchParams.get("step");
    if (stepVal) {
      setStep(parseInt(stepVal, 10) - 1);
    }
    if (sourceParam) {
      setConsented((prev) => ({ ...prev, [sourceParam as SourceId]: true }));
    }
  }, [searchParams, sourceParam]);

  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  // Form state
  const [gstin, setGstin] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [sector, setSector] = useState("");
  const [registrationType, setRegistrationType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sub-step states
  const [subStep, setSubStep] = useState<"1A" | "1B_details" | "1B_otp" | "1C">("1A");
  const [lookupData, setLookupData] = useState<any>(null);
  
  // OTP Verification state
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");

  // Step 1C fields
  const [ownerName, setOwnerName] = useState("");
  const [city, setCity] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");

  // Consent & connection state
  const [consented, setConsented] = useState<Record<SourceId, boolean>>({
    gst: false, upi: false, epfo: false, credit: false,
  });
  const [connecting, setConnecting] = useState<Record<SourceId, "idle" | "loading" | "done">>({
    gst: "idle", upi: "idle", epfo: "idle", credit: "idle",
  });

  // Score generation
  const [progress, setProgress] = useState(0);

  const goToStep = (next: number) => {
    setAnimating(true);
    setDirection(next > step ? "forward" : "back");
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 350);
  };

  const handleGstinLookup = async () => {
    if (!gstin.trim()) {
      setErrors({ gstin: "GSTIN is required." });
      return;
    } else if (!/^[a-zA-Z0-9]{15}$/.test(gstin)) {
      setErrors({ gstin: "GSTIN must be exactly 15 alphanumeric characters." });
      return;
    }
    setErrors({});
    try {
      const res = await lookupGstin(gstin);
      if (res.success && res.business) {
        setLookupData(res.business);
        setBusinessName(res.business.businessName);
        setOwnerName(res.business.ownerName);
        setSector(res.business.sector);
        setRegistrationType(res.business.registrationType);
        setCity(res.business.city);
        setSubStep("1B_details");
      } else {
        setErrors({ gstin: "GSTIN not found or invalid" });
      }
    } catch (err: any) {
      setErrors({ gstin: err.message || "GSTIN lookup failed" });
    }
  };

  const handleSendOtp = async () => {
    if (!mobileNumber.trim()) {
      setErrors({ mobile: "Mobile number is required." });
      return;
    } else if (mobileNumber.trim() !== lookupData.mobileNumber) {
      setErrors({ mobile: "Mobile number does not match GST record." });
      return;
    }
    setErrors({});
    try {
      const res = await sendOtp(user?.email || "");
      if (res.success) {
        setOtpSent(true);
        setOtpMessage("OTP sent to your registered email address for verification.");
      } else {
        setErrors({ mobile: res.error || "Failed to send OTP" });
      }
    } catch (err: any) {
      setErrors({ mobile: err.message || "Failed to send OTP" });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setErrors({ otp: "OTP code is required." });
      return;
    }
    setErrors({});
    try {
      const res = await verifyOtp(user?.email || "", otpCode);
      if (res.success) {
        setOtpVerified(true);
        setSubStep("1C");
      } else {
        setErrors({ otp: res.error || "Invalid OTP code" });
      }
    } catch (err: any) {
      setErrors({ otp: err.message || "OTP verification failed" });
    }
  };

  const handleStep1Submit = async () => {
    const e: Record<string, string> = {};
    if (!businessName.trim()) e.businessName = "Business name is required.";
    if (!ownerName.trim()) e.ownerName = "Owner name is required.";
    if (!sector) e.sector = "Please select a sector.";
    if (!registrationType) e.registrationType = "Please select a registration type.";
    if (!city.trim()) e.city = "City is required.";
    if (!annualTurnover) e.annualTurnover = "Please select annual turnover range.";
    if (!employeeCount) e.employeeCount = "Please select employee count range.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      await submitBusinessInfo({
        businessName,
        sector,
        registrationType,
        gstin,
        ownerName,
        city,
        annualTurnover,
        employeeCount
      });
      updateUserName(businessName);
      goToStep(1);
    } catch (err: any) {
      setErrors({ api: err.message || "Failed to submit business details" });
    }
  };

  const handleStep2Next = async () => {
    const anyConsented = Object.values(consented).some(Boolean);
    if (!anyConsented) {
      setErrors({ consent: "Please consent to at least one data source to proceed." });
      return;
    }
    setErrors({});
    await submitConsent(Object.entries(consented).filter(([, v]) => v).map(([k]) => k));
    goToStep(2);
  };

  const handleConnect = async (id: SourceId) => {
    if (!consented[id]) return;
    setConnecting((prev) => ({ ...prev, [id]: "loading" }));
    try {
      await connectDataSource(id);
      setConnecting((prev) => ({ ...prev, [id]: "done" }));
      if (sourceParam) {
        setTimeout(() => {
          router.push(`/dashboard?recompute=true&oldScore=${oldScoreParam || 0}&source=${id}`);
        }, 1200);
      }
    } catch (err) {
      setConnecting((prev) => ({ ...prev, [id]: "idle" }));
    }
  };

  const handleStep3Next = async () => {
    goToStep(3);
    // Animate progress bar
    let p = 0;
    const interval = setInterval(() => {
      p += 3 + Math.random() * 4;
      setProgress(Math.min(p, 92));
      if (p >= 92) clearInterval(interval);
    }, 100);
    await generateScore();
    setProgress(100);
    setTimeout(() => router.push("/dashboard"), 800);
  };

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F7F4ED",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        style={{
          backgroundColor: "#1B3A2F",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CreditBridgeLogo showText={false} theme="dark" width={24} height={24} />
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#F7F4ED",
              letterSpacing: "-0.01em",
            }}
          >
            CreditBridge <span style={{ fontWeight: 400, color: "rgba(247,244,237,0.6)", fontSize: "0.85rem", marginLeft: "0.25rem" }}>Onboarding</span>
          </span>
        </div>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(247,244,237,0.55)",
          }}
        >
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", backgroundColor: "#EDE9DF", position: "relative" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            backgroundColor: "#C9A66B",
            transition: "width 400ms cubic-bezier(0.22,1,0.36,1)",
          }}
        />
      </div>

      {/* Step labels */}
      <div
        style={{
          display: "flex",
          padding: "0.75rem 1.5rem",
          gap: "0",
          borderBottom: "1px solid rgba(201,166,107,0.2)",
          overflowX: "auto",
        }}
      >
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "fit-content",
              paddingRight: "1rem",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: i <= step ? "#1B3A2F" : "transparent",
                border: `1.5px solid ${i <= step ? "#1B3A2F" : "rgba(201,166,107,0.4)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 400ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {i < step ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <polyline points="1.5,5 4,7.5 8.5,2" stroke="#C9A66B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span style={{ fontFamily: "Inter", fontSize: "0.62rem", fontWeight: 700, color: i <= step ? "#C9A66B" : "#9B9188" }}>
                  {i + 1}
                </span>
              )}
            </div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                color: i === step ? "#3A342C" : i < step ? "#6B6259" : "#9B9188",
                whiteSpace: "nowrap",
                transition: "color 300ms",
              }}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, backgroundColor: i < step ? "rgba(201,166,107,0.5)" : "rgba(201,166,107,0.18)", margin: "0 0.25rem" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "2.5rem 1.5rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            animation: `${animating ? (direction === "forward" ? "stepOut" : "stepOutBack") : "stepIn"} 350ms cubic-bezier(0.22,1,0.36,1) both`,
          }}
        >
          {/* ── STEP 1: Business Info ── */}
          {step === 0 && (
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Step 1 of 4</p>
              
              {/* Sub-step 1A: GSTIN Lookup */}
              {subStep === "1A" && (
                <div>
                  <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                    GSTIN Verification
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
                    Please enter your 15-digit GSTIN Number to fetch your business profile.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        GSTIN Number
                      </label>
                      <input
                        className="input-field"
                        type="text"
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      />
                      {errors.gstin && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.gstin}</p>}
                    </div>
                  </div>

                  <button className="btn-primary" onClick={handleGstinLookup} style={{ marginTop: "2rem", width: "100%", justifyContent: "center" }}>
                    Fetch Business Details →
                  </button>
                </div>
              )}

              {/* Sub-step 1B Details: Read-Only Cards */}
              {subStep === "1B_details" && lookupData && (
                <div>
                  <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                    Verify Business Profile
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
                    We fetched these details from GSTN. Please verify this is your business.
                  </p>

                  {/* Read only info grid */}
                  <div style={{
                    backgroundColor: "#FAF8F3",
                    border: "1px solid rgba(201,166,107,0.22)",
                    borderRadius: "5px",
                    padding: "1.25rem",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.5rem"
                  }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", display: "block" }}>Business Name</span>
                      <strong style={{ fontSize: "0.88rem", color: "#3A342C" }}>{lookupData.businessName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", display: "block" }}>Owner Name</span>
                      <strong style={{ fontSize: "0.88rem", color: "#3A342C" }}>{lookupData.ownerName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", display: "block" }}>Sector</span>
                      <strong style={{ fontSize: "0.88rem", color: "#3A342C" }}>{lookupData.sector}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", display: "block" }}>City / Location</span>
                      <strong style={{ fontSize: "0.88rem", color: "#3A342C" }}>{lookupData.city}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", display: "block" }}>GST Status</span>
                      <strong style={{ fontSize: "0.88rem", color: "#2E6B3E" }}>✅ {lookupData.gstStatus}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "#9B9188", display: "block" }}>Registered Since</span>
                      <strong style={{ fontSize: "0.88rem", color: "#3A342C" }}>{lookupData.registeredSince}</strong>
                    </div>
                  </div>

                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.88rem", fontWeight: 600, color: "#3A342C", marginBottom: "1rem", textAlign: "center" }}>
                    Is this your business?
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
                    <button className="btn-primary" onClick={() => setSubStep("1B_otp")} style={{ width: "100%", justifyContent: "center" }}>
                      YES, VERIFY OWNERSHIP →
                    </button>
                    <button
                      className="btn-link"
                      onClick={() => setSubStep("1A")}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.82rem",
                        color: "#8B6914",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      ← Not my business (Re-enter GSTIN)
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-step 1B OTP: Mobile Verification */}
              {subStep === "1B_otp" && lookupData && (
                <div>
                  <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                    Identity Verification
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
                    Enter the mobile number registered with your GST account to verify ownership.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem", marginBottom: "1.5rem" }}>
                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Registered Mobile Number (Masked: {lookupData.maskedMobile})
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          className="input-field"
                          type="text"
                          placeholder="Enter full 10-digit number"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn-primary"
                          onClick={handleSendOtp}
                          style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
                        >
                          Send OTP
                        </button>
                      </div>
                      {errors.mobile && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.mobile}</p>}
                    </div>

                    {otpSent && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                          Enter OTP Code
                        </label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            className="input-field"
                            type="text"
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            style={{ flex: 1 }}
                          />
                          <button
                            className="btn-primary"
                            onClick={handleVerifyOtp}
                            style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
                          >
                            Verify OTP
                          </button>
                        </div>
                        {otpMessage && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#2E6B3E", margin: "0.25rem 0 0", fontWeight: 500 }}>{otpMessage}</p>}
                        {errors.otp && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.otp}</p>}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                    <button className="btn-secondary" onClick={() => setSubStep("1B_details")} style={{ flex: "0 0 auto" }}>
                      ← Back
                    </button>
                    <button
                      className="btn-primary"
                      disabled={!otpVerified}
                      onClick={() => setSubStep("1C")}
                      style={{ flex: 1, justifyContent: "center", opacity: otpVerified ? 1 : 0.5, cursor: otpVerified ? "pointer" : "not-allowed" }}
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-step 1C: Editable Details Confirmation */}
              {subStep === "1C" && (
                <div>
                  <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                    Confirm Business Details
                  </h2>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
                    Confirm or edit details before proceeding to data consent.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Business Name
                      </label>
                      <input
                        className="input-field"
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                      />
                      {errors.businessName && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.businessName}</p>}
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Owner Name
                      </label>
                      <input
                        className="input-field"
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                      />
                      {errors.ownerName && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.ownerName}</p>}
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Sector
                      </label>
                      <select className="select-field" value={sector} onChange={(e) => setSector(e.target.value)}>
                        <option value="">Select sector</option>
                        {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      {errors.sector && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.sector}</p>}
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Registration Type
                      </label>
                      <select className="select-field" value={registrationType} onChange={(e) => setRegistrationType(e.target.value)}>
                        <option value="">Select registration type</option>
                        {REGISTRATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.registrationType && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.registrationType}</p>}
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        City
                      </label>
                      <input
                        className="input-field"
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                      {errors.city && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.city}</p>}
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Annual Turnover Range
                      </label>
                      <select className="select-field" value={annualTurnover} onChange={(e) => setAnnualTurnover(e.target.value)}>
                        <option value="">Select Turnover Range</option>
                        <option value="Under ₹40L">Under ₹40L</option>
                        <option value="₹40L-1Cr">₹40L-1Cr</option>
                        <option value="₹1Cr-5Cr">₹1Cr-5Cr</option>
                        <option value="Above ₹5Cr">Above ₹5Cr</option>
                      </select>
                      {errors.annualTurnover && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.annualTurnover}</p>}
                    </div>

                    <div>
                      <label className="eyebrow" style={{ display: "block", marginBottom: "0.4rem", color: "#6B6259" }}>
                        Number of Employees
                      </label>
                      <select className="select-field" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)}>
                        <option value="">Select Employee Range</option>
                        <option value="1-10">1-10</option>
                        <option value="10-50">10-50</option>
                        <option value="50-200">50-200</option>
                        <option value="200+">200+</option>
                      </select>
                      {errors.employeeCount && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.25rem 0 0" }}>{errors.employeeCount}</p>}
                    </div>
                  </div>

                  {errors.api && <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B3A3A", margin: "0.75rem 0 0", textAlign: "center" }}>{errors.api}</p>}

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
                    <button className="btn-secondary" onClick={() => setSubStep("1B_otp")} style={{ flex: "0 0 auto" }}>
                      ← Back
                    </button>
                    <button className="btn-primary" onClick={handleStep1Submit} style={{ flex: 1, justifyContent: "center" }}>
                      Continue →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Consent ── */}
          {step === 1 && (
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Step 2 of 4</p>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                Data consent
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
                We access only the data you explicitly consent to. Each source is independently optional — you can still receive a score with partial data.
              </p>

              {errors.consent && (
                <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "#8B3A3A", margin: "0 0 1rem", padding: "0.5rem 0.75rem", border: "1px solid rgba(139,58,58,0.25)", borderRadius: "4px", backgroundColor: "rgba(139,58,58,0.05)" }}>
                  {errors.consent}
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                {DATA_SOURCES.map((src) => (
                  <label
                    key={src.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      padding: "1rem 1.125rem",
                      backgroundColor: "#FAF8F3",
                      border: consented[src.id] ? "1px solid rgba(27,58,47,0.3)" : "1px solid rgba(201,166,107,0.22)",
                      borderRadius: "5px",
                      cursor: "pointer",
                      transition: "border-color 200ms",
                      boxShadow: "0 1px 4px rgba(58,52,44,0.04)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={consented[src.id]}
                      onChange={(e) => setConsented((prev) => ({ ...prev, [src.id]: e.target.checked }))}
                      style={{ marginTop: "2px", accentColor: "#1B3A2F", flexShrink: 0 }}
                    />
                    <SourceIcon source={src.id} active={consented[src.id]} size={36} showLabel={false} />
                    <div>
                      <span style={{ fontFamily: "Playfair Display, serif", fontSize: "0.95rem", fontWeight: 600, color: "#3A342C", display: "block", marginBottom: "0.25rem" }}>
                        {src.label}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: "#6B6259", lineHeight: 1.5 }}>
                        {src.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn-secondary" onClick={() => { setSubStep("1C"); goToStep(0); }} style={{ flex: "0 0 auto" }}>← Back</button>
                <button className="btn-primary" onClick={handleStep2Next} style={{ flex: 1, justifyContent: "center" }}>Continue →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Connect ── */}
          {step === 2 && (
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.375rem" }}>Step 3 of 4</p>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                Connect your data sources
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 1.75rem", lineHeight: 1.6 }}>
                Each connection is independent. Skipping a source is fine — you will still receive a score.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                {DATA_SOURCES.filter(src => {
                  const state = connecting[src.id];
                  if (state === "done") return false;
                  if (sourceParam && src.id !== sourceParam) return false;
                  return true;
                }).map((src) => {
                  const isConsented = consented[src.id];
                  const state = connecting[src.id];

                  return (
                    <div
                      key={src.id}
                      style={{
                        padding: "1rem 1.125rem",
                        backgroundColor: "#FAF8F3",
                        border: state === "done"
                          ? "1px solid rgba(27,58,47,0.3)"
                          : "1px solid rgba(201,166,107,0.22)",
                        borderRadius: "5px",
                        boxShadow: "0 1px 4px rgba(58,52,44,0.04)",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        opacity: isConsented ? 1 : 0.5,
                      }}
                    >
                      <SourceIcon source={src.id} active={state === "done"} size={36} showLabel={false} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: "Playfair Display, serif", fontSize: "0.92rem", fontWeight: 600, color: "#3A342C", display: "block" }}>
                          {src.label}
                        </span>
                        {!isConsented && (
                          <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#9B9188" }}>
                            Not consented — skipped
                          </span>
                        )}
                        {isConsented && state === "idle" && (
                          <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#9B9188" }}>
                            Ready to connect
                          </span>
                        )}
                        {isConsented && state === "done" && (
                          <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#3E6B45", fontWeight: 500 }}>
                            ✓ Connected successfully
                          </span>
                        )}
                        {isConsented && state !== "done" && state !== "idle" && (
                          <span style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#8B6914" }}>
                            Connecting…
                          </span>
                        )}
                      </div>
                      {isConsented && state !== "done" && (
                        <button
                          onClick={() => handleConnect(src.id)}
                          disabled={state === "loading"}
                          style={{
                            backgroundColor: state === "loading" ? "rgba(201,166,107,0.15)" : "#1B3A2F",
                            color: state === "loading" ? "#9B9188" : "#C9A66B",
                            border: "none",
                            borderRadius: "4px",
                            padding: "0.45rem 0.875rem",
                            fontSize: "0.72rem",
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 600,
                            letterSpacing: "0.07em",
                            textTransform: "uppercase",
                            cursor: state === "loading" ? "not-allowed" : "pointer",
                            transition: "background 200ms",
                            flexShrink: 0,
                          }}
                        >
                          {state === "loading" ? "Connecting…" : "Connect"}
                        </button>
                      )}
                      {isConsented && state === "done" && (
                        <span style={{ color: "#3E6B45", fontSize: "1.1rem", flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Skipped source note */}
              {DATA_SOURCES.some((s) => consented[s.id] && connecting[s.id] === "idle") && (
                <p style={{ fontFamily: "Inter", fontSize: "0.75rem", color: "#9B9188", margin: "0 0 1.5rem", padding: "0.5rem 0.75rem", border: "1px solid rgba(201,166,107,0.25)", borderRadius: "4px" }}>
                  You can still get a score — it may be based on fewer data sources if some are skipped.
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                {sourceParam ? (
                  <button
                    className="btn-secondary"
                    onClick={() => router.push("/dashboard")}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    ← Return to Dashboard
                  </button>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={() => goToStep(1)} style={{ flex: "0 0 auto" }}>← Back</button>
                    <button className="btn-primary" onClick={handleStep3Next} style={{ flex: 1, justifyContent: "center" }}>
                      Generate My Score →
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Generating ── */}
          {step === 3 && (
            <div style={{ textAlign: "center", paddingTop: "2rem" }}>
              <p className="eyebrow" style={{ marginBottom: "1rem" }}>Step 4 of 4</p>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "1.5rem", fontWeight: 600, color: "#3A342C", margin: "0 0 0.5rem" }}>
                Generating your CreditBridge Profile…
              </h2>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: "#9B9188", margin: "0 0 2.5rem", lineHeight: 1.6 }}>
                We are computing your score from all connected data sources. This takes just a moment.
              </p>

              {/* Gold progress bar */}
              <div
                style={{
                  height: "4px",
                  backgroundColor: "rgba(201,166,107,0.2)",
                  borderRadius: "2px",
                  overflow: "hidden",
                  marginBottom: "0.75rem",
                  maxWidth: "360px",
                  margin: "0 auto 0.75rem",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${progress}%`,
                    backgroundColor: "#C9A66B",
                    borderRadius: "2px",
                    transition: "width 300ms cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </div>
              <p style={{ fontFamily: "Inter", fontSize: "0.72rem", color: "#9B9188" }}>
                {progress < 30 ? "Fetching data…" : progress < 60 ? "Running model…" : progress < 90 ? "Computing sub-scores…" : progress < 100 ? "Verifying on blockchain…" : "Complete!"}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes stepOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-24px); }
        }
        @keyframes stepOutBack {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(24px); }
        }
      `}</style>
    </div>
  );
}
