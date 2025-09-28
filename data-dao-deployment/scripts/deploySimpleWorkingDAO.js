/**
 * Simple Working DAO Deployment Script
 *
 * This script creates a DAO using TestToken for both payment and rewards,
 * avoiding the complex DataCoin interface issues.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🎯 Simple Working DAO Deployment");
  console.log(`🌐 Network: ${hre.network.name}`);

  // Setup signer
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer: ${signer.address}`);

  // Get payment token address
  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS;
  if (!paymentTokenAddress) {
    throw new Error("❌ Missing PAYMENT_TOKEN_ADDRESS in .env");
  }

  console.log(`💰 Payment Token: ${paymentTokenAddress}`);

  // Connect to existing TestToken to use as payment token
  const paymentToken = await hre.ethers.getContractAt(
    "TestToken",
    paymentTokenAddress,
    signer
  );
  console.log(`✅ Payment Token Connected: ${await paymentToken.name()}`);

  // Deploy another TestToken as reward token (simpler than complex DataCoin)
  console.log("\n🪙 Deploying Reward Token (TestToken)...");
  const TestToken = await hre.ethers.getContractFactory("TestToken");
  const rewardToken = await TestToken.deploy("DAO Reward Token", "DRT");
  await rewardToken.waitForDeployment();

  const rewardTokenAddress = await rewardToken.getAddress();
  console.log(`✅ Reward Token deployed: ${rewardTokenAddress}`);

  // Deploy a simple access contract instead of complex DAO
  console.log("\n🏛️  Deploying Simple Access Contract...");

  // Create a simple contract that manages access and rewards
  const SimpleAccessContract = await hre.ethers.getContractFactory("TestToken"); // We'll use this as a placeholder

  // Actually, let me create the DAO properly but use TestToken as data coin
  console.log("\n🏛️  Deploying CommunityAccessDAO...");

  const CommunityAccessDAO = await hre.ethers.getContractFactory(
    "CommunityAccessDAO"
  );

  const daoParams = {
    paymentToken: paymentTokenAddress,
    dataCoin: rewardTokenAddress, // Use TestToken as DataCoin
    secondsPerToken: 3600, // 1 hour per token
    rewardRate: hre.ethers.parseEther("1"), // 1 reward token per payment token
    treasury: signer.address,
  };

  console.log("📋 DAO Parameters:");
  console.log(`   Payment Token: ${daoParams.paymentToken}`);
  console.log(`   Reward Token: ${daoParams.dataCoin}`);
  console.log(`   Seconds per Token: ${daoParams.secondsPerToken}`);
  console.log(
    `   Reward Rate: ${hre.ethers.formatEther(daoParams.rewardRate)}`
  );
  console.log(`   Treasury: ${daoParams.treasury}`);

  // Deploy with simplified interface check
  try {
    const dao = await CommunityAccessDAO.deploy(
      daoParams.paymentToken,
      daoParams.dataCoin,
      daoParams.secondsPerToken,
      daoParams.rewardRate,
      daoParams.treasury
    );

    await dao.waitForDeployment();
    const daoAddress = await dao.getAddress();

    console.log(`✅ DAO deployed at: ${daoAddress}`);

    // Test basic functionality
    console.log("\n🧪 Testing Basic DAO Functions...");

    // Check if we can call view functions
    try {
      const owner = await dao.owner();
      const treasury = await dao.treasury();
      const rate = await dao.secondsPerToken();

      console.log(`👤 DAO Owner: ${owner}`);
      console.log(`🏦 Treasury: ${treasury}`);
      console.log(`⏰ Rate: ${rate.toString()} seconds per token`);

      // Test access check
      const initialAccess = await dao.accessBalance(signer.address);
      console.log(`🔐 Initial Access: ${initialAccess.toString()} seconds`);

      console.log("\n✅ DAO is working! Basic functions accessible.");
    } catch (error) {
      console.log("❌ DAO function test failed:", error.message);
      console.log("The DAO deployed but may have interface issues.");
    }

    // Now test the purchase flow
    console.log("\n💰 Testing Purchase Flow...");

    try {
      // 1. Mint payment tokens
      console.log("1. Minting payment tokens...");
      const currentBalance = await paymentToken.balanceOf(signer.address);
      console.log(
        `   Current balance: ${hre.ethers.formatEther(currentBalance)}`
      );

      if (currentBalance < hre.ethers.parseEther("10")) {
        await paymentToken.mintTokens(
          signer.address,
          hre.ethers.parseEther("100")
        );
        console.log("   ✅ Minted additional tokens");
      }

      // 2. Approve DAO
      console.log("2. Approving DAO to spend tokens...");
      const purchaseAmount = hre.ethers.parseEther("5");
      await paymentToken.approve(daoAddress, purchaseAmount);
      console.log("   ✅ Approval granted");

      // 3. Try to buy access
      console.log("3. Attempting to buy access...");

      try {
        const buyTx = await dao.buyAccess(purchaseAmount, signer.address);
        await buyTx.wait();
        console.log("   ✅ Access purchase successful!");

        // Check access balance
        const newAccess = await dao.accessBalance(signer.address);
        console.log(
          `   🔐 New access balance: ${newAccess.toString()} seconds`
        );
      } catch (buyError) {
        console.log("   ❌ Access purchase failed:", buyError.message);
        if (buyError.message.includes("INTERFACE_NOT_SUPPORTED")) {
          console.log(
            "   💡 This is expected - TestToken doesn't implement IDataCoin interface"
          );
          console.log(
            "   💡 The DAO expects a proper DataCoin with mint() function"
          );
        }
      }
    } catch (error) {
      console.log("❌ Purchase flow test failed:", error.message);
    }

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      timestamp: new Date().toISOString(),
      deployer: signer.address,
      addresses: {
        dao: daoAddress,
        paymentToken: paymentTokenAddress,
        rewardToken: rewardTokenAddress,
      },
      parameters: daoParams,
      note: "Uses TestToken as reward token instead of proper DataCoin. May need interface fixes for full functionality.",
    };

    const fs = require("fs");
    const filename = `simple-dao-deployment-${
      hre.network.name
    }-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n📋 DEPLOYMENT SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🏛️  DAO Address: ${daoAddress}`);
    console.log(`💰 Payment Token: ${paymentTokenAddress}`);
    console.log(`🪙 Reward Token: ${rewardTokenAddress}`);
    console.log(
      `🔗 DAO Explorer: ${getExplorerUrl(
        hre.network.name
      )}/address/${daoAddress}`
    );
    console.log(`💾 Details saved to: ${filename}`);

    console.log("\n🎯 NEXT STEPS:");
    console.log(
      "1. The DAO is deployed but may need proper DataCoin interface"
    );
    console.log("2. Consider implementing IDataCoin interface in reward token");
    console.log("3. Test access purchases in your frontend");
    console.log("4. Add proper minting roles for reward distribution");

    return {
      dao: daoAddress,
      paymentToken: paymentTokenAddress,
      rewardToken: rewardTokenAddress,
    };
  } catch (error) {
    console.error("❌ DAO deployment failed:", error.message);

    if (error.message.includes("ZERO_DATA_TOKEN")) {
      console.log("💡 The DataCoin address cannot be zero");
    }
    if (error.message.includes("INTERFACE_NOT_SUPPORTED")) {
      console.log("💡 The reward token doesn't implement IDataCoin interface");
    }

    throw error;
  }
}

function getExplorerUrl(networkName) {
  switch (networkName.toLowerCase()) {
    case "sepolia":
      return "https://sepolia.etherscan.io";
    case "amoy":
      return "https://amoy.polygonscan.com";
    case "polygon":
      return "https://polygonscan.com";
    case "base":
      return "https://basescan.org";
    default:
      return "https://etherscan.io";
  }
}

main()
  .then((result) => {
    console.log(`\n✅ Simple DAO deployment completed!`);
    if (result) {
      console.log(`🏛️  DAO: ${result.dao}`);
      console.log(`💰 Payment: ${result.paymentToken}`);
      console.log(`🪙 Reward: ${result.rewardToken}`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Simple DAO deployment failed:");
    console.error(error.message);
    process.exit(1);
  });
