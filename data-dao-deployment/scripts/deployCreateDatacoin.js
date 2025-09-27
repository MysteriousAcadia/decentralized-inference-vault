// Deploy the CreateDatacoin helper contract to a target network
// Usage examples:
//  npx hardhat run scripts/deployCreateDatacoin.js --network amoy
//  FACTORY_ADDRESS=0x... npx hardhat run scripts/deployCreateDatacoin.js --network polygon

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const factoryAddress =
    process.env.DATACOIN_FACTORY_ADDRESS || process.env.FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error(
      "Missing DATACOIN_FACTORY_ADDRESS (or FACTORY_ADDRESS) env variable"
    );
  }

  console.log(
    `\n🚀 Deploying CreateDatacoin helper using factory: ${factoryAddress}`
  );
  console.log(`🕸️  Network: ${hre.network.name}`);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  console.log(
    `💰 Balance: ${hre.ethers.formatEther(await deployer.getBalance())} ETH`
  );

  const CreateDatacoin = await hre.ethers.getContractFactory("CreateDatacoin");
  const instance = await CreateDatacoin.deploy(factoryAddress);
  await instance.waitForDeployment();

  console.log("\n✅ CreateDatacoin deployed");
  console.log("---------------------------------------------");
  console.log("Contract Address:", instance.target);
  console.log("Factory Address :", factoryAddress);
  console.log("Network         :", hre.network.name);
  console.log(
    "Explorer (Amoy) : https://www.oklink.com/amoy/address/" + instance.target
  );
  console.log("\n➡️  Next steps:");
  console.log(
    "- Grant MINTER_ROLE to the helper on a newly created DataCoin if you want it to mint"
  );
  console.log(
    "- Call getApprovedLockTokenAndConfig() off-chain to display available lock assets"
  );
  console.log(
    "- (Optional) Modify createDataCoin() parameters in contract for dynamic input"
  );
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});
