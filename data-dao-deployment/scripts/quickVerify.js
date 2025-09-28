/**
 * Simple contract verification script
 *
 * This script provides easy commands to verify specific contracts without
 * needing to remember constructor arguments.
 *
 * Usage:
 *   npx hardhat run scripts/quickVerify.js --network sepolia
 *
 * Then follow the interactive prompts, or set environment variables:
 *   CONTRACT_TO_VERIFY=CommunityAccessDAOFactory npx hardhat run scripts/quickVerify.js --network sepolia
 */

require("dotenv").config();
const hre = require("hardhat");

// Pre-configured contract verification data
const VERIFICATION_DATA = {
  // Sepolia deployments
  sepolia: {
    CommunityAccessDAOFactory: {
      name: "CommunityAccessDAOFactory",
      address: "0xEB37A065E20D0BB04b161B1d2985065Fb242866a",
      contract:
        "contracts/CommunityAccessDAOFactory.sol:CommunityAccessDAOFactory",
      args: [
        "0x0000000000000000000000000000000000000000", // defaultTreasury (zero address)
        "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990", // dataCoinFactory
      ],
    },
    TestToken: {
      name: "TestToken",
      address: "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4",
      contract: "contracts/mocks/TestToken.sol:TestToken",
      args: [
        "Test Payment Token", // name
        "TPT", // symbol
      ],
    },
  },
  // Add other networks as needed
};

async function quickVerify() {
  console.log("\n🚀 Quick Contract Verification");
  console.log(`🌐 Network: ${hre.network.name}`);

  const networkData = VERIFICATION_DATA[hre.network.name];
  if (!networkData) {
    console.log(
      `❌ No verification data available for network: ${hre.network.name}`
    );
    console.log(
      `Available networks: ${Object.keys(VERIFICATION_DATA).join(", ")}`
    );
    return;
  }

  // Check for environment variable to specify which contract
  const contractToVerify = process.env.CONTRACT_TO_VERIFY;

  if (contractToVerify) {
    await verifySpecificContract(contractToVerify, networkData);
  } else {
    await interactiveVerification(networkData);
  }
}

async function verifySpecificContract(contractName, networkData) {
  const contractData = networkData[contractName];

  if (!contractData) {
    console.log(
      `❌ Contract '${contractName}' not found for ${hre.network.name}`
    );
    console.log(`Available contracts: ${Object.keys(networkData).join(", ")}`);
    return;
  }

  await performVerification(contractData);
}

async function interactiveVerification(networkData) {
  console.log("\n📋 Available contracts for verification:");

  const contracts = Object.keys(networkData);
  contracts.forEach((name, index) => {
    const data = networkData[name];
    console.log(`${index + 1}. ${name} (${data.address})`);
  });

  console.log(`${contracts.length + 1}. Verify All Contracts`);
  console.log("0. Exit");

  // For automation purposes, verify all if no interaction possible
  console.log("\n🔄 Auto-selecting: Verify All Contracts");

  // Verify all contracts
  let successCount = 0;
  for (const [contractName, contractData] of Object.entries(networkData)) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    const success = await performVerification(contractData);
    if (success) successCount++;

    // Add delay between verifications
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  console.log(
    `\n🎯 Verification completed: ${successCount}/${
      Object.keys(networkData).length
    } successful`
  );
}

async function performVerification(contractData) {
  console.log(`\n🔍 Verifying: ${contractData.name}`);
  console.log(`📍 Address: ${contractData.address}`);
  console.log(`📄 Contract: ${contractData.contract}`);
  console.log(`🔧 Arguments: ${JSON.stringify(contractData.args, null, 2)}`);

  try {
    await hre.run("verify:verify", {
      address: contractData.address,
      constructorArguments: contractData.args,
      contract: contractData.contract,
    });

    console.log(`✅ ${contractData.name} verified successfully!`);
    console.log(
      `🔍 View on explorer: ${getExplorerLink(contractData.address)}`
    );
    return true;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ ${contractData.name} is already verified`);
      console.log(
        `🔍 View on explorer: ${getExplorerLink(contractData.address)}`
      );
      return true;
    } else {
      console.error(`❌ Failed to verify ${contractData.name}:`);
      console.error(`   ${error.message}`);

      // Common error suggestions
      if (error.message.includes("API Key")) {
        console.log(
          "💡 Tip: Make sure you have the correct API key set in your .env file"
        );
      } else if (error.message.includes("constructor")) {
        console.log(
          "💡 Tip: Constructor arguments might be incorrect. Double-check the deployment transaction."
        );
      } else if (error.message.includes("bytecode")) {
        console.log(
          "💡 Tip: Make sure the contract source code matches exactly what was deployed."
        );
      }

      return false;
    }
  }
}

function getExplorerLink(address) {
  switch (hre.network.name.toLowerCase()) {
    case "mainnet":
      return `https://etherscan.io/address/${address}#code`;
    case "sepolia":
      return `https://sepolia.etherscan.io/address/${address}#code`;
    case "goerli":
      return `https://goerli.etherscan.io/address/${address}#code`;
    case "polygon":
      return `https://polygonscan.com/address/${address}#code`;
    case "amoy":
      return `https://amoy.polygonscan.com/address/${address}#code`;
    case "base":
      return `https://basescan.org/address/${address}#code`;
    default:
      return `Check ${hre.network.name} block explorer for ${address}`;
  }
}

// Check API key before running
function checkApiKey() {
  let requiredKey;
  let keyName;

  switch (hre.network.name.toLowerCase()) {
    case "mainnet":
    case "sepolia":
    case "goerli":
      requiredKey = process.env.ETHERSCAN_API_KEY;
      keyName = "ETHERSCAN_API_KEY";
      break;
    case "polygon":
    case "amoy":
      requiredKey = process.env.POLYGONSCAN_API_KEY;
      keyName = "POLYGONSCAN_API_KEY";
      break;
    case "base":
      requiredKey = process.env.BASESCAN_API_KEY;
      keyName = "BASESCAN_API_KEY";
      break;
    default:
      console.log(
        `⚠️  Unknown network: ${hre.network.name}. Proceeding anyway...`
      );
      return true;
  }

  if (!requiredKey) {
    console.log(`❌ Missing ${keyName} in environment variables`);
    console.log(
      `💡 Get your API key from the appropriate block explorer and add it to your .env file`
    );
    console.log(`   For ${hre.network.name}: Set ${keyName}=your_api_key_here`);
    return false;
  }

  console.log(`✅ ${keyName} found`);
  return true;
}

quickVerify()
  .then(() => {
    console.log("\n✨ Quick verification completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Quick verification failed:");
    console.error(error.message);
    process.exit(1);
  });

// Check API key first
if (!checkApiKey()) {
  process.exit(1);
}
