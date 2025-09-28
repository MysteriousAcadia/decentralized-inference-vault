/**
 * Contract verification script for Etherscan and compatible block explorers
 *
 * This script helps verify deployed contracts on various networks including:
 * - Ethereum (Mainnet, Sepolia, Goerli)
 * - Polygon (Mainnet, Amoy)
 * - Base (Mainnet, Goerli)
 * - Arbitrum, Optimism
 *
 * Usage:
 *   npx hardhat run scripts/verifyContracts.js --network sepolia
 *   npx hardhat run scripts/verifyContracts.js --network amoy
 *
 * Environment Variables Required:
 * - ETHERSCAN_API_KEY (for Ethereum networks)
 * - POLYGONSCAN_API_KEY (for Polygon networks)
 * - BASESCAN_API_KEY (for Base networks)
 * - Contract addresses in .env or passed as arguments
 */

require("dotenv").config();
const hre = require("hardhat");

// Contract deployment information
const DEPLOYED_CONTRACTS = {
  sepolia: {
    CommunityAccessDAOFactory: {
      address: "0xEB37A065E20D0BB04b161B1d2985065Fb242866a",
      constructorArgs: [
        "0x0000000000000000000000000000000000000000", // defaultTreasury
        "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990", // dataCoinFactory
      ],
    },
    TestToken: {
      address: "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4",
      constructorArgs: [
        "Test Payment Token", // name
        "TPT", // symbol
      ],
    },
  },
  amoy: {
    // Add Amoy deployments here when available
  },
  polygon: {
    // Add Polygon mainnet deployments here when available
  },
};

async function verifyContract(contractName, address, constructorArgs = []) {
  console.log(`\n🔍 Verifying ${contractName} at ${address}...`);

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });

    console.log(`✅ ${contractName} verified successfully!`);
    return true;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`✅ ${contractName} is already verified`);
      return true;
    } else {
      console.error(`❌ Failed to verify ${contractName}:`, error.message);
      return false;
    }
  }
}

async function verifyAllContracts() {
  console.log("\n🚀 Starting Contract Verification");
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);

  const networkContracts = DEPLOYED_CONTRACTS[hre.network.name];

  if (!networkContracts) {
    console.log(
      `❌ No deployed contracts found for network: ${hre.network.name}`
    );
    console.log(
      "Available networks:",
      Object.keys(DEPLOYED_CONTRACTS).join(", ")
    );
    return;
  }

  // Check if we have the required API key for this network
  const requiredApiKey = getRequiredApiKey(hre.network.name);
  if (!requiredApiKey) {
    console.log(
      `❌ Missing API key for ${hre.network.name}. Please set the appropriate environment variable.`
    );
    return;
  }

  console.log(`✅ API key found for ${hre.network.name}`);

  const results = [];

  for (const [contractName, contractInfo] of Object.entries(networkContracts)) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 Verifying: ${contractName}`);
    console.log(`📍 Address: ${contractInfo.address}`);
    console.log(
      `🔧 Constructor Args: ${JSON.stringify(
        contractInfo.constructorArgs,
        null,
        2
      )}`
    );

    const success = await verifyContract(
      contractName,
      contractInfo.address,
      contractInfo.constructorArgs
    );

    results.push({ contractName, address: contractInfo.address, success });

    // Add delay between verifications to avoid rate limiting
    if (
      Object.keys(networkContracts).indexOf(contractName) <
      Object.keys(networkContracts).length - 1
    ) {
      console.log("⏳ Waiting 5 seconds before next verification...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // Display summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📊 VERIFICATION SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  results.forEach((result) => {
    const status = result.success ? "✅ SUCCESS" : "❌ FAILED";
    console.log(`${status} ${result.contractName} (${result.address})`);
  });

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `\n📈 Success Rate: ${successCount}/${results.length} contracts verified`
  );

  if (successCount === results.length) {
    console.log("🎉 All contracts verified successfully!");
  } else {
    console.log(
      "⚠️  Some contracts failed verification. Check the logs above for details."
    );
  }
}

function getRequiredApiKey(networkName) {
  switch (networkName.toLowerCase()) {
    case "mainnet":
    case "sepolia":
    case "goerli":
      return process.env.ETHERSCAN_API_KEY;
    case "polygon":
    case "amoy":
    case "polygonmumbai":
      return process.env.POLYGONSCAN_API_KEY;
    case "base":
    case "basegoerli":
      return process.env.BASESCAN_API_KEY;
    case "arbitrumone":
      return process.env.ARBISCAN_API_KEY;
    case "optimisticeтhereum":
      return process.env.OPTIMISM_API_KEY;
    default:
      return null;
  }
}

async function verifySpecificContract(
  contractName,
  address,
  ...constructorArgs
) {
  console.log(`\n🎯 Verifying specific contract: ${contractName}`);
  console.log(`📍 Address: ${address}`);
  console.log(`🔧 Constructor Args: ${JSON.stringify(constructorArgs)}`);

  const success = await verifyContract(contractName, address, constructorArgs);

  if (success) {
    console.log(`\n🎉 ${contractName} verification completed!`);
    console.log(
      `🔍 View on explorer: ${getExplorerLink(address, hre.network.name)}`
    );
  } else {
    console.log(
      `\n💥 ${contractName} verification failed. Check the error above.`
    );
  }
}

function getExplorerLink(address, networkName) {
  switch (networkName.toLowerCase()) {
    case "mainnet":
      return `https://etherscan.io/address/${address}`;
    case "sepolia":
      return `https://sepolia.etherscan.io/address/${address}`;
    case "goerli":
      return `https://goerli.etherscan.io/address/${address}`;
    case "polygon":
      return `https://polygonscan.com/address/${address}`;
    case "amoy":
      return `https://amoy.polygonscan.com/address/${address}`;
    case "base":
      return `https://basescan.org/address/${address}`;
    case "basegoerli":
      return `https://goerli.basescan.org/address/${address}`;
    default:
      return `Check ${networkName} block explorer for ${address}`;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length >= 3) {
    // Verify specific contract: node verifyContracts.js <contractName> <address> <arg1> <arg2> ...
    const [contractName, address, ...constructorArgs] = args;
    await verifySpecificContract(contractName, address, ...constructorArgs);
  } else {
    // Verify all contracts for the current network
    await verifyAllContracts();
  }
}

// Usage instructions
console.log("🔧 Contract Verification Tool");
console.log("=============================");
console.log("");
console.log("Usage Options:");
console.log(
  "1. Verify all contracts: npx hardhat run scripts/verifyContracts.js --network sepolia"
);
console.log(
  "2. Verify specific contract: npx hardhat run scripts/verifyContracts.js --network sepolia -- ContractName 0x... arg1 arg2"
);
console.log("");
console.log("Required Environment Variables:");
console.log("- ETHERSCAN_API_KEY (for Ethereum networks)");
console.log("- POLYGONSCAN_API_KEY (for Polygon networks)");
console.log("- BASESCAN_API_KEY (for Base networks)");
console.log("");

main()
  .then(() => {
    console.log("\n✅ Verification script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Verification script failed:");
    console.error(error);
    process.exit(1);
  });
