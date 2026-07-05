require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");

const { computeStubScore, computeJourneyStub } = require("./services/scoringService");
const { runFraudChecks } = require("./services/fraudEngine");
const { pinToIPFS } = require("./services/ipfsService");
const { anchorScoreRecord, verifyRecord } = require("./services/blockchainService");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "saksham-super-secret-key-2026-hackathon";

app.use(cors());
app.use(express.json());

// Configure email transporter
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log("📝 Nodemailer: Configured using custom SMTP settings.");
} else {
  console.log("📝 Nodemailer: SMTP environment variables not found.");
}

// Sandbox Ethereal SMTP transporter fallback if no custom configuration is supplied
let etherealTransporter = null;
if (!transporter) {
  nodemailer.createTestAccount().then((account) => {
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    console.log("📝 Nodemailer: Configured Ethereal sandboxed SMTP server.");
  }).catch(err => {
    console.log("⚠️ Nodemailer: Failed to load Ethereal sandbox.", err.message);
  });
}

// Format and send OTP emails
async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Saksham Team" <no-reply@saksham-fhc.in>',
    to: email,
    subject: "Saksham Secure OTP Verification Code",
    text: `Your 6-digit verification code is: ${otp}. This code is valid for 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #c9a66b; border-radius: 8px;">
        <h2 style="color: #1b3a2f; text-align: center; border-bottom: 2px solid #c9a66b; padding-bottom: 10px; margin-top: 0;">Saksham Identity Verification</h2>
        <p style="font-size: 16px; color: #3a342c;">Hello,</p>
        <p style="font-size: 16px; color: #3a342c;">Your one-time password (OTP) verification code for accessing your account is:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #1b3a2f; letter-spacing: 5px; background: #e5ede9; padding: 10px 20px; border-radius: 4px; border: 1px solid #1b3a2f;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #9b9188; border-top: 1px solid #e5ede9; padding-top: 15px; margin-top: 25px;">
          This verification code is valid for 10 minutes. If you did not request this code, please ignore this email.
        </p>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Custom SMTP: Verification email successfully dispatched to ${email}`);
    } catch (err) {
      console.error(`❌ Custom SMTP Failed for ${email}:`, err.message);
    }
  } else if (etherealTransporter) {
    try {
      const info = await etherealTransporter.sendMail(mailOptions);
      console.log(`✉️ Ethereal SMTP: Verification email dispatched to ${email}`);
      console.log(`👉 Sandbox Preview Link: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (err) {
      console.error(`❌ Ethereal SMTP Failed for ${email}:`, err.message);
    }
  } else {
    console.log("❌ Mail Services Unavailable. Outputting code to console.");
  }
}

// In-memory OTP storage for the OTP Verification Flow
// Format: email -> { otp, role, expires }
const otpStore = new Map();

// ── MIDDLEWARES ──

// Authenticate JWT Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: "Access token missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

// Check Role
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: "Unauthorized role access" });
    }
    next();
  };
}

// ── API ROUTES ──

// 1. Auth Endpoints
// POST /api/v1/auth/register
app.post("/api/v1/auth/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  if (!["msme", "bank_officer", "admin"].includes(role)) {
    return res.status(400).json({ success: false, error: "Invalid role specified" });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role
      }
    });

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/auth/send-otp (Optional utility trigger)
app.post("/api/v1/auth/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  otpStore.set(email, {
    otp,
    expires: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
  });

  console.log(`\n==============================================`);
  console.log(`[SMS/OTP SERVICE] New login OTP requested for ${email}`);
  console.log(`👉 OTP CODE: ${otp} (Expires in 10m)`);
  console.log(`==============================================\n`);

  await sendOtpEmail(email, otp);

  res.json({ success: true, message: "OTP sent successfully (check backend terminal console)" });
});

// POST /api/v1/auth/login
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ success: false, error: "Missing email, password, or role" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== role) {
      return res.status(400).json({ success: false, error: "Invalid email or role" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ success: false, error: "Invalid password" });
    }

    // Generate login OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    otpStore.set(email, {
      otp,
      role: user.role,
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
    });

    console.log(`\n==============================================`);
    console.log(`[SMS/OTP SERVICE] Login attempt successful for ${email}`);
    console.log(`👉 VERIFICATION OTP: ${otp} (Check backend console to log in)`);
    console.log(`==============================================\n`);

    await sendOtpEmail(email, otp);

    // Signal frontend that OTP is required to log in
    res.json({
      success: true,
      otpRequired: true,
      email,
      message: "Credentials valid. OTP sent to terminal console."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/auth/verify-otp
app.post("/api/v1/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP are required" });
  }

  const record = otpStore.get(email);
  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ success: false, error: "OTP expired or not requested" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ success: false, error: "Invalid OTP code entered" });
  }

  // Clear OTP from store after successful verification
  otpStore.delete(email);

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      role: user.role,
      user: { email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/auth/me
app.get("/api/v1/auth/me", authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      email: req.user.email,
      role: req.user.role
    }
  });
});

// 2. Onboarding Endpoints (Linked to User JWT Session)
// POST /api/v1/onboarding/business-info
app.post("/api/v1/onboarding/business-info", authenticateToken, async (req, res) => {
  const { businessName, sector, registrationType } = req.body;
  if (!businessName || !sector || !registrationType) {
    return res.status(400).json({ success: false, error: "Missing profile details" });
  }

  try {
    // Check if MSME profile already exists for this user
    let profile = await prisma.mSMEProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (profile) {
      // Update existing profile
      profile = await prisma.mSMEProfile.update({
        where: { id: profile.id },
        data: { businessName, sector, registrationType }
      });
    } else {
      // Create new profile
      const count = await prisma.mSMEProfile.count();
      const customId = `msme-${String(count + 1).padStart(3, "0")}`;

      // --- ML scoring fields ---
      const ML_SECTORS = [
        "Textile Manufacturing", "Retail Trade", "Food Processing",
        "IT Services", "Construction", "Agriculture"
      ];
      const assignedSector = sector || ML_SECTORS[Math.floor(Math.random() * ML_SECTORS.length)];

      // registrationDate: ~25% of businesses are under 3 months old (new-to-credit)
      const _now = new Date();
      const isNewBusiness = Math.random() < 0.25;
      const maxDaysAgo = isNewBusiness ? 89 : 365 * 3;
      const minDaysAgo = isNewBusiness ? 5 : 90;
      const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
      const registrationDate = new Date(_now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const promoterCreditScore   = Math.floor(300 + Math.random() * 601);           // 300–900
      const commercialAssetsValue = Math.round((5  + Math.random() * 195) * 100000); // 5L–2Cr
      const bankAssetValue        = Math.round((2  + Math.random() * 98)  * 100000); // 2L–1Cr
      const aaLinkedAccountsCount = Math.floor(1 + Math.random() * 5);              // 1–5

      profile = await prisma.mSMEProfile.create({
        data: {
          id: customId,
          userId: req.user.id,
          businessName,
          sector: assignedSector,
          registrationType,
          region: "West",
          registeredOn: registrationDate,
          registrationDate,
          promoterCreditScore,
          commercialAssetsValue,
          bankAssetValue,
          aaLinkedAccountsCount
        }
      });
    }

    // Setup a default journey milestone (safe find-or-create)
    const existingMilestone = await prisma.journeyMilestone.findFirst({ where: { msmeId: profile.id } });
    if (!existingMilestone) {
      await prisma.journeyMilestone.create({
        data: {
          msmeId: profile.id,
          stage: "provisional",
          nextAction: "Consent to data sources to generate score projection.",
          projectedScoreLow: 400,
          projectedScoreHigh: 600
        }
      });
    }

    res.json({ success: true, msmeId: profile.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/onboarding/consent
app.post("/api/v1/onboarding/consent", authenticateToken, async (req, res) => {
  const { sources } = req.body; // array of sources e.g. ["gst", "upi"]
  if (!sources || !Array.isArray(sources)) {
    return res.status(400).json({ success: false, error: "Sources array is required" });
  }

  try {
    const profile = await prisma.mSMEProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "MSME Profile not found. Create business info first." });
    }

    // Remove old consents for these sources (if any) and write new consents
    await prisma.consent.deleteMany({
      where: { msmeId: profile.id, dataSource: { in: sources } }
    });

    const consentData = sources.map(src => ({
      msmeId: profile.id,
      dataSource: src,
      consented: true
    }));

    await prisma.consent.createMany({ data: consentData });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/onboarding/connect/:source
app.post("/api/v1/onboarding/connect/:source", authenticateToken, async (req, res) => {
  const { source } = req.params;
  if (!["gst", "upi", "epfo", "credit"].includes(source)) {
    return res.status(400).json({ success: false, error: "Invalid data source" });
  }

  try {
    const profile = await prisma.mSMEProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "MSME Profile not found" });
    }

    // Mark consent as active (safe find-or-create)
    const existingConsent = await prisma.consent.findFirst({ where: { msmeId: profile.id, dataSource: source } });
    if (existingConsent) {
      await prisma.consent.update({ where: { id: existingConsent.id }, data: { consented: true } });
    } else {
      await prisma.consent.create({ data: { msmeId: profile.id, dataSource: source, consented: true } });
    }

    const now = new Date();
    const getPastDate = (daysAgo) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Age-aware row count: a 20-day-old business gets 0 GST rows, not 12
    const regDate = profile.registrationDate || profile.registeredOn || profile.createdAt;
    const ageInMs     = now.getTime() - new Date(regDate).getTime();
    const ageInDays   = Math.floor(ageInMs / (24 * 60 * 60 * 1000));
    const ageInMonths = Math.floor(ageInDays / 30);

    // Seed mock transactional logs for this specific connected source
    if (source === "gst") {
      await prisma.gSTFiling.deleteMany({ where: { msmeId: profile.id } });
      const rowCount = Math.min(12, ageInMonths);  // 0 rows if business < 1 month old
      const complianceRate = 0.5 + Math.random() * 0.5;  // 50–100% per-business on-time rate
      const gstData = [];
      for (let i = 1; i <= rowCount; i++) {
        gstData.push({
          msmeId: profile.id,
          period: getPastDate(i * 30),
          filedOnTime: Math.random() < complianceRate,
          turnover: Math.round((200000 + Math.random() * 800000) * 100) / 100
        });
      }
      if (gstData.length > 0) await prisma.gSTFiling.createMany({ data: gstData });

    } else if (source === "upi") {
      await prisma.uPITransaction.deleteMany({ where: { msmeId: profile.id } });
      const rowCount = Math.min(30, ageInDays);  // 0 rows if business < 1 day old
      const upiData = [];
      for (let i = 1; i <= rowCount; i++) {
        const amount = Math.round(1000 + Math.random() * 100000);
        upiData.push({
          msmeId: profile.id,
          txnDate: getPastDate(i),
          txnType: Math.random() > 0.4 ? "credit" : "debit",
          amount,
          flaggedLarge: amount > 80000
        });
      }
      if (upiData.length > 0) await prisma.uPITransaction.createMany({ data: upiData });

    } else if (source === "epfo") {
      await prisma.ePFORecord.deleteMany({ where: { msmeId: profile.id } });
      const rowCount = Math.min(6, ageInMonths);  // 0 rows if business < 1 month old
      const baseEmpCount = Math.floor(3 + Math.random() * 97);  // 3–100 employees
      const epfoData = [];
      for (let i = 1; i <= rowCount; i++) {
        epfoData.push({
          msmeId: profile.id,
          period: getPastDate(i * 30),
          employeeCount: baseEmpCount + Math.floor(Math.random() * 5 - 2),
          contributionPaid: Math.random() > 0.15  // 85% compliance
        });
      }
      if (epfoData.length > 0) await prisma.ePFORecord.createMany({ data: epfoData });
    }

    res.json({ success: true, message: `Mock dataset seeded for source: ${source}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/onboarding/generate-score
app.post("/api/v1/onboarding/generate-score", authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.mSMEProfile.findFirst({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "MSME Profile not found" });
    }

    // Call internal recompute code (re-uses calculation)
    const result = await triggerScoreCalculation(profile.id);
    res.json({
      success: true,
      msmeId: profile.id,
      score: result.score,
      band: result.band
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/msme/me/dashboard
app.get("/api/v1/msme/me/dashboard", authenticateToken, requireRole(["msme"]), async (req, res) => {
  try {
    const profile = await prisma.mSMEProfile.findFirst({
      where: { userId: req.user.id },
      include: {
        scores: {
          orderBy: { computedAt: "desc" },
          include: { breakdowns: true, auditRecords: true }
        },
        consents: true,
        fraudFlags: true
      }
    });

    if (!profile) {
      return res.status(404).json({ success: false, error: "MSME profile not found for this user." });
    }

    const latestScore = profile.scores[0];
    const trendScores = profile.scores.slice(0, 6).reverse().map(s => s.score);
    const trendLabels = profile.scores.slice(0, 6).reverse().map(s => {
      return s.computedAt.toLocaleDateString("en-US", { month: "short" });
    });

    // If there's no trend data, provide some defaults based on latest score
    const defaultTrendScores = trendScores.length > 0 ? trendScores : [latestScore ? latestScore.score : 300];
    const defaultTrendLabels = trendLabels.length > 0 ? trendLabels : [new Date().toLocaleDateString("en-US", { month: "short" })];

    const dataSources = [
      { id: "gst", label: "GST", connected: profile.consents.some(c => c.dataSource === "gst" && c.consented) },
      { id: "upi", label: "UPI", connected: profile.consents.some(c => c.dataSource === "upi" && c.consented) },
      { id: "epfo", label: "EPFO", connected: profile.consents.some(c => c.dataSource === "epfo" && c.consented) },
      { id: "credit", label: "Credit Bureau", connected: profile.consents.some(c => c.dataSource === "credit" && c.consented) },
    ];

    const subScoresTemplate = [
      {
        id: "cash_flow",
        label: "Cash Flow Stability",
        score: 70,
        band: "good",
        summary: "Consistent monthly inflows with low volatility",
        dataSources: ["gst", "upi"],
        whyFactors: ["Regular cash inflows observed", "Low coefficient of variation"],
        contributors: [
          { label: "Revenue consistency", impact: 80, positive: true },
          { label: "UPI inflow growth", impact: 60, positive: true }
        ],
        dataCompleteness: { current: 12, total: 12, unit: "months" }
      },
      {
        id: "compliance",
        label: "Compliance Score",
        score: 75,
        band: "good",
        summary: "Excellent regulatory standing across filings",
        dataSources: ["gst", "credit"],
        whyFactors: ["No GST defaults observed", "Credit bureau shows no adverse remarks"],
        contributors: [
          { label: "GST filing regularity", impact: 90, positive: true },
          { label: "Clean credit record", impact: 80, positive: true }
        ],
        dataCompleteness: { current: 12, total: 12, unit: "months" }
      },
      {
        id: "growth",
        label: "Growth Trend",
        score: 65,
        band: "good",
        summary: "Moderate revenue growth trend",
        dataSources: ["gst"],
        whyFactors: ["Stable YoY GST turnover growth"],
        contributors: [
          { label: "YoY growth", impact: 70, positive: true }
        ],
        dataCompleteness: { current: 12, total: 12, unit: "months" }
      },
      {
        id: "operational",
        label: "Operational Stability",
        score: 60,
        band: "fair",
        summary: "Estimated stability score from available data",
        dataSources: ["epfo"],
        whyFactors: ["Consistent employee workforce records"],
        contributors: [
          { label: "EPFO compliance", impact: 75, positive: true }
        ],
        dataCompleteness: { current: 6, total: 12, unit: "months" }
      },
      {
        id: "trust",
        label: "Trust & Integrity",
        score: 80,
        band: "good",
        summary: "Strong digital footprint and verified identity",
        dataSources: ["credit"],
        whyFactors: ["Identity cross-verification match 100%"],
        contributors: [
          { label: "Verified GSTIN", impact: 95, positive: true }
        ],
        dataCompleteness: { current: 1, total: 1, unit: "check" }
      }
    ];

    // Map database breakdowns if they exist
    let subScores = subScoresTemplate;
    if (latestScore && latestScore.breakdowns && latestScore.breakdowns.length > 0) {
      subScores = latestScore.breakdowns.map(b => {
        const idMap = {
          "Cash Flow Stability": "cash_flow",
          "Compliance Score": "compliance",
          "Growth Trend": "growth",
          "Operational Stability": "operational",
          "Trust & Integrity": "trust"
        };
        const template = subScoresTemplate.find(t => t.label === b.cardLabel) || subScoresTemplate[0];
        
        let bandVal = "poor";
        if (b.value >= 75) bandVal = "excellent";
        else if (b.value >= 60) bandVal = "good";
        else if (b.value >= 40) bandVal = "fair";

        return {
          ...template,
          id: idMap[b.cardLabel] || b.cardLabel.toLowerCase().replace(/[^a-z]/g, ""),
          score: b.value,
          band: bandVal,
          summary: b.explanation || template.summary
        };
      });
    }

    const auditRecord = latestScore && latestScore.auditRecords[0];

    res.json({
      id: profile.id,
      businessName: profile.businessName,
      sector: profile.sector,
      registrationType: profile.registrationType,
      score: latestScore ? latestScore.score : 300,
      band: latestScore ? latestScore.band.toLowerCase() : "poor",
      dataCompleteness: {
        connected: profile.consents.filter(c => c.consented).length,
        total: 4
      },
      dataSources,
      blockchainVerified: latestScore ? true : false,
      fraudFlag: profile.fraudFlags.length > 0,
      fraudNote: profile.fraudFlags.length > 0 ? `${profile.fraudFlags.length} risk flags detected.` : null,
      date: latestScore ? latestScore.computedAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      trendScores: defaultTrendScores,
      trendLabels: defaultTrendLabels,
      subScores,
      auditId: auditRecord ? auditRecord.id : "audit-none",
      ownerEmail: req.user.email
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// 3. MSME Specific Score/Simulation Endpoints
// Helper function to recompute and write scores + anchor to blockchain
async function triggerScoreCalculation(msmeId) {
  // Query all connected sources
  const consents = await prisma.consent.findMany({ where: { msmeId, consented: true } });
  const connectedSources = consents.map(c => c.dataSource);

  const gstFilings = await prisma.gSTFiling.findMany({ where: { msmeId } });
  const upiTxns = await prisma.uPITransaction.findMany({ where: { msmeId } });
  const epfoRecords = await prisma.ePFORecord.findMany({ where: { msmeId } });

  // 1. Calculate parameters for stub formula
  const dataPointsAvailable = gstFilings.length + epfoRecords.length + (upiTxns.length > 0 ? 1 : 0);

  // gstPunctuality: percent of filings filed on time
  const onTimeGst = gstFilings.filter(f => f.filedOnTime).length;
  const gstPunctuality = gstFilings.length > 0 ? Math.round((onTimeGst / gstFilings.length) * 100) : 70;

  // cashFlowConsistency: 0-100 rating based on credit transaction ratio
  // If we have UPI credits, let's look at their regularity
  const cashFlowConsistency = upiTxns.length > 0 ? 80 : 50;

  // payrollRegularity: EPFO payments on time
  const onTimeEpfo = epfoRecords.filter(r => r.contributionPaid).length;
  const payrollRegularity = epfoRecords.length > 0 ? Math.round((onTimeEpfo / epfoRecords.length) * 100) : 0;

  // Fetch Sector prior if available
  const profile = await prisma.mSMEProfile.findUnique({ where: { id: msmeId } });
  const prior = await prisma.sectorPrior.findFirst({
    where: {
      sector: profile.sector,
      employeeBand: profile.employeeBand
    }
  });
  const sectorPriorFallback = prior ? prior.priorScoreMean : 640;

  // 2. Run Stub scoring
  const calculation = computeStubScore({
    gstPunctuality,
    cashFlowConsistency,
    payrollRegularity,
    dataPointsAvailable,
    sectorPriorFallback
  });

  // 3. Run Fraud Checks (creates logs in database)
  const fraudFlags = await runFraudChecks(prisma, msmeId);
  const hasFraud = fraudFlags.length > 0;

  // 4. Save Score to database
  const savedScore = await prisma.score.create({
    data: {
      msmeId,
      score: calculation.score,
      band: calculation.band,
      isProvisional: calculation.is_provisional,
      alpha: calculation.alpha,
      modelVersion: "stub-v0"
    }
  });

  // 5. Add Breakdown
  await prisma.scoreBreakdown.createMany({
    data: [
      { scoreId: savedScore.id, cardLabel: "Cash Flow Stability", value: cashFlowConsistency, explanation: "Based on monthly transactions." },
      { scoreId: savedScore.id, cardLabel: "Compliance Score", value: gstPunctuality, explanation: "Based on GST filings punctuality." },
      { scoreId: savedScore.id, cardLabel: "Growth Trend", value: Math.round(gstPunctuality * 0.8), explanation: "Sales delta trends." },
      { scoreId: savedScore.id, cardLabel: "Operational Stability", value: payrollRegularity, explanation: "EPFO payment consistency." },
      { scoreId: savedScore.id, cardLabel: "Trust & Integrity", value: hasFraud ? 35 : 90, explanation: "System security status." }
    ]
  });

  // 6. Update Journey Milestone (safe find-or-create)
  const journey = computeJourneyStub(dataPointsAvailable);
  const existingJourney = await prisma.journeyMilestone.findFirst({ where: { msmeId } });
  if (existingJourney) {
    await prisma.journeyMilestone.update({
      where: { id: existingJourney.id },
      data: {
        stage: journey.stage,
        nextAction: journey.next_action,
        projectedScoreLow: journey.projected_score_low,
        projectedScoreHigh: journey.projected_score_high,
        updatedAt: new Date()
      }
    });
  } else {
    await prisma.journeyMilestone.create({
      data: {
        msmeId,
        stage: journey.stage,
        nextAction: journey.next_action,
        projectedScoreLow: journey.projected_score_low,
        projectedScoreHigh: journey.projected_score_high
      }
    });
  }

  // 7. Assemble blockchain audit payload
  const inputsSummary = {
    gst_filings_count: gstFilings.length,
    upi_days_available: upiTxns.length,
    epfo_regularity: epfoRecords.length > 0 ? (onTimeEpfo / epfoRecords.length) : 0
  };

  const auditPayload = {
    msme_id: msmeId,
    score: calculation.score,
    band: calculation.band,
    model_version: "stub-v0",
    inputs_summary: inputsSummary,
    computed_at: savedScore.computedAt.toISOString()
  };

  // 8. Upload to IPFS
  const ipfsCid = await pinToIPFS(JSON.stringify(auditPayload));

  // 9. Anchor to Blockchain
  const blockchainAnchor = await anchorScoreRecord(msmeId, savedScore.id, {
    ...auditPayload,
    ipfsCID: ipfsCid
  });

  // 10. Write Audit Record in DB
  const auditRecord = await prisma.auditRecord.create({
    data: {
      scoreId: savedScore.id,
      payloadHash: blockchainAnchor.payload_hash,
      ipfsCid: blockchainAnchor.ipfs_cid,
      chainTxHash: blockchainAnchor.chain_tx_hash,
      chainNetwork: "polygon-amoy"
    }
  });

  return {
    score: calculation.score,
    band: calculation.band,
    isProvisional: calculation.is_provisional,
    auditRecord
  };
}

// GET /api/v1/msme/:id/score
app.get("/api/v1/msme/:id/score", authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    const latestScore = await prisma.score.findFirst({
      where: { msmeId: id },
      orderBy: { computedAt: "desc" },
      include: {
        breakdowns: true
      }
    });

    if (!latestScore) {
      return res.status(404).json({ success: false, error: "No scores calculated yet. Run recompute." });
    }

    res.json({
      msme_id: id,
      score: latestScore.score,
      band: latestScore.band,
      is_provisional: latestScore.isProvisional,
      model_version: latestScore.modelVersion,
      computed_at: latestScore.computedAt.toISOString(),
      cards: latestScore.breakdowns.map(b => ({
        label: b.cardLabel,
        value: b.value,
        explanation: b.explanation
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/msme/:id/score/recompute
app.post("/api/v1/msme/:id/score/recompute", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await triggerScoreCalculation(id);
    res.json({ success: true, score: result.score, band: result.band });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/msme/:id/score/breakdown
app.get("/api/v1/msme/:id/score/breakdown", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const latestScore = await prisma.score.findFirst({
      where: { msmeId: id },
      orderBy: { computedAt: "desc" },
      include: { breakdowns: true }
    });

    if (!latestScore) {
      return res.status(404).json({ success: false, error: "Breakdown not found" });
    }

    res.json({
      msme_id: id,
      cards: latestScore.breakdowns.map(b => ({
        label: b.cardLabel,
        value: b.value,
        explanation: b.explanation
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/msme/:id/simulate (What-If Simulator, lightweight calculation)
app.post("/api/v1/msme/:id/simulate", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { gst_punctuality, cash_flow_consistency, payroll_regularity } = req.body;

  if (gst_punctuality === undefined || cash_flow_consistency === undefined || payroll_regularity === undefined) {
    return res.status(400).json({ success: false, error: "Missing simulation inputs" });
  }

  try {
    // Pull sector prior for reference
    const profile = await prisma.mSMEProfile.findUnique({ where: { id } });
    if (!profile) {
      return res.status(404).json({ success: false, error: "MSME Profile not found" });
    }

    const prior = await prisma.sectorPrior.findFirst({
      where: { sector: profile.sector }
    });
    const sectorPriorFallback = prior ? prior.priorScoreMean : 640;

    // Use full confidence (alpha = 1) for the What-If simulation preview
    const ownDataScore = Math.round(
      300 + ((gst_punctuality * 0.4 + cash_flow_consistency * 0.35 + payroll_regularity * 0.25) / 100) * 600
    );

    res.json({
      success: true,
      simulated_score: ownDataScore
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Fraud Detection Endpoints
// GET /api/v1/msme/:id/fraud-flags
app.get("/api/v1/msme/:id/fraud-flags", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const flags = await prisma.fraudFlag.findMany({
      where: { msmeId: id },
      orderBy: { detectedAt: "desc" }
    });
    res.json(flags);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/msme/:id/fraud-check/run
app.post("/api/v1/msme/:id/fraud-check/run", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const flags = await runFraudChecks(prisma, id);
    res.json({ success: true, flags_triggered: flags.length, flags });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Credit Journey Endpoint
// GET /api/v1/msme/:id/journey
app.get("/api/v1/msme/:id/journey", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const milestone = await prisma.journeyMilestone.findFirst({
      where: { msmeId: id },
      orderBy: { updatedAt: "desc" }
    });

    if (!milestone) {
      return res.status(404).json({ success: false, error: "Credit journey milestone not found" });
    }

    res.json({
      stage: milestone.stage,
      next_action: milestone.nextAction,
      projected_score_low: milestone.projectedScoreLow,
      projected_score_high: milestone.projectedScoreHigh,
      updated_at: milestone.updatedAt.toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Bank Officer Dashboard Endpoints
// GET /api/v1/officer/applicants
app.get("/api/v1/officer/applicants", authenticateToken, requireRole(["bank_officer"]), async (req, res) => {
  try {
    const applicants = await prisma.mSMEProfile.findMany({
      include: {
        scores: {
          orderBy: { computedAt: "desc" },
          take: 1
        },
        fraudFlags: true,
        journeyMilestones: {
          orderBy: { updatedAt: "desc" },
          take: 1
        },
        consents: true
      }
    });

    const response = applicants.map(app => {
      const latestScore = app.scores[0];
      const latestMilestone = app.journeyMilestones[0];
      return {
        id: app.id,
        businessName: app.businessName,
        sector: app.sector,
        registrationType: app.registrationType,
        score: latestScore ? latestScore.score : 300,
        band: latestScore ? latestScore.band.toLowerCase() : "poor",
        stage: latestMilestone ? latestMilestone.stage : "provisional",
        dataCompleteness: {
          connected: app.consents.filter(c => c.consented).length,
          total: 4
        },
        blockchainVerified: latestScore ? true : false,
        fraudFlag: app.fraudFlags.length > 0,
        fraudNote: app.fraudFlags.length > 0 ? `${app.fraudFlags.length} active risk flags detected.` : null,
        decision: app.region === "APPROVED" ? "approve" : app.region === "REJECTED" ? "reject" : app.region === "MORE_INFO" ? "request_info" : null,
        decisionNote: app.employeeBand
      };
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/officer/applicants/:id
app.get("/api/v1/officer/applicants/:id", authenticateToken, requireRole(["bank_officer"]), async (req, res) => {
  const { id } = req.params;
  try {
    const app = await prisma.mSMEProfile.findUnique({
      where: { id },
      include: {
        scores: {
          orderBy: { computedAt: "desc" },
          take: 1,
          include: { breakdowns: true, auditRecords: true }
        },
        fraudFlags: true,
        journeyMilestones: {
          orderBy: { updatedAt: "desc" },
          take: 1
        },
        consents: true
      }
    });

    if (!app) {
      return res.status(404).json({ success: false, error: "Applicant not found" });
    }

    const latestScore = app.scores[0];
    const latestMilestone = app.journeyMilestones[0];
    const auditRecord = latestScore && latestScore.auditRecords[0];

    // Combine into expected shape
    const dataSources = [
      { id: "gst", label: "GST", connected: app.consents.some(c => c.dataSource === "gst" && c.consented) },
      { id: "upi", label: "UPI", connected: app.consents.some(c => c.dataSource === "upi" && c.consented) },
      { id: "epfo", label: "EPFO", connected: app.consents.some(c => c.dataSource === "epfo" && c.consented) },
      { id: "credit", label: "Credit Bureau", connected: app.consents.some(c => c.dataSource === "credit" && c.consented) },
    ];

    // Find the owner user email
    const ownerUser = await prisma.user.findUnique({ where: { id: app.userId } });

    res.json({
      id: app.id,
      businessName: app.businessName,
      sector: app.sector,
      registrationType: app.registrationType,
      score: latestScore ? latestScore.score : 300,
      band: latestScore ? latestScore.band.toLowerCase() : "poor",
      dataCompleteness: {
        connected: app.consents.filter(c => c.consented).length,
        total: 4
      },
      dataSources,
      blockchainVerified: latestScore ? true : false,
      subScores: latestScore ? latestScore.breakdowns.map(b => {
        const idMap = {
          "Cash Flow Stability": "cash_flow",
          "Compliance Score": "compliance",
          "Growth Trend": "growth",
          "Operational Stability": "operational",
          "Trust & Integrity": "trust"
        };
        let bBand = "poor";
        if (b.value >= 75) bBand = "excellent";
        else if (b.value >= 60) bBand = "good";
        else if (b.value >= 40) bBand = "fair";

        return {
          id: idMap[b.cardLabel] || b.cardLabel.toLowerCase().replace(/[^a-z]/g, ""),
          label: b.cardLabel,
          score: b.value,
          band: bBand,
          summary: b.explanation || "Details not specified.",
          dataSources: b.cardLabel === "Cash Flow Stability" || b.cardLabel === "Growth Trend" ? ["gst", "upi"] : b.cardLabel === "Compliance Score" ? ["gst", "credit"] : b.cardLabel === "Operational Stability" ? ["epfo"] : ["credit"],
          whyFactors: ["Factor 1 relating to " + b.cardLabel],
          contributors: [{ label: "FHC indicator", impact: b.value, positive: true }],
          dataCompleteness: { current: 12, total: 12, unit: "months" }
        };
      }) : [],
      fraudFlag: app.fraudFlags.length > 0,
      fraudNote: app.fraudFlags.length > 0 ? `${app.fraudFlags.length} active risk flags detected.` : null,
      fraudFlags: app.fraudFlags.map(f => ({
        id: f.id,
        ruleTriggered: f.ruleTriggered,
        severity: f.severity,
        description: f.description,
        detectedAt: f.detectedAt.toISOString()
      })),
      trendScores: [latestScore ? latestScore.score : 300],
      trendLabels: [new Date().toLocaleDateString("en-US", { month: "short" })],
      journeyStage: latestMilestone ? latestMilestone.stage : "provisional",
      journeyMilestone: latestMilestone,
      auditId: auditRecord ? auditRecord.id : "audit-none",
      auditRecord: auditRecord ? {
        auditId: auditRecord.id,
        payloadHash: auditRecord.payloadHash,
        ipfsCid: auditRecord.ipfsCid,
        chainTxHash: auditRecord.chainTxHash,
        chainNetwork: auditRecord.chainNetwork,
        timestamp: auditRecord.anchoredAt.toISOString()
      } : null,
      ownerEmail: ownerUser ? ownerUser.email : "unknown",
      consents: app.consents,
      date: latestScore ? latestScore.computedAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/officer/applicants/:id/decision
app.post("/api/v1/officer/applicants/:id/decision", authenticateToken, requireRole(["bank_officer"]), async (req, res) => {
  const { id } = req.params;
  const { decision, note } = req.body; // "approve" | "reject" | "request_info"

  if (!["approve", "reject", "request_info"].includes(decision)) {
    return res.status(400).json({ success: false, error: "Invalid decision state" });
  }

  try {
    // Map decision to region and employeeBand to avoid schema migrations for these specific mock columns
    let statusMapped = "PENDING";
    if (decision === "approve") statusMapped = "APPROVED";
    if (decision === "reject") statusMapped = "REJECTED";
    if (decision === "request_info") statusMapped = "MORE_INFO";

    await prisma.mSMEProfile.update({
      where: { id },
      data: {
        region: statusMapped, // repurpose region to hold approval status
        employeeBand: note     // repurpose employeeBand to hold decision note
      }
    });

    res.json({ success: true, message: `Applicant decision logged as: ${decision}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Blockchain / Audit Trail Endpoints
// GET /api/v1/audit/:id
app.get("/api/v1/audit/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Try to find by auditId directly
    let record = await prisma.auditRecord.findUnique({
      where: { id },
      include: { score: true }
    });

    // 2. If not found, try to find latest audit for this msmeId
    if (!record) {
      record = await prisma.auditRecord.findFirst({
        where: {
          score: { msmeId: id }
        },
        orderBy: { anchoredAt: "desc" },
        include: { score: true }
      });
    }

    if (!record) {
      return res.status(404).json({ success: false, error: "Audit record not found" });
    }

    // Fetch the profile to get the businessName and sources present
    const profile = await prisma.mSMEProfile.findUnique({
      where: { id: record.score.msmeId },
      include: { consents: true }
    });

    res.json({
      auditId: record.id,
      msmeId: record.score.msmeId,
      businessName: profile ? profile.businessName : "Unknown MSME",
      score: record.score.score,
      band: record.score.band.toLowerCase(),
      timestamp: record.anchoredAt.toISOString(),
      inputsHash: record.payloadHash,
      blockHash: "0x" + record.payloadHash.slice(2).split("").reverse().join(""),
      transactionId: record.chainTxHash,
      ipfsCid: record.ipfsCid,
      dataCompleteness: {
        connected: profile ? profile.consents.filter(c => c.consented).length : 0,
        total: 4
      },
      sourcesPresent: profile ? profile.consents.filter(c => c.consented).map(c => c.dataSource.toUpperCase()) : []
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/v1/audit/:msmeId/history
app.get("/api/v1/audit/:msmeId/history", async (req, res) => {
  const { msmeId } = req.params;
  try {
    const records = await prisma.auditRecord.findMany({
      where: {
        score: { msmeId }
      },
      orderBy: { anchoredAt: "desc" },
      include: {
        score: true
      }
    });

    res.json(records.map(record => ({
      auditId: record.id,
      msmeId: record.score.msmeId,
      score: record.score.score,
      band: record.score.band.toLowerCase(),
      timestamp: record.anchoredAt.toISOString(),
      inputsHash: record.payloadHash,
      transactionId: record.chainTxHash,
      ipfsCid: record.ipfsCid
    })));
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/v1/audit/:id/verify
app.post("/api/v1/audit/:id/verify", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Try to find the audit record by its own ID
    let record = await prisma.auditRecord.findUnique({
      where: { id },
      include: { score: true }
    });

    // 2. Fallback to latest audit for the given msmeId
    if (!record) {
      record = await prisma.auditRecord.findFirst({
        where: {
          score: { msmeId: id }
        },
        orderBy: { anchoredAt: "desc" },
        include: { score: true }
      });
    }

    if (!record) {
      return res.status(404).json({ success: false, error: "Audit record not found" });
    }

    const msmeId = record.score.msmeId;
    const scoreId = record.scoreId;

    // Reconstruct the audit payload to compare
    const gstFilings = await prisma.gSTFiling.findMany({ where: { msmeId } });
    const upiTxns = await prisma.uPITransaction.findMany({ where: { msmeId } });
    const epfoRecords = await prisma.ePFORecord.findMany({ where: { msmeId } });

    const onTimeEpfo = epfoRecords.filter(r => r.contributionPaid).length;
    const inputsSummary = {
      gst_filings_count: gstFilings.length,
      upi_days_available: upiTxns.length,
      epfo_regularity: epfoRecords.length > 0 ? (onTimeEpfo / epfoRecords.length) : 0
    };

    const auditPayload = {
      msme_id: msmeId,
      score: record.score.score,
      band: record.score.band,
      model_version: "stub-v0",
      inputs_summary: inputsSummary,
      computed_at: record.score.computedAt.toISOString()
    };

    const verified = await verifyRecord(msmeId, scoreId, auditPayload);
    res.json({ verified, hash: record.payloadHash });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Saksham Backend Server running on http://localhost:${PORT}`);
  console.log(`📝 Connected to SQLite database.`);
});
