// ── Mock Data for MSME Financial Health Card ──
// All data is centralized here. To connect a real backend,
// replace the API functions in /lib/api.ts with fetch() calls.

export type ScoreBand = "poor" | "fair" | "good" | "excellent";

export interface DataSource {
  id: "gst" | "upi" | "epfo" | "credit";
  label: string;
  connected: boolean;
}

export interface SubScore {
  id: string;
  label: string;
  score: number;
  band: ScoreBand;
  summary: string;
  dataSources: string[];
  hasInsufficientData?: boolean;
  missingSource?: string;
  whyFactors: string[];
  contributors: { label: string; impact: number; positive: boolean }[];
  dataCompleteness: { current: number; total: number; unit: string };
}

export interface MSMERecord {
  id: string;
  businessName: string;
  sector: string;
  registrationType: string;
  gstin?: string;
  score: number;
  band: ScoreBand;
  isProvisional?: boolean;
  loanEligibility?: { min: number; max: number; eligible: boolean; label: string; color: string; };
  dataCompleteness: { connected: number; total: number };
  dataSources: DataSource[];
  blockchainVerified: boolean;
  fraudFlag: boolean;
  fraudNote?: string;
  date: string;
  trendScores: number[];
  trendLabels: string[];
  subScores: SubScore[];
  auditId: string;
  ownerEmail: string;
}

export interface AuditRecord {
  auditId: string;
  msmeId: string;
  businessName: string;
  score: number;
  band: ScoreBand;
  dataCompleteness: { connected: number; total: number };
  sourcesPresent: string[];
  modelVersion: string;
  timestamp: string;
  inputsHash: string;
  blockHash: string;
  transactionId: string;
  ipfsCid?: string;
}

export interface BankOfficer {
  id: string;
  name: string;
  email: string;
  branch: string;
  role: "bank_officer";
}

// ── Score band helper ──
export function getBand(score: number): ScoreBand {
  if (score < 40) return "poor";
  if (score < 60) return "fair";
  if (score < 80) return "good";
  return "excellent";
}

// ── Sub-scores template generator ──
const mockSubScores = (overrides?: Partial<SubScore>[]): SubScore[] => [
  {
    id: "cash_flow",
    label: "Cash Flow Stability",
    score: 74,
    band: "good",
    summary: "Consistent monthly inflows with low volatility",
    dataSources: ["gst", "upi"],
    hasInsufficientData: false,
    whyFactors: [
      "Average monthly UPI credit: ₹8.2L over 12 months",
      "GST return filed on time for 11 of 12 months",
      "Low coefficient of variation in revenue (18%)",
    ],
    contributors: [
      { label: "Revenue consistency", impact: 82, positive: true },
      { label: "GST compliance", impact: 71, positive: true },
      { label: "UPI inflow growth", impact: 65, positive: true },
      { label: "Return filing gaps", impact: -28, positive: false },
    ],
    dataCompleteness: { current: 11, total: 12, unit: "months of UPI data" },
    ...(overrides?.[0] || {}),
  },
  {
    id: "compliance",
    label: "Compliance Score",
    score: 81,
    band: "excellent",
    summary: "Excellent regulatory standing across all filings",
    dataSources: ["gst", "credit"],
    hasInsufficientData: false,
    whyFactors: [
      "No GST defaults in 24 months",
      "Credit bureau shows no adverse remarks",
      "EPFO contributions up to date",
    ],
    contributors: [
      { label: "GST filing regularity", impact: 90, positive: true },
      { label: "Credit bureau clean record", impact: 85, positive: true },
      { label: "No legal proceedings", impact: 88, positive: true },
      { label: "Minor late filings (2)", impact: -15, positive: false },
    ],
    dataCompleteness: { current: 24, total: 24, unit: "months of GST data" },
    ...(overrides?.[1] || {}),
  },
  {
    id: "growth",
    label: "Growth Trend",
    score: 67,
    band: "good",
    summary: "Moderate revenue growth with expanding customer base",
    dataSources: ["gst", "upi"],
    hasInsufficientData: false,
    whyFactors: [
      "12% YoY revenue growth (GST turnover)",
      "Transaction count +22% (UPI)",
      "Seasonal dip in Q3 partially offset by Q4 recovery",
    ],
    contributors: [
      { label: "YoY revenue growth", impact: 72, positive: true },
      { label: "Transaction volume growth", impact: 68, positive: true },
      { label: "Seasonal revenue dip", impact: -35, positive: false },
      { label: "New customer acquisition rate", impact: 55, positive: true },
    ],
    dataCompleteness: { current: 8, total: 12, unit: "months of GST data" },
    ...(overrides?.[2] || {}),
  },
  {
    id: "operational",
    label: "Operational Stability",
    score: 48,
    band: "fair",
    summary: "Limited data — score based on GST and UPI signals only",
    dataSources: ["gst"],
    hasInsufficientData: true,
    missingSource: "EPFO",
    whyFactors: [
      "EPFO data not connected — employee count and payroll unverified",
      "GST shows consistent operations over 18 months",
      "Score estimated from available proxy signals",
    ],
    contributors: [
      { label: "Business continuity (GST proxy)", impact: 60, positive: true },
      { label: "EPFO data unavailable", impact: -40, positive: false },
      { label: "Consistent filing address", impact: 52, positive: true },
    ],
    dataCompleteness: { current: 0, total: 12, unit: "months of EPFO data" },
    ...(overrides?.[3] || {}),
  },
  {
    id: "trust",
    label: "Trust & Integrity",
    score: 79,
    band: "good",
    summary: "No adverse flags, strong digital transaction footprint",
    dataSources: ["credit", "upi"],
    hasInsufficientData: false,
    whyFactors: [
      "Credit bureau: no fraud or NPA markers",
      "UPI transaction patterns consistent, no anomalies",
      "Business registration cross-verified",
    ],
    contributors: [
      { label: "Clean credit bureau record", impact: 88, positive: true },
      { label: "UPI anomaly score", impact: 75, positive: true },
      { label: "Digital identity consistency", impact: 70, positive: true },
      { label: "Occasional large irregular payments", impact: -22, positive: false },
    ],
    dataCompleteness: { current: 12, total: 12, unit: "months of UPI data" },
    ...(overrides?.[4] || {}),
  },
];

// ── MSME Records ──
export const mockMSMEs: MSMERecord[] = [
  {
    id: "msme-001",
    businessName: "Arjuna Textile Mills",
    sector: "Manufacturing",
    registrationType: "Private Limited",
    score: 74,
    band: "good",
    dataCompleteness: { connected: 3, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: true },
      { id: "epfo", label: "EPFO", connected: false },
      { id: "credit", label: "Credit Bureau", connected: true },
    ],
    blockchainVerified: true,
    fraudFlag: false,
    date: "2025-06-28",
    trendScores: [61, 64, 67, 70, 72, 74],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores(),
    auditId: "audit-a1b2c3",
    ownerEmail: "owner@arjunatextile.in",
  },
  {
    id: "msme-002",
    businessName: "Kaveri Agro Exports",
    sector: "Agriculture",
    registrationType: "Partnership Firm",
    score: 52,
    band: "fair",
    dataCompleteness: { connected: 2, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: true },
      { id: "epfo", label: "EPFO", connected: false },
      { id: "credit", label: "Credit Bureau", connected: false },
    ],
    blockchainVerified: true,
    fraudFlag: false,
    date: "2025-06-25",
    trendScores: [55, 53, 50, 51, 52, 52],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 55, band: "fair", summary: "Moderate cash flow, some gaps" },
      { score: 58, band: "fair", summary: "Mostly compliant with minor gaps" },
      { score: 44, band: "fair", summary: "Slow growth trajectory" },
      { score: 38, band: "poor", hasInsufficientData: true, missingSource: "EPFO" },
      { score: 56, band: "fair", summary: "No major adverse flags" },
    ] as Partial<SubScore>[]),
    auditId: "audit-d4e5f6",
    ownerEmail: "kaveri@agroexports.com",
  },
  {
    id: "msme-003",
    businessName: "Siddharth Tech Solutions",
    sector: "Technology",
    registrationType: "LLP",
    score: 88,
    band: "excellent",
    dataCompleteness: { connected: 4, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: true },
      { id: "epfo", label: "EPFO", connected: true },
      { id: "credit", label: "Credit Bureau", connected: true },
    ],
    blockchainVerified: true,
    fraudFlag: false,
    date: "2025-06-30",
    trendScores: [78, 80, 82, 84, 86, 88],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 90, band: "excellent", summary: "Exceptional revenue consistency" },
      { score: 92, band: "excellent", summary: "Full compliance across all sources" },
      { score: 85, band: "excellent", summary: "Strong consistent growth" },
      { score: 83, band: "excellent", summary: "Stable operations, verified payroll", hasInsufficientData: false },
      { score: 88, band: "excellent", summary: "Clean record across all bureaus" },
    ] as Partial<SubScore>[]),
    auditId: "audit-g7h8i9",
    ownerEmail: "admin@siddharthtech.io",
  },
  {
    id: "msme-004",
    businessName: "Rajputana Steel Works",
    sector: "Manufacturing",
    registrationType: "Sole Proprietorship",
    score: 31,
    band: "poor",
    dataCompleteness: { connected: 1, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: false },
      { id: "epfo", label: "EPFO", connected: false },
      { id: "credit", label: "Credit Bureau", connected: false },
    ],
    blockchainVerified: false,
    fraudFlag: true,
    fraudNote: "Unusual GST filings: revenue spike in Mar–Apr inconsistent with prior 18 months. Cross-reference with IT return pending.",
    date: "2025-06-20",
    trendScores: [40, 38, 35, 33, 31, 31],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 28, band: "poor", summary: "Highly irregular cash flows", hasInsufficientData: true, missingSource: "UPI" },
      { score: 35, band: "poor", summary: "GST filings inconsistent" },
      { score: 22, band: "poor", summary: "Declining revenue trend" },
      { score: 30, band: "poor", hasInsufficientData: true, missingSource: "EPFO" },
      { score: 25, band: "poor", summary: "Adverse flag: revenue anomaly" },
    ] as Partial<SubScore>[]),
    auditId: "audit-j1k2l3",
    ownerEmail: "rswproprietor@gmail.com",
  },
  {
    id: "msme-005",
    businessName: "Meenakshi Organic Foods",
    sector: "Food & Beverage",
    registrationType: "Private Limited",
    score: 65,
    band: "good",
    dataCompleteness: { connected: 3, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: true },
      { id: "epfo", label: "EPFO", connected: true },
      { id: "credit", label: "Credit Bureau", connected: false },
    ],
    blockchainVerified: true,
    fraudFlag: false,
    date: "2025-06-27",
    trendScores: [58, 60, 62, 63, 64, 65],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 68, band: "good" },
      { score: 70, band: "good" },
      { score: 62, band: "good" },
      { score: 65, band: "good", hasInsufficientData: false },
      { score: 60, band: "good", summary: "Missing credit bureau data", hasInsufficientData: true, missingSource: "Credit Bureau" },
    ] as Partial<SubScore>[]),
    auditId: "audit-m4n5o6",
    ownerEmail: "meenakshi@organicfoods.in",
  },
  {
    id: "msme-006",
    businessName: "Vaishali Handicrafts",
    sector: "Handicrafts & Artisan",
    registrationType: "Partnership Firm",
    score: 43,
    band: "fair",
    dataCompleteness: { connected: 2, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: false },
      { id: "epfo", label: "EPFO", connected: true },
      { id: "credit", label: "Credit Bureau", connected: false },
    ],
    blockchainVerified: true,
    fraudFlag: false,
    date: "2025-06-22",
    trendScores: [45, 44, 43, 42, 43, 43],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 40, band: "fair" },
      { score: 55, band: "fair" },
      { score: 38, band: "poor" },
      { score: 42, band: "fair", hasInsufficientData: true, missingSource: "UPI" },
      { score: 45, band: "fair" },
    ] as Partial<SubScore>[]),
    auditId: "audit-p7q8r9",
    ownerEmail: "vaishali@handicrafts.org",
  },
  {
    id: "msme-007",
    businessName: "Coastal Pharma Distributors",
    sector: "Healthcare & Pharma",
    registrationType: "Private Limited",
    score: 77,
    band: "good",
    dataCompleteness: { connected: 4, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: true },
      { id: "epfo", label: "EPFO", connected: true },
      { id: "credit", label: "Credit Bureau", connected: true },
    ],
    blockchainVerified: true,
    fraudFlag: false,
    date: "2025-06-29",
    trendScores: [70, 72, 73, 74, 76, 77],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 78, band: "good" },
      { score: 80, band: "excellent" },
      { score: 72, band: "good" },
      { score: 76, band: "good", hasInsufficientData: false },
      { score: 78, band: "good" },
    ] as Partial<SubScore>[]),
    auditId: "audit-s1t2u3",
    ownerEmail: "finance@coastalpharma.com",
  },
  {
    id: "msme-008",
    businessName: "Northern Logistics Hub",
    sector: "Transportation & Logistics",
    registrationType: "LLP",
    score: 36,
    band: "poor",
    dataCompleteness: { connected: 2, total: 4 },
    dataSources: [
      { id: "gst", label: "GST", connected: true },
      { id: "upi", label: "UPI", connected: true },
      { id: "epfo", label: "EPFO", connected: false },
      { id: "credit", label: "Credit Bureau", connected: false },
    ],
    blockchainVerified: false,
    fraudFlag: true,
    fraudNote: "Multiple UPI chargebacks detected in Q1. Credit bureau check shows 2 outstanding loan defaults.",
    date: "2025-06-18",
    trendScores: [48, 45, 41, 38, 37, 36],
    trendLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    subScores: mockSubScores([
      { score: 32, band: "poor" },
      { score: 38, band: "poor" },
      { score: 30, band: "poor" },
      { score: 35, band: "poor", hasInsufficientData: true, missingSource: "EPFO" },
      { score: 28, band: "poor", summary: "UPI chargeback anomalies detected" },
    ] as Partial<SubScore>[]),
    auditId: "audit-v4w5x6",
    ownerEmail: "ops@northernlogistics.in",
  },
];

// ── Audit Records ──
export const mockAuditRecords: AuditRecord[] = mockMSMEs.map((m) => ({
  auditId: m.auditId,
  msmeId: m.id,
  businessName: m.businessName,
  score: m.score,
  band: m.band,
  dataCompleteness: m.dataCompleteness,
  sourcesPresent: m.dataSources.filter((s) => s.connected).map((s) => s.label),
  modelVersion: "FHC-v2.4.1",
  timestamp: new Date(m.date).toISOString(),
  inputsHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.slice(0, 66),
  blockHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.slice(0, 66),
  transactionId: `0xTXN${Math.random().toString(16).slice(2).toUpperCase()}`,
}));

// ── Mock current MSME user (logged in as MSME) ──
export const mockCurrentMSME = mockMSMEs[0]; // Arjuna Textile Mills

// ── Mock bank officer ──
export const mockBankOfficer: BankOfficer = {
  id: "bo-001",
  name: "Priya Venkataraman",
  email: "p.venkataraman@sbi.co.in",
  branch: "Mumbai — Nariman Point",
  role: "bank_officer",
};

// ── Sectors list ──
export const SECTORS = [
  "Manufacturing",
  "Agriculture",
  "Technology",
  "Food & Beverage",
  "Healthcare & Pharma",
  "Transportation & Logistics",
  "Handicrafts & Artisan",
  "Retail & Trading",
  "Construction",
  "Education & Training",
  "Textile & Garments",
  "Other",
];

// ── Registration types ──
export const REGISTRATION_TYPES = [
  "Private Limited",
  "LLP",
  "Partnership Firm",
  "Sole Proprietorship",
  "One Person Company (OPC)",
  "Section 8 Company (NGO)",
];
