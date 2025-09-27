/**
 * Simple DAO Creation Script
 * 
 * This is a simplified version that creates a DAO with minimal configuration
 * to work with the current mock/test environment.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🎯 Creating Simple Community Access DAO");
  console.log(`🌐 Network: ${hre.network.name}`);

  // Setup signer
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer: ${signer.address}`);

  // Get contract addresses
  const factoryAddress = process.env.COMMUNITY_DAO_FACTORY_ADDRESS;
  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS;
  
  if (!factoryAddress || !paymentTokenAddress) {
    throw new Error("❌ Missing contract addresses. Please set COMMUNITY_DAO_FACTORY_ADDRESS and PAYMENT_TOKEN_ADDRESS in .env");
  }

  console.log(`🏭 Factory: ${factoryAddress}`);
  console.log(`💰 Payment Token: ${paymentTokenAddress}`);

  // Connect to factory
  const factory = await hre.ethers.getContractAt("CommunityAccessDAOFactory", factoryAddress, signer);

  // Simple parameters that should work
  const dcParams = {
    name: "Test Community Token",
    symbol: "TCT",
    tokenURI: "https://example.com/token.json",
    creatorAllocationBps: 1000, // 10%
    creatorVestingDuration: 0,
    contributorsAllocationBps: 6000, // 60%
    liquidityAllocationBps: 3000, // 30%
    lockToken: "0x0000000000000000000000000000000000000000", // No lock token
    lockAmount: 0,
    salt: hre.ethers.keccak256(hre.ethers.toUtf8Bytes(`simple-dao-${Date.now()}`))
  };

  const apParams = {
    paymentToken: paymentTokenAddress,
    secondsPerToken: 3600, // 1 hour per token
    rewardRate: 1,
    treasury: signer.address
  };

  console.log("\n🚀 Creating DAO...");

  try {
    // Check if we can call a view function first
    const allDAOs = await factory.getAllDAOs();
    console.log(`✅ Factory responsive. Current DAO count: ${allDAOs.length}`);

    // Try to create the DAO
    const tx = await factory.createCommunityAccessDAO(dcParams, apParams, {
      gasLimit: 3000000 // Set a reasonable gas limit
    });
    
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`✅ DAO Created! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);

    // Parse events
    const logs = receipt.logs;
    console.log(`📋 Events emitted: ${logs.length}`);

    // Look for DAO deployment event
    for (const log of logs) {
      try {
        const parsed = factory.interface.parseLog(log);
        if (parsed.name === 'CommunityDAODeployed') {
          console.log("\n🎉 DAO DEPLOYMENT SUCCESS!");
          console.log(`🏛️  DAO Address: ${parsed.args.daoAddress}`);
          console.log(`🪙 DataCoin Address: ${parsed.args.dataCoin}`);
          console.log(`👤 Owner: ${parsed.args.owner}`);
          
          // Save the addresses
          console.log("\n💾 Add these to your .env file:");
          console.log(`DAO_ADDRESS=${parsed.args.daoAddress}`);
          console.log(`DATACOIN_ADDRESS=${parsed.args.dataCoin}`);
          
          return {
            dao: parsed.args.daoAddress,
            dataCoin: parsed.args.dataCoin
          };
        }
      } catch (e) {
        // Not a factory event, skip
      }
    }

  } catch (error) {
    console.error("❌ DAO creation failed:");
    console.error("Error message:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 This might be because:");
      console.log("1. The DataCoin factory doesn't support the parameters");
      console.log("2. There's an issue with the lock token configuration");
      console.log("3. The factory requires specific approval or setup");
    }
    
    throw error;
  }
}

main()
  .then((result) => {
    if (result) {
      console.log(`\n✅ Successfully created DAO at ${result.dao}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error.message);
    process.exit(1);
  });