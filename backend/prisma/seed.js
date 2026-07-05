const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Clean existing records
  await prisma.auditRecord.deleteMany();
  await prisma.scoreBreakdown.deleteMany();
  await prisma.score.deleteMany();
  await prisma.fraudFlag.deleteMany();
  await prisma.journeyMilestone.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.gSTFiling.deleteMany();
  await prisma.uPITransaction.deleteMany();
  await prisma.ePFORecord.deleteMany();
  await prisma.mSMEProfile.deleteMany();
  await prisma.sectorPrior.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Sector Priors for cold start fallbacks
  await prisma.sectorPrior.createMany({
    data: [
      { sector: "Manufacturing", region: "West", employeeBand: "10-50", priorScoreMean: 670, priorScoreStd: 45, sampleSize: 180 },
      { sector: "Technology", region: "South", employeeBand: "10-50", priorScoreMean: 710, priorScoreStd: 30, sampleSize: 220 },
      { sector: "Agriculture", region: "North", employeeBand: "1-10", priorScoreMean: 580, priorScoreStd: 50, sampleSize: 310 },
      { sector: "Transportation & Logistics", region: "East", employeeBand: "50-200", priorScoreMean: 640, priorScoreStd: 40, sampleSize: 140 }
    ]
  });

  // 3. Create Users
  const passwordHash = await bcrypt.hash("password123", 10);

  // MSME Owners
  const arjunaOwner = await prisma.user.create({
    data: {
      email: "owner@arjunatextile.in",
      passwordHash,
      role: "msme"
    }
  });

  const kaveriOwner = await prisma.user.create({
    data: {
      email: "owner@kaveriagro.in",
      passwordHash,
      role: "msme"
    }
  });

  const siddharthOwner = await prisma.user.create({
    data: {
      email: "admin@siddharthtech.io",
      passwordHash,
      role: "msme"
    }
  });

  const rajputanaOwner = await prisma.user.create({
    data: {
      email: "rswproprietor@gmail.com",
      passwordHash,
      role: "msme"
    }
  });

  const meenakshiOwner = await prisma.user.create({
    data: {
      email: "contact@meenakshifoods.com",
      passwordHash,
      role: "msme"
    }
  });

  const vaishaliOwner = await prisma.user.create({
    data: {
      email: "info@vaishalihandicrafts.org",
      passwordHash,
      role: "msme"
    }
  });

  const coastalOwner = await prisma.user.create({
    data: {
      email: "ops@coastalpharma.co.in",
      passwordHash,
      role: "msme"
    }
  });

  const northernOwner = await prisma.user.create({
    data: {
      email: "ops@northernlogistics.in",
      passwordHash,
      role: "msme"
    }
  });

  // Bank Officer
  await prisma.user.create({
    data: {
      email: "p.venkataraman@sbi.co.in",
      passwordHash,
      role: "bank_officer"
    }
  });

  console.log("Users created successfully.");

  // 4. Create MSME Profiles (using fixed IDs to match frontend requirements)
  const arjuna = await prisma.mSMEProfile.create({
    data: {
      id: "msme-001",
      userId: arjunaOwner.id,
      businessName: "Arjuna Textile Mills",
      gstin: "27AAAAA1111A1Z1",
      sector: "Manufacturing",
      region: "West",
      employeeBand: "10-50",
      registeredOn: new Date("2018-05-15"),
      registrationDate: new Date("2018-05-15")
    }
  });

  const kaveri = await prisma.mSMEProfile.create({
    data: {
      id: "msme-002",
      userId: kaveriOwner.id,
      businessName: "Kaveri Agro Exports",
      gstin: "33EEEEE5555E5Z5",
      sector: "Agriculture",
      region: "South",
      employeeBand: "10-50",
      registeredOn: new Date("2017-04-12"),
      registrationDate: new Date("2017-04-12")
    }
  });

  const siddharth = await prisma.mSMEProfile.create({
    data: {
      id: "msme-003",
      userId: siddharthOwner.id,
      businessName: "Siddharth Tech Solutions",
      gstin: "29BBBBB2222B2Z2",
      sector: "Technology",
      region: "South",
      employeeBand: "10-50",
      registeredOn: new Date("2020-11-20"),
      registrationDate: new Date("2020-11-20")
    }
  });

  const rajputana = await prisma.mSMEProfile.create({
    data: {
      id: "msme-004",
      userId: rajputanaOwner.id,
      businessName: "Rajputana Steel Works",
      gstin: "08CCCCC3333C3Z3",
      sector: "Manufacturing",
      region: "North",
      employeeBand: "1-10",
      registeredOn: new Date("2015-02-10"),
      registrationDate: new Date("2015-02-10")
    }
  });

  const meenakshi = await prisma.mSMEProfile.create({
    data: {
      id: "msme-005",
      userId: meenakshiOwner.id,
      businessName: "Meenakshi Organic Foods",
      gstin: "24FFFFF6666F6Z6",
      sector: "Food Processing",
      region: "West",
      employeeBand: "10-50",
      registeredOn: new Date("2019-09-05"),
      registrationDate: new Date("2019-09-05")
    }
  });

  const vaishali = await prisma.mSMEProfile.create({
    data: {
      id: "msme-006",
      userId: vaishaliOwner.id,
      businessName: "Vaishali Handicrafts",
      gstin: "09GGGGG7777G7Z7",
      sector: "Agriculture",
      region: "North",
      employeeBand: "1-10",
      registeredOn: new Date("2016-10-18"),
      registrationDate: new Date("2016-10-18")
    }
  });

  const coastal = await prisma.mSMEProfile.create({
    data: {
      id: "msme-007",
      userId: coastalOwner.id,
      businessName: "Coastal Pharma Distributors",
      gstin: "36HHHHH8888H8Z8",
      sector: "Technology",
      region: "South",
      employeeBand: "10-50",
      registeredOn: new Date("2021-03-22"),
      registrationDate: new Date("2021-03-22")
    }
  });

  const northern = await prisma.mSMEProfile.create({
    data: {
      id: "msme-008",
      userId: northernOwner.id,
      businessName: "Northern Logistics Hub",
      gstin: "07DDDDD4444D4Z4",
      sector: "Transportation & Logistics",
      region: "East",
      employeeBand: "50-200",
      registeredOn: new Date("2021-08-30"),
      registrationDate: new Date("2021-08-30")
    }
  });

  console.log("Profiles created successfully.");

  // Helper variables for dates
  const now = new Date();
  const getPastDate = (daysAgo) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  // 5. Seed Data Sources: Consents, GST Filings, UPI, EPFO
  // ────────────────────────────────────────────────────────
  // PROFILE 1: Arjuna Textile Mills (Clean, Good Score)
  // ────────────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { msmeId: arjuna.id, dataSource: "gst", consented: true },
      { msmeId: arjuna.id, dataSource: "upi", consented: true },
      { msmeId: arjuna.id, dataSource: "credit", consented: true }
    ]
  });

  let arjunaTotalGst = 0;
  for (let i = 1; i <= 12; i++) {
    const turnover = 750000 + Math.random() * 100000;
    arjunaTotalGst += turnover;
    await prisma.gSTFiling.create({
      data: {
        msmeId: arjuna.id,
        period: getPastDate(i * 30),
        filedOnTime: i !== 5, // One late filing
        turnover
      }
    });
  }

  const arjunaUpiDays = 35;
  const arjunaNumCredits = Math.ceil(arjunaUpiDays / 2);
  const arjunaNumDebits = Math.floor(arjunaUpiDays / 2);
  const arjunaTargetCredits = arjunaTotalGst * 0.9;

  for (let i = 1; i <= arjunaUpiDays; i++) {
    const isCredit = (i % 2 === 0);
    const amount = isCredit 
      ? Math.round(arjunaTargetCredits / arjunaNumCredits) + (i * 231) + 0.17
      : Math.round(arjunaTargetCredits / arjunaNumDebits * 0.8) + (i * 197) + 0.43;

    await prisma.uPITransaction.create({
      data: {
        msmeId: arjuna.id,
        txnDate: getPastDate(i * 0.8),
        txnType: isCredit ? "credit" : "debit",
        amount,
        flaggedLarge: false
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // PROFILE 2: Siddharth Tech Solutions (Clean, Excellent Score)
  // ────────────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { msmeId: siddharth.id, dataSource: "gst", consented: true },
      { msmeId: siddharth.id, dataSource: "upi", consented: true },
      { msmeId: siddharth.id, dataSource: "epfo", consented: true },
      { msmeId: siddharth.id, dataSource: "credit", consented: true }
    ]
  });

  let siddharthTotalGst = 0;
  for (let i = 1; i <= 12; i++) {
    const turnover = 1400000 + Math.random() * 200000;
    siddharthTotalGst += turnover;
    await prisma.gSTFiling.create({
      data: {
        msmeId: siddharth.id,
        period: getPastDate(i * 30),
        filedOnTime: true,
        turnover
      }
    });
  }

  const siddharthUpiDays = 40;
  const siddharthNumCredits = Math.ceil(siddharthUpiDays / 2);
  const siddharthNumDebits = Math.floor(siddharthUpiDays / 2);
  const siddharthTargetCredits = siddharthTotalGst * 0.9;

  for (let i = 1; i <= siddharthUpiDays; i++) {
    const isCredit = (i % 2 === 0);
    const amount = isCredit 
      ? Math.round(siddharthTargetCredits / siddharthNumCredits) + (i * 231) + 0.17
      : Math.round(siddharthTargetCredits / siddharthNumDebits * 0.8) + (i * 197) + 0.43;

    await prisma.uPITransaction.create({
      data: {
        msmeId: siddharth.id,
        txnDate: getPastDate(i * 0.7),
        txnType: isCredit ? "credit" : "debit",
        amount,
        flaggedLarge: false
      }
    });
  }

  for (let i = 1; i <= 12; i++) {
    await prisma.ePFORecord.create({
      data: {
        msmeId: siddharth.id,
        period: getPastDate(i * 30),
        employeeCount: 22 + Math.floor(Math.random() * 4),
        contributionPaid: true
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // PROFILE 3: Rajputana Steel Works (Flagged - GST-UPI turnover mismatch)
  // ────────────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { msmeId: rajputana.id, dataSource: "gst", consented: true },
      { msmeId: rajputana.id, dataSource: "upi", consented: true }
    ]
  });

  for (let i = 1; i <= 12; i++) {
    await prisma.gSTFiling.create({
      data: {
        msmeId: rajputana.id,
        period: getPastDate(i * 30),
        filedOnTime: i % 4 !== 0,
        turnover: 1200000
      }
    });
  }

  for (let i = 1; i <= 10; i++) {
    await prisma.uPITransaction.create({
      data: {
        msmeId: rajputana.id,
        txnDate: getPastDate(i * 3),
        txnType: "credit",
        amount: 20000,
        flaggedLarge: false
      }
    });
  }
  for (let i = 1; i <= 5; i++) {
    await prisma.uPITransaction.create({
      data: {
        msmeId: rajputana.id,
        txnDate: getPastDate(i * 5),
        txnType: "debit",
        amount: 15000,
        flaggedLarge: false
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // PROFILE 4: Northern Logistics Hub (Circular, Spike, Round-number)
  // ────────────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { msmeId: northern.id, dataSource: "gst", consented: true },
      { msmeId: northern.id, dataSource: "upi", consented: true }
    ]
  });

  for (let i = 1; i <= 12; i++) {
    await prisma.gSTFiling.create({
      data: {
        msmeId: northern.id,
        period: getPastDate(i * 30),
        filedOnTime: true,
        turnover: 400000
      }
    });
  }

  const circDateDebit = getPastDate(3);
  const circDateCredit = getPastDate(2);
  await prisma.uPITransaction.create({
    data: {
      msmeId: northern.id,
      txnDate: circDateDebit,
      txnType: "debit",
      amount: 50000,
      flaggedLarge: false
    }
  });

  await prisma.uPITransaction.create({
    data: {
      msmeId: northern.id,
      txnDate: circDateCredit,
      txnType: "credit",
      amount: 50000,
      flaggedLarge: false
    }
  });

  const transactionAmounts = [10000, 25000, 15000, 30000, 5000, 40000, 23450, 12000, 60000, 12890];
  for (let i = 0; i < transactionAmounts.length; i++) {
    const isCredit = i < 7;
    const txnDate = i < 3 ? getPastDate(1) : getPastDate(i * 2 + 3);
    await prisma.uPITransaction.create({
      data: {
        msmeId: northern.id,
        txnDate: txnDate,
        txnType: isCredit ? "credit" : "debit",
        amount: transactionAmounts[i],
        flaggedLarge: transactionAmounts[i] >= 40000
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // REUSABLE MOCK DATA GENERATOR FOR NEW 4 PROFILES (Bug 1 Additions)
  // ────────────────────────────────────────────────────────
  async function seedProfileTransactions(msme, consentsList, gstCount, upiDays, epfoMonths, gstPunctualityRate, avgTurnover) {
    const consents = consentsList.map(src => ({
      msmeId: msme.id,
      dataSource: src,
      consented: true
    }));
    await prisma.consent.createMany({ data: consents });

    // GST filings
    let totalGst = 0;
    for (let i = 1; i <= gstCount; i++) {
      const turnover = Math.round((avgTurnover * 0.9 + Math.random() * avgTurnover * 0.2) * 100) / 100;
      totalGst += turnover;
      await prisma.gSTFiling.create({
        data: {
          msmeId: msme.id,
          period: getPastDate(i * 30),
          filedOnTime: Math.random() < gstPunctualityRate,
          turnover
        }
      });
    }

    // UPI transactions
    const numCredits = Math.ceil(upiDays / 2);
    const numDebits = Math.floor(upiDays / 2);
    const targetCredits = (totalGst > 0 ? totalGst : avgTurnover * 12) * 0.9;

    for (let i = 1; i <= upiDays; i++) {
      const isCredit = (i % 2 === 0);
      const amount = isCredit 
        ? Math.round(targetCredits / numCredits) + (i * 271) + 0.17
        : Math.round(targetCredits / numDebits * 0.8) + (i * 199) + 0.43;

      await prisma.uPITransaction.create({
        data: {
          msmeId: msme.id,
          txnDate: getPastDate(i * 0.9),
          txnType: isCredit ? "credit" : "debit",
          amount,
          flaggedLarge: amount > 80000
        }
      });
    }

    // EPFO records
    for (let i = 1; i <= epfoMonths; i++) {
      await prisma.ePFORecord.create({
        data: {
          msmeId: msme.id,
          period: getPastDate(i * 30),
          employeeCount: 8 + Math.floor(Math.random() * 4),
          contributionPaid: Math.random() < 0.9
        }
      });
    }
  }

  // Seeding transaction data for new 4 profiles
  console.log("Seeding transactions for 4 new profiles...");
  await seedProfileTransactions(kaveri, ["gst", "upi"], 8, 24, 0, 0.65, 200000);
  await seedProfileTransactions(meenakshi, ["gst", "upi", "epfo"], 12, 30, 6, 0.85, 500000);
  await seedProfileTransactions(vaishali, ["gst", "upi"], 5, 15, 0, 0.55, 180000);
  await seedProfileTransactions(coastal, ["gst", "upi", "epfo", "credit"], 12, 30, 6, 0.95, 900000);

  console.log("Transactional logs seeded.");

  // 6. Generate Scores and Journey Milestones
  // ────────────────────────────────────────────────────────
  const scoringData = [
    { msme: arjuna, dataPoints: 12, gstP: 91, cashC: 85, payrollR: 70, prior: 670, prov: false },
    { msme: kaveri, dataPoints: 8, gstP: 65, cashC: 55, payrollR: 0, prior: 580, prov: true },
    { msme: siddharth, dataPoints: 12, gstP: 100, cashC: 95, payrollR: 90, prior: 710, prov: false },
    { msme: rajputana, dataPoints: 6, gstP: 50, cashC: 30, payrollR: 0, prior: 670, prov: true },
    { msme: meenakshi, dataPoints: 12, gstP: 85, cashC: 78, payrollR: 75, prior: 640, prov: false },
    { msme: vaishali, dataPoints: 5, gstP: 55, cashC: 45, payrollR: 0, prior: 580, prov: true },
    { msme: coastal, dataPoints: 12, gstP: 92, cashC: 88, payrollR: 82, prior: 710, prov: false },
    { msme: northern, dataPoints: 4, gstP: 80, cashC: 20, payrollR: 0, prior: 640, prov: true }
  ];

  for (const item of scoringData) {
    const alpha = Math.min(1, item.dataPoints / 12);
    const ownDataScore = Math.round(
      300 + ((item.gstP * 0.4 + item.cashC * 0.35 + item.payrollR * 0.25) / 100) * 600
    );
    const finalScore = Math.round(alpha * ownDataScore + (1 - alpha) * item.prior);
    
    let band = "poor";
    if (finalScore >= 750) band = "excellent";
    else if (finalScore >= 600) band = "good";
    else if (finalScore >= 400) band = "fair";

    const score = await prisma.score.create({
      data: {
        msmeId: item.msme.id,
        score: finalScore,
        band,
        isProvisional: item.prov,
        alpha,
        modelVersion: "stub-v0",
        computedAt: now
      }
    });

    // Sub score breakdowns
    const explanations = {
      "Cash Flow Stability": "Based on UPI credit and debit transaction frequencies.",
      "Compliance Score": "Calculated from GST filing punctuality.",
      "Growth Trend": "Derived from monthly sales and transaction delta.",
      "Operational Stability": "Inferred from payroll payments and workforce scale.",
      "Trust & Integrity": "Reflects overall system flags, checks, and history."
    };

    await prisma.scoreBreakdown.createMany({
      data: [
        { scoreId: score.id, cardLabel: "Cash Flow Stability", value: item.cashC, explanation: explanations["Cash Flow Stability"] },
        { scoreId: score.id, cardLabel: "Compliance Score", value: item.gstP, explanation: explanations["Compliance Score"] },
        { scoreId: score.id, cardLabel: "Growth Trend", value: Math.round(item.gstP * 0.8), explanation: explanations["Growth Trend"] },
        { scoreId: score.id, cardLabel: "Operational Stability", value: Math.min(92, item.payrollR || 30), explanation: explanations["Operational Stability"] },
        { scoreId: score.id, cardLabel: "Trust & Integrity", value: item.prov ? 40 : 88, explanation: explanations["Trust & Integrity"] }
      ]
    });

    // Journey Milestone
    let journeyStage = "provisional";
    if (item.dataPoints >= 12) journeyStage = "fully_scored";
    else if (item.dataPoints >= 7) journeyStage = "established";
    else if (item.dataPoints >= 3) journeyStage = "emerging";

    await prisma.journeyMilestone.create({
      data: {
        msmeId: item.msme.id,
        stage: journeyStage,
        nextAction: item.dataPoints >= 12 
          ? "Maintain compliant files to keep credit scoring active." 
          : "Connect missing data channels to expand score reliability.",
        projectedScoreLow: finalScore - 30,
        projectedScoreHigh: finalScore + 40
      }
    });

    // Mock Blockchain anchoring
    const hashHex = "0x" + bcrypt.hashSync(`${item.msme.id}-${finalScore}`, 4).replace(/[^a-f0-9]/g, "").slice(0, 64);
    const mockTxHash = "0x" + bcrypt.hashSync(`tx-${item.msme.id}`, 4).replace(/[^a-f0-9]/g, "").slice(0, 64);
    const mockCid = "Qm" + bcrypt.hashSync(`ipfs-${item.msme.id}`, 4).replace(/[^a-f0-9]/g, "").slice(0, 44);

    await prisma.auditRecord.create({
      data: {
        scoreId: score.id,
        payloadHash: hashHex,
        ipfsCid: mockCid,
        chainTxHash: mockTxHash,
        chainNetwork: "polygon-amoy",
        anchoredAt: now
      }
    });
  }

  // 7. Run Fraud checks on seeded data
  const { runFraudChecks } = require("../services/fraudEngine");
  await runFraudChecks(prisma, arjuna.id);
  await runFraudChecks(prisma, kaveri.id);
  await runFraudChecks(prisma, siddharth.id);
  await runFraudChecks(prisma, rajputana.id);
  await runFraudChecks(prisma, meenakshi.id);
  await runFraudChecks(prisma, vaishali.id);
  await runFraudChecks(prisma, coastal.id);
  await runFraudChecks(prisma, northern.id);

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
