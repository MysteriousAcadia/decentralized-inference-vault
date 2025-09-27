/**
 * Contract Verification Script for Etherscan
 * 
 * This script helps verify deployed contracts on Etherscan and other block explorers.
 * 
 * Usage:
 *   npx hardhat run scripts/verifyContracts.js --network sepolia
 *   npx hardhat run scripts/verifyContracts.js --network amoy
 * 
 * Environment variables required:
 * - ETHERSCAN_API_KEY (for Ethereum networks)
 * - POLYGONSCAN_API_KEY (for Polygon networks)  
 * - BASESCAN_API_KEY (for Base networks)
 * 
 * Contract addresses (set in .env or modify below):
 * - COMMUNITY_DAO_FACTORY_ADDRESS
 * - PAYMENT_TOKEN_ADDRESS  
 * - DATACOIN_FACTORY_ADDRESS
 */

require("dotenv").config();
const hre = require("hardhat");

// Contract addresses for verification (update these with your deployed addresses)
const CONTRACT_ADDRESSES = {
  sepolia: {
    communityDAOFactory: process.env.COMMUNITY_DAO_FACTORY_ADDRESS || "0xEB37A065E20D0BB04b161B1d2985065Fb242866a",
    testToken: process.env.PAYMENT_TOKEN_ADDRESS || "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4",
    dataCoinFactory: process.env.DATACOIN_FACTORY_ADDRESS || "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990",
  },
  amoy: {
    // Add Amoy addresses when available
    communityDAOFactory: process.env.COMMUNITY_DAO_FACTORY_ADDRESS || "",
    testToken: process.env.PAYMENT_TOKEN_ADDRESS || "",
    dataCoinFactory: process.env.DATACOIN_FACTORY_ADDRESS || "",
  },
  polygon: {
    // Add Polygon mainnet addresses when available
    communityDAOFactory: process.env.COMMUNITY_DAO_FACTORY_ADDRESS || "",
    testToken: process.env.PAYMENT_TOKEN_ADDRESS || "",
    dataCoinFactory: process.env.DATACOIN_FACTORY_ADDRESS || "",
  }
};

async function verifyContract(contractAddress, constructorArguments, contractName) {
  if (!contractAddress || contractAddress === "") {
    console.log(`⏭️  Skipping ${contractName} - no address provided`);
    return false;
  }

  try {
    console.log(`� Verifying ${contractName} at ${contractAddress}...`);
    
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: constructorArguments,
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

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🔐 Starting contract verification on ${networkName}`);
  console.log(`🌐 Network: ${networkName}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);

  const addresses = CONTRACT_ADDRESSES[networkName];
  if (!addresses) {
    throw new Error(`❌ No contract addresses configured for network: ${networkName}`);
  }

  console.log("\n📋 Contract Addresses to Verify:");
  console.log(`🏭 CommunityDAOFactory: ${addresses.communityDAOFactory || 'Not set'}`);
  console.log(`🪙 TestToken: ${addresses.testToken || 'Not set'}`);
  console.log(`🏗️  DataCoinFactory: ${addresses.dataCoinFactory || 'Not set'}`);

  let verificationResults = [];

  // Verify TestToken
  if (addresses.testToken) {
    const testTokenArgs = ["Test Payment Token", "TPT"];
    const result = await verifyContract(
      addresses.testToken, 
      testTokenArgs, 
      "TestToken"
    );
    verificationResults.push({ contract: "TestToken", success: result });
  }

  // Verify CommunityAccessDAOFactory  
  if (addresses.communityDAOFactory && addresses.dataCoinFactory) {
    const factoryArgs = [
      "0x0000000000000000000000000000000000000000", // defaultTreasury (zero address)
      addresses.dataCoinFactory // dataCoinFactory address
    ];
    const result = await verifyContract(
      addresses.communityDAOFactory,
      factoryArgs,
      "CommunityAccessDAOFactory"
    );
    verificationResults.push({ contract: "CommunityAccessDAOFactory", success: result });
  }

  // Note: DataCoinFactory verification would need its specific constructor args
  // This is typically pre-deployed, so we skip it unless specifically requested

  // Display results summary
  console.log("\n📊 VERIFICATION SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  let successCount = 0;
  let totalCount = 0;
  
  verificationResults.forEach(result => {
    totalCount++;
    const status = result.success ? "✅" : "❌";
    console.log(`${status} ${result.contract}`);
    if (result.success) successCount++;
  });
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`� Success Rate: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount && totalCount > 0) {
    console.log("� All contracts verified successfully!");
  } else if (successCount > 0) {
    console.log("⚠️  Some contracts verified successfully");
  } else {
    console.log("❌ No contracts were verified");
  }

  // Provide explorer links
  console.log("\n🔗 EXPLORER LINKS:");
  const getExplorerLink = (address, networkName) => {
    switch (networkName.toLowerCase()) {
      case 'sepolia':
        return `https://sepolia.etherscan.io/address/${address}`;
      case 'amoy':
        return `https://amoy.polygonscan.com/address/${address}`;
      case 'polygon':
        return `https://polygonscan.com/address/${address}`;
      case 'base':
        return `https://basescan.org/address/${address}`;
      default:
        return `Explorer: Check ${networkName} block explorer for ${address}`;
    }
  };

  if (addresses.testToken) {
    console.log(`🪙 TestToken: ${getExplorerLink(addresses.testToken, networkName)}`);
  }
  if (addresses.communityDAOFactory) {
    console.log(`🏭 CommunityDAOFactory: ${getExplorerLink(addresses.communityDAOFactory, networkName)}`);
  }
  if (addresses.dataCoinFactory) {
    console.log(`🏗️  DataCoinFactory: ${getExplorerLink(addresses.dataCoinFactory, networkName)}`);
  }
}

// Individual verification functions for manual use
async function verifyTestToken(address, name = "Test Payment Token", symbol = "TPT") {
  return await verifyContract(address, [name, symbol], "TestToken");
}

async function verifyCommunityDAOFactory(address, defaultTreasury = "0x0000000000000000000000000000000000000000", dataCoinFactory) {
  return await verifyContract(address, [defaultTreasury, dataCoinFactory], "CommunityAccessDAOFactory");
}

async function verifyCreateDatacoin(address, dataCoinFactoryAddress) {
  return await verifyContract(address, [dataCoinFactoryAddress], "CreateDatacoin");
}

// Export functions for use in other scripts
module.exports = {
  verifyContract,
  verifyTestToken,
  verifyCommunityDAOFactory,
  verifyCreateDatacoin
};

// Run main function if this script is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎯 Verification process completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Verification failed:");
      console.error(error.message);
      process.exit(1);
    });
}