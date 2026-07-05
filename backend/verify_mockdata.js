/**
 * verify_mockdata.js — run: node verify_mockdata.js (from backend/)
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const profiles = await prisma.mSMEProfile.findMany({
    include: { gstFilings: true, upiTransactions: true, epfoRecords: true },
  });

  const totalProfiles = profiles.length;
  const coldStartCount = profiles.filter((p) => p.gstFilings.length === 0).length;

  let under3m = 0, from3to12m = 0, over12m = 0;
  for (const p of profiles) {
    const regDate = p.registrationDate || p.registeredOn || p.createdAt;
    const ageInMonths = (now - new Date(regDate)) / (30 * 24 * 60 * 60 * 1000);
    if (ageInMonths < 3) under3m++;
    else if (ageInMonths < 12) from3to12m++;
    else over12m++;
  }

  const sample = profiles.slice(0, 5).map((p) => {
    const regDate = p.registrationDate || p.registeredOn || p.createdAt;
    const ageInDays = Math.floor((now - new Date(regDate)) / (24 * 60 * 60 * 1000));
    return {
      id: p.id,
      sector: p.sector,
      ageInDays,
      gstRows: p.gstFilings.length,
      upiRows: p.upiTransactions.length,
      epfoRows: p.epfoRecords.length,
      promoterCreditScore: p.promoterCreditScore,
      commercialAssetsValue: p.commercialAssetsValue,
      bankAssetValue: p.bankAssetValue,
      aaLinkedAccountsCount: p.aaLinkedAccountsCount,
    };
  });

  console.log("\n========== MOCK DATA VERIFICATION ==========");
  console.log(`Total MSME Profiles          : ${totalProfiles}`);
  console.log(`Cold-start (0 GST rows)      : ${coldStartCount}`);
  console.log("\n--- Age Distribution ---");
  console.log(`Under 3 months (new-to-credit): ${under3m}`);
  console.log(`3–12 months                   : ${from3to12m}`);
  console.log(`Over 12 months                : ${over12m}`);
  console.log("\n--- Sample Profile Details (first 5) ---");
  console.table(sample);
  console.log("============================================\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
