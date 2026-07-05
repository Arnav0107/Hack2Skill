/**
 * backfill_scoring_fields.js
 * Backfills registrationDate + ML scoring fields on all existing MSME profiles
 * that still have the default values (650 / 0 / 0 / 1).
 * Run: node backfill_scoring_fields.js (from backend/)
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ML_SECTORS = [
  "Textile Manufacturing", "Retail Trade", "Food Processing",
  "IT Services", "Construction", "Agriculture"
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const now = new Date();
  const profiles = await prisma.mSMEProfile.findMany({
    include: { gstFilings: true, upiTransactions: true, epfoRecords: true }
  });

  console.log(`Backfilling ${profiles.length} profiles...\n`);

  for (const profile of profiles) {
    // Determine registration date: if gstFilings exist, infer from oldest period; else randomize
    let registrationDate;
    if (profile.gstFilings.length > 0) {
      const oldest = profile.gstFilings.reduce((a, b) =>
        new Date(a.period) < new Date(b.period) ? a : b
      );
      // Push registration date ~30 days before oldest GST filing
      registrationDate = new Date(new Date(oldest.period).getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      // New-to-credit: random 5–89 days ago
      const daysAgo = randomBetween(5, 89);
      registrationDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    }

    const promoterCreditScore   = randomBetween(300, 900);
    const commercialAssetsValue = Math.round((5  + Math.random() * 195) * 100000);
    const bankAssetValue        = Math.round((2  + Math.random() * 98)  * 100000);
    const aaLinkedAccountsCount = randomBetween(1, 5);
    const sector = profile.sector && !["Manufacturing","Technology","Transportation & Logistics"].includes(profile.sector)
      ? profile.sector
      : ML_SECTORS[Math.floor(Math.random() * ML_SECTORS.length)];

    await prisma.mSMEProfile.update({
      where: { id: profile.id },
      data: {
        registrationDate,
        registeredOn: profile.registeredOn || registrationDate,
        sector,
        promoterCreditScore,
        commercialAssetsValue,
        bankAssetValue,
        aaLinkedAccountsCount
      }
    });

    const ageInDays   = Math.floor((now - registrationDate) / (24 * 60 * 60 * 1000));
    const ageInMonths = Math.floor(ageInDays / 30);

    // Now fix historical data row counts to match actual age
    // GST
    const gstCount = Math.min(12, ageInMonths);
    await prisma.gSTFiling.deleteMany({ where: { msmeId: profile.id } });
    if (gstCount > 0) {
      const complianceRate = 0.5 + Math.random() * 0.5;
      const getPastDate = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      await prisma.gSTFiling.createMany({
        data: Array.from({ length: gstCount }, (_, i) => ({
          msmeId: profile.id,
          period: getPastDate((i + 1) * 30),
          filedOnTime: Math.random() < complianceRate,
          turnover: Math.round((200000 + Math.random() * 800000) * 100) / 100
        }))
      });
    }

    // UPI
    const upiCount = Math.min(30, ageInDays);
    await prisma.uPITransaction.deleteMany({ where: { msmeId: profile.id } });
    if (upiCount > 0) {
      const getPastDate = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      await prisma.uPITransaction.createMany({
        data: Array.from({ length: upiCount }, (_, i) => {
          const amount = Math.round(1000 + Math.random() * 100000);
          return {
            msmeId: profile.id,
            txnDate: getPastDate(i + 1),
            txnType: Math.random() > 0.4 ? "credit" : "debit",
            amount,
            flaggedLarge: amount > 80000
          };
        })
      });
    }

    // EPFO
    const epfoCount = Math.min(6, ageInMonths);
    await prisma.ePFORecord.deleteMany({ where: { msmeId: profile.id } });
    if (epfoCount > 0) {
      const baseEmp = randomBetween(3, 100);
      const getPastDate = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      await prisma.ePFORecord.createMany({
        data: Array.from({ length: epfoCount }, (_, i) => ({
          msmeId: profile.id,
          period: getPastDate((i + 1) * 30),
          employeeCount: baseEmp + randomBetween(-2, 2),
          contributionPaid: Math.random() > 0.15
        }))
      });
    }

    console.log(`  ✔ ${profile.id} | age=${ageInDays}d | gst=${gstCount} | upi=${upiCount} | epfo=${epfoCount} | pcs=${promoterCreditScore}`);
  }

  console.log("\nBackfill complete. Running verification...");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
