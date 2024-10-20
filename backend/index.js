import express from "express";
import {
  SignProtocolClient,
  SpMode,
  EvmChains,
  delegateSignAttestation,
  delegateSignRevokeAttestation,
  delegateSignSchema,
} from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";

const app = express();
const port = 3002;
let liveGame = false;

// Middleware to parse JSON requests
app.use(express.json());

app.get("/init", async (req, res) => {
  // Extract privateKey and blasterId from the query parameters
  const { privateKey, blasterId } = req.query;

  if (!privateKey || !blasterId) {
    return res
      .status(400)
      .json({ error: "Private key and blasterId are required" });
  }

  try {
    const client = new SignProtocolClient(SpMode.OnChain, {
      chain: EvmChains.sepolia,
      account: privateKeyToAccount(privateKey),
    });

    const createAttestRes = await client.createAttestation({
      schemaId: "0x2a7",
      data: {
        signer: privateKeyToAccount(privateKey).address
      },
    });

    console.log("https://sepolia.etherscan.io/tx/" + createAttestRes.txHash);

    let maxHealth = 5;
    let maxAmmo = 3;
    let shootCooldown = 500; // ms
    let reloadTime = 2000; // ms
    let userAddress = "696969696";
    let battleContract = "sfspdfjpsdif";

    res.json({
      maxHealth: maxHealth,
      maxAmmo: maxAmmo,
      shootCooldown: shootCooldown,
      reloadTime: reloadTime,
      userAddress: userAddress,
      battleContract: battleContract,
      play: true,
    });
  } catch (error) {
    console.error("Error creating attestation:", error);
    res.status(500).json({ error: "Failed to create attestation" });
  }
});

app.post("/died", (req, res) => {
  const { userAddress, battleContract } = req.body;
  console.log("i fucking died.");
  console.log("User Address:", userAddress);
  console.log("Battle Contract:", battleContract);

  res.sendStatus(200);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
