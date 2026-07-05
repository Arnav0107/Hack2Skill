function scoreToBand(score) {
  if (score < 400) return "poor";
  if (score < 600) return "fair";
  if (score < 750) return "good";
  if (score < 900) return "excellent";
  return "excellent"; // or "excellent" if score >= 900
}

// Convert 300-900 score to the frontend's expected "poor" | "fair" | "good" | "excellent"
// Note: Frontend uses a 0-100 score in its mock files, but its getBand logic has:
// score < 40 -> poor, score < 60 -> fair, score < 80 -> good, else excellent.
// Wait! Let's verify how the frontend renders the score.
// If the backend returns a 300-900 score, does the frontend divide it by 10 or show it directly?
// In the spec Section 3.3 Response shape (page 4), the example is:
// "score": 742, "band": "Good", "is_provisional": false, "model_version": "stub-v0"
// Yes! The score in the response is 742, which is in the 300-900 range!
// And the band is capitalized: "Good", "Excellent", "Fair", "Poor" or lowercase?
// In page 4 it says: "band": "Good". In mockData.ts it has: "poor" | "fair" | "good" | "excellent".
// Let's make sure the backend returns the lowercase bands as defined in the frontend typescript interfaces (ScoreBand = "poor" | "fair" | "good" | "excellent"), but we can return whatever is appropriate. Let's make sure it matches the typescript definitions to avoid rendering bugs! In mockData.ts it has: `export type ScoreBand = "poor" | "fair" | "good" | "excellent";`. Let's return lowercase strings, but we can capitalize them in the response if the spec strictly requires it, or return lowercase and let the frontend handle it, or wait, in the spec response shape it says: `"band": "Good"`. Let's return the lowercase version or match the exact frontend type. Let's support lowercase.

function computeStubScore({ gstPunctuality, cashFlowConsistency, payrollRegularity, dataPointsAvailable, sectorPriorFallback = 640 }) {
  const REQUIRED_FOR_FULL_CONFIDENCE = 12;
  const alpha = Math.min(1, dataPointsAvailable / REQUIRED_FOR_FULL_CONFIDENCE);
  
  // gstPunctuality, cashFlowConsistency, payrollRegularity are 0-100
  const ownDataScore = Math.round(
    300 + ((gstPunctuality * 0.4 + cashFlowConsistency * 0.35 + payrollRegularity * 0.25) / 100) * 600
  );
  
  const finalScore = Math.round(alpha * ownDataScore + (1 - alpha) * sectorPriorFallback);
  const isProvisional = alpha < 0.5;

  return {
    score: finalScore,
    band: scoreToBand(finalScore),
    is_provisional: isProvisional,
    alpha
  };
}

function computeJourneyStub(dataPointsAvailable) {
  const stages = [
    { stage: "provisional", min: 0, max: 2 },
    { stage: "emerging", min: 3, max: 6 },
    { stage: "established", min: 7, max: 11 },
    { stage: "fully_scored", min: 12, max: Infinity }
  ];
  
  const current = stages.find(s => dataPointsAvailable >= s.min && dataPointsAvailable <= s.max) || stages[0];
  
  // Set next actions dynamically based on the stage
  let nextAction = "Connect additional data sources to establish a credit profile.";
  if (current.stage === "provisional") {
    nextAction = "File this month's GST return on time and log UPI transactions to move to emerging.";
  } else if (current.stage === "emerging") {
    nextAction = "Connect EPFO data or complete 3 additional months of compliant GST filing to progress to established.";
  } else if (current.stage === "established") {
    nextAction = "Connect all 4 financial data sources and maintain high compliance to unlock fully scored status.";
  } else if (current.stage === "fully_scored") {
    nextAction = "Maintain strong credit compliance. Your scores are fully verified on the blockchain.";
  }

  // Calculate projected range
  let projected_score_low = 600;
  let projected_score_high = 680;
  if (current.stage === "provisional") {
    projected_score_low = 500;
    projected_score_high = 630;
  } else if (current.stage === "emerging") {
    projected_score_low = 610;
    projected_score_high = 720;
  } else if (current.stage === "established") {
    projected_score_low = 680;
    projected_score_high = 820;
  } else if (current.stage === "fully_scored") {
    projected_score_low = 740;
    projected_score_high = 890;
  }

  return {
    stage: current.stage,
    next_action: nextAction,
    projected_score_low,
    projected_score_high
  };
}

module.exports = {
  computeStubScore,
  computeJourneyStub,
  scoreToBand
};
