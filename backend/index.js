import express from "express";
const app = express();
const port = 3001;
let liveGame = false;

// Middleware to parse JSON requests
app.use(express.json());

app.get("/init", (req, res) => {
  // Default beginner health values
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
