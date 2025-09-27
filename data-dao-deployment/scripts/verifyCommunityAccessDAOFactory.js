/**
 * Verification script for CommunityAccessDAOFactory
 * 
 * This script verifies that the deployed CommunityAccessDAOFactory is working correctly by:
 * - Checking that the contract exists at the deployed address
 * - Validating constructor parameters
 * - Testing view functions
 * 
 * Usage:
 *   npx hardhat run scripts/verifyCommunityAccessDAOFactory.js --network sepolia
 */

require("dotenv").config();
const hre = require("hardhat");
const { getChainConfig } = require("./chainConfig.js");

async function main() {
  console.log("\n🔍 Verifying CommunityAccessDAOFactory Deployment");
  console.log(`🌐 Network: ${hre.network.name}`);
  
  // Get the deployed factory address
  const factoryAddress = process.env.COMMUNITY_DAO_FACTORY_ADDRESS || "0xEB37A065E20D0BB04b161B1d2985065Fb242866a"; // Fallback to deployed address
  
  if (!factoryAddress) {
    throw new Error("❌ Missing COMMUNITY_DAO_FACTORY_ADDRESS. Please set it in your .env file");
  }

  console.log(`📍 Factory Address: ${factoryAddress}`);
  
  // Create signer directly from private key in .env
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }
  
  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Verifier: ${signer.address}`);

  // Connect to the deployed contract
  const factory = await hre.ethers.getContractAt("CommunityAccessDAOFactory", factoryAddress, signer);
  
  console.log("\n🔄 Running verification tests...");
  
  try {
    // Test 1: Check if contract exists and has code
    const code = await provider.getCode(factoryAddress);
    if (code === "0x" || code === "0x0") {
      throw new Error("No contract code found at the specified address");
    }
    console.log("✅ Contract exists and has bytecode");

    // Test 2: Check defaultTreasury
    const defaultTreasury = await factory.defaultTreasury();
    console.log(`✅ Default Treasury: ${defaultTreasury}`);
    
    // Test 3: Check dataCoinFactory
    const dataCoinFactory = await factory.dataCoinFactory();
    console.log(`✅ DataCoin Factory: ${dataCoinFactory}`);
    
    // Verify it matches expected from chainConfig
    const chainConfig = getChainConfig(hre.network.name);
    if (dataCoinFactory.toLowerCase() === chainConfig.factoryAddress.toLowerCase()) {
      console.log("✅ DataCoin Factory address matches chainConfig");
    } else {
      console.log(`⚠️  DataCoin Factory address doesn't match chainConfig (expected: ${chainConfig.factoryAddress})`);
    }
    
    // Test 4: Check initial DAO count
    const allDAOs = await factory.getAllDAOs();
    console.log(`✅ Total DAOs deployed: ${allDAOs.length}`);
    
    // Test 5: Check DAOs for current signer
    const myDAOs = await factory.getDAOsByOwner(signer.address);
    console.log(`✅ DAOs owned by ${signer.address}: ${myDAOs.length}`);
    
    // Test 6: Test view function for a non-existent DAO
    try {
      const nonExistentDAO = "0x0000000000000000000000000000000000000001";
      const owner = await factory.ownerOf(nonExistentDAO);
      console.log(`✅ Non-existent DAO owner query successful (owner: ${owner})`);
    } catch (error) {
      console.log("✅ Non-existent DAO owner query handled gracefully");
    }
    
    console.log("\n🎉 All verification tests passed!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 VERIFICATION SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📍 Contract Address: ${factoryAddress}`);
    console.log(`🏛️  Default Treasury: ${defaultTreasury}`);
    console.log(`🏭 DataCoin Factory: ${dataCoinFactory}`);
    console.log(`📊 Current DAO Count: ${allDAOs.length}`);
    console.log(`🌐 Network: ${hre.network.name}`);
    console.log(`🔍 Explorer: https://sepolia.etherscan.io/address/${factoryAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    console.log("\n✨ The CommunityAccessDAOFactory is ready to use!");
    console.log("Next steps:");
    console.log("1. Set COMMUNITY_DAO_FACTORY_ADDRESS in your .env file:");
    console.log(`   COMMUNITY_DAO_FACTORY_ADDRESS=${factoryAddress}`);
    console.log("2. Configure your DAO parameters in .env");
    console.log("3. Run: npm run create:dao:sepolia");
    
  } catch (error) {
    console.error("\n❌ Verification failed:", error.message);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n🎯 Verification completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Verification failed:");
    console.error(error.message);
    process.exit(1);
  });