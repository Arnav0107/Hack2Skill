const { PrismaClient } = require("@prisma/client");

/**
 * Runs the fraud engine checks against the UPI transactions and GST filings for a given MSME.
 * Writes any triggered rules to the fraud_flags table and returns them.
 * 
 * @param {PrismaClient} prisma 
 * @param {string} msmeId 
 */
async function runFraudChecks(prisma, msmeId) {
  const triggeredFlags = [];

  // 1. Fetch transactions and filings
  const upiTransactions = await prisma.uPITransaction.findMany({
    where: { msmeId },
    orderBy: { txnDate: "desc" }
  });

  const gstFilings = await prisma.gSTFiling.findMany({
    where: { msmeId },
    orderBy: { period: "desc" }
  });

  if (upiTransactions.length === 0 && gstFilings.length === 0) {
    return [];
  }

  // Clear existing fraud flags for this run (optional, but keep it clean)
  await prisma.fraudFlag.deleteMany({
    where: { msmeId }
  });

  // Helper: Find transaction timestamps
  const getMsTime = (dateObj) => new Date(dateObj).getTime();

  // Determine "current time" for the analysis (most recent txn date, or now)
  const referenceDate = upiTransactions.length > 0 ? getMsTime(upiTransactions[0].txnDate) : Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // ────────────────────────────────────────────────────────
  // RULE 1: Spike before application
  // Logic: Sum of UPI credits in last 7 days > 3x the 30-day average
  // Daily average in 30 days = C_30 / 30.
  // Credits in 7 days = C_7.
  // Spike is triggered if (C_7 / 7) > 3 * (C_30 / 30) => C_7 > 0.7 * C_30
  // ────────────────────────────────────────────────────────
  const credits30Days = upiTransactions.filter(t => 
    t.txnType === "credit" && 
    (referenceDate - getMsTime(t.txnDate)) <= 30 * ONE_DAY
  );

  const credits7Days = credits30Days.filter(t => 
    (referenceDate - getMsTime(t.txnDate)) <= 7 * ONE_DAY
  );

  const sum30 = credits30Days.reduce((sum, t) => sum + t.amount, 0);
  const sum7 = credits7Days.reduce((sum, t) => sum + t.amount, 0);

  if (sum30 > 0 && sum7 > 0.7 * sum30) {
    triggeredFlags.push({
      ruleTriggered: "Spike before application",
      severity: "high",
      description: `Abnormal credit activity detected. Total credit inflows in the last 7 days (₹${sum7.toLocaleString()}) constitute ${( (sum7 / sum30) * 100 ).toFixed(1)}% of the total 30-day inflows (₹${sum30.toLocaleString()}), which is significantly higher than the expected weekly average.`
    });
  }

  // ────────────────────────────────────────────────────────
  // RULE 2: Circular transfer
  // Logic: A->B->A fund movement between two linked accounts within a 72-hour window.
  // We identify this by matching a debit and a credit of the exact same amount within 72 hours.
  // ────────────────────────────────────────────────────────
  let circularDetected = false;
  let circularDetails = "";

  const debits = upiTransactions.filter(t => t.txnType === "debit");
  const credits = upiTransactions.filter(t => t.txnType === "credit");

  for (const debit of debits) {
    const matchingCredit = credits.find(credit => 
      Math.abs(debit.amount - credit.amount) < 0.01 && // Exact same amount
      Math.abs(getMsTime(debit.txnDate) - getMsTime(credit.txnDate)) <= 72 * 60 * 60 * 1000 && // Within 72 hours
      debit.id !== credit.id
    );

    if (matchingCredit) {
      circularDetected = true;
      circularDetails = `Matched circular pattern: debit of ₹${debit.amount.toLocaleString()} on ${debit.txnDate.toISOString().split("T")[0]} and credit of ₹${matchingCredit.amount.toLocaleString()} on ${matchingCredit.txnDate.toISOString().split("T")[0]} within 72 hours.`;
      break; // trigger once is enough
    }
  }

  if (circularDetected) {
    triggeredFlags.push({
      ruleTriggered: "Circular transfer",
      severity: "high",
      description: `Potential round-tripping of funds. ${circularDetails}`
    });
  }

  // ────────────────────────────────────────────────────────
  // RULE 3: GST-UPI turnover mismatch
  // Logic: abs(declared_gst_turnover - sum(upi_credits)) / declared_gst_turnover > 0.4
  // ────────────────────────────────────────────────────────
  const totalGstTurnover = gstFilings.reduce((sum, f) => sum + f.turnover, 0);
  const totalUpiCredits = upiTransactions
    .filter(t => t.txnType === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalGstTurnover > 0) {
    const mismatchRatio = Math.abs(totalGstTurnover - totalUpiCredits) / totalGstTurnover;
    if (mismatchRatio > 0.4) {
      triggeredFlags.push({
        ruleTriggered: "GST-UPI turnover mismatch",
        severity: "medium",
        description: `Substantial discrepancy between tax filings and transaction volumes. Declared GST turnover is ₹${totalGstTurnover.toLocaleString()} but sum of UPI credits is ₹${totalUpiCredits.toLocaleString()}, representing a mismatch of ${(mismatchRatio * 100).toFixed(1)}% (allowed threshold: 40%).`
      });
    }
  }

  // ────────────────────────────────────────────────────────
  // RULE 4: Round-number clustering
  // Logic: More than 60% of transactions in a 30-day window are exact round numbers (e.g. 10000, 25000)
  // We check if amounts are divisible by 1,000 (and > 0).
  // ────────────────────────────────────────────────────────
  const txns30Days = upiTransactions.filter(t => 
    (referenceDate - getMsTime(t.txnDate)) <= 30 * ONE_DAY
  );

  if (txns30Days.length >= 5) { // Ensure sufficient transaction count for pattern analysis
    const roundNumberTxns = txns30Days.filter(t => t.amount % 1000 === 0 && t.amount > 0);
    const roundRatio = roundNumberTxns.length / txns30Days.length;

    if (roundRatio > 0.6) {
      triggeredFlags.push({
        ruleTriggered: "Round-number clustering",
        severity: "low",
        description: `Unusual transaction patterns detected: ${(roundRatio * 100).toFixed(0)}% of transactions (${roundNumberTxns.length} out of ${txns30Days.length}) in the last 30 days are exact round numbers (multiples of 1,000), which may indicate synthetic transaction layering rather than normal organic retail flow.`
      });
    }
  }

  // Write triggered flags to database
  const createdFlags = [];
  for (const flag of triggeredFlags) {
    const created = await prisma.fraudFlag.create({
      data: {
        msmeId,
        ruleTriggered: flag.ruleTriggered,
        severity: flag.severity,
        description: flag.description
      }
    });
    createdFlags.push(created);
  }

  return createdFlags;
}

module.exports = {
  runFraudChecks
};
