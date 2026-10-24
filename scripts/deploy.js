const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

// Contracts deployed by this script. Add new contract names here as they are implemented.
const CONTRACTS = ["UserRegistry", "ArcadeDuelEscrow", "TimeCapsuleVault", "InvoiceManager", "GiftPacketVault", "PollRegistry"].filter((name) => {
  try {
    hre.artifacts.readArtifactSync(name);
    return true;
  } catch {
    return false;
  }
});

async function main() {
  const { chainId } = await hre.ethers.provider.getNetwork();
  console.log(`Deploying to network: ${hre.network.name} (chainId ${chainId})`);

  const outFile = path.join(__dirname, "..", "web", "src", "app", "deployments.json");
  let all = {};
  if (fs.existsSync(outFile)) {
    try { all = JSON.parse(fs.readFileSync(outFile, "utf8")); } catch { all = {}; }
  }
  all[String(chainId)] = all[String(chainId)] || {};

  for (const name of CONTRACTS) {
    const Factory = await hre.ethers.getContractFactory(name);
    const instance = await Factory.deploy();
    await instance.waitForDeployment();
    const address = await instance.getAddress();
    all[String(chainId)][name] = address;
    console.log(`${name} deployed to: ${address}`);
  }

  fs.writeFileSync(outFile, JSON.stringify(all, null, 2) + "\n");
  console.log("Addresses written to web/src/app/deployments.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
