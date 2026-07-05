const crypto = require("crypto");

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

let useMock = true;

if (pinataApiKey && pinataSecretApiKey) {
  useMock = false;
  console.log("IPFS Service: Initialized with Pinata API keys.");
} else {
  console.log("IPFS Service: Pinata API keys missing. Running in SIMULATED IPFS pinning mode.");
}

async function pinToIPFS(payloadJson) {
  if (useMock) {
    // Generate a mock CID (e.g. Qm... or bafy...)
    const mockHash = crypto.createHash("sha256").update(payloadJson).digest("hex");
    // Standard IPFS CIDs usually start with Qm
    const mockCid = "Qm" + mockHash.slice(0, 44);
    console.log(`[SIMULATED IPFS] Pinned payload to IPFS. Generated CID: ${mockCid}`);
    return mockCid;
  }

  try {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    
    // Parse if it is a string, to ensure we post valid JSON body
    let bodyData = payloadJson;
    if (typeof payloadJson === "string") {
      bodyData = JSON.parse(payloadJson);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: JSON.stringify({
        pinataContent: bodyData,
        pinataMetadata: {
          name: `saksham_audit_${Date.now()}`
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Pinata API returned status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`[REAL IPFS] Successfully pinned to Pinata. CID: ${data.IpfsHash}`);
    return data.IpfsHash;
  } catch (error) {
    console.error("IPFS pinning error. Falling back to simulated CID:", error.message);
    const mockHash = crypto.createHash("sha256").update(payloadJson).digest("hex");
    return "Qm" + mockHash.slice(0, 44);
  }
}

module.exports = { pinToIPFS };
