/**
 * Final Working DAO Deployment Script
 *
 * This script creates a DAO using the fixed MockDataCoin implementation.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🎯 Final Working DAO Deployment");
  console.log(`🌐 Network: ${hre.network.name}`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer: ${signer.address}`);

  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS;
  if (!paymentTokenAddress) {
    throw new Error("❌ Missing PAYMENT_TOKEN_ADDRESS in .env");
  }

  console.log(`💰 Payment Token: ${paymentTokenAddress}`);

  // Deploy MockDataCoin as reward token
  console.log("\n🪙 Deploying MockDataCoin as reward token...");
  const MockDataCoin = await hre.ethers.getContractFactory("MockDataCoin");
  const rewardToken = await MockDataCoin.deploy(
    "DAO Reward Coin",
    "DRC",
    "https://example.com/reward-coin.json"
  );
  await rewardToken.waitForDeployment();

  const rewardTokenAddress = await rewardToken.getAddress();
  console.log(`✅ MockDataCoin deployed: ${rewardTokenAddress}`);

  // Deploy CommunityAccessDAO
  console.log("\n🏛️  Deploying CommunityAccessDAO...");

  const CommunityAccessDAO = await hre.ethers.getContractFactory(
    "CommunityAccessDAO"
  );

  const dao = await CommunityAccessDAO.deploy(
    paymentTokenAddress, // payment token (existing TestToken)
    rewardTokenAddress, // reward token (our MockDataCoin)
    3600, // 1 hour per token
    hre.ethers.parseEther("1"), // 1 reward token per payment token
    signer.address // treasury
  );

  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();

  console.log(`✅ CommunityAccessDAO deployed: ${daoAddress}`);

  // Test the DAO
  console.log("\n🧪 Testing DAO functionality...");

  try {
    const owner = await dao.owner();
    const treasury = await dao.treasury();
    const rate = await dao.secondsPerToken();

    console.log(`👤 DAO Owner: ${owner}`);
    console.log(`🏦 Treasury: ${treasury}`);
    console.log(`⏰ Rate: ${rate.toString()} seconds per token`);

    // Test a complete purchase flow
    const paymentToken = await hre.ethers.getContractAt(
      "TestToken",
      paymentTokenAddress,
      signer
    );

    console.log("\n💰 Testing purchase flow...");

    // 1. Ensure we have payment tokens
    const balance = await paymentToken.balanceOf(signer.address);
    console.log(`Payment token balance: ${hre.ethers.formatEther(balance)}`);

    if (balance < hre.ethers.parseEther("10")) {
      console.log("Minting payment tokens...");
      await paymentToken.mintTokens(
        signer.address,
        hre.ethers.parseEther("100")
      );
    }

    // 2. Approve DAO to spend
    const purchaseAmount = hre.ethers.parseEther("5");
    console.log(
      `Approving ${hre.ethers.formatEther(purchaseAmount)} tokens...`
    );
    await paymentToken.approve(daoAddress, purchaseAmount);

    // 3. Buy access
    console.log("Purchasing access...");
    const buyTx = await dao.buyAccess(purchaseAmount, signer.address);
    await buyTx.wait();

    // 4. Check results
    const accessBalance = await dao.accessBalance(signer.address);
    const rewardBalance = await rewardToken.balanceOf(signer.address);

    console.log(`✅ Access purchased successfully!`);
    console.log(
      `🔐 Access time: ${accessBalance.toString()} seconds (${
        accessBalance.toString() / 3600
      } hours)`
    );
    console.log(`🎁 Reward tokens: ${hre.ethers.formatEther(rewardBalance)}`);
  } catch (error) {
    console.log("❌ DAO test failed:", error.message);
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
    configuration: {
      secondsPerToken: 3600,
      rewardRate: "1.0",
      treasury: signer.address,
    },
  };

  const fs = require("fs");
  const filename = `working-dao-deployment-${
    hre.network.name
  }-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📋 DEPLOYMENT COMPLETE!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏛️  DAO Address: ${daoAddress}`);
  console.log(`💰 Payment Token: ${paymentTokenAddress} (TestToken)`);
  console.log(`🪙 Reward Token: ${rewardTokenAddress} (MockDataCoin)`);
  console.log(
    `🔗 DAO on Explorer: https://sepolia.etherscan.io/address/${daoAddress}`
  );
  console.log(`💾 Details saved: ${filename}`);

  console.log("\n🎯 USAGE INSTRUCTIONS:");
  console.log("1. Mint payment tokens: TestToken.mintTokens(user, amount)");
  console.log("2. Approve DAO: PaymentToken.approve(daoAddress, amount)");
  console.log("3. Buy access: DAO.buyAccess(amount, recipient)");
  console.log("4. Check access: DAO.accessBalance(user)");
  console.log("5. Check rewards: RewardToken.balanceOf(user)");

  // Add addresses to .env instructions
  console.log("\n📝 Add to your .env file:");
  console.log(`DAO_ADDRESS=${daoAddress}`);
  console.log(`REWARD_TOKEN_ADDRESS=${rewardTokenAddress}`);

  return {
    dao: daoAddress,
    paymentToken: paymentTokenAddress,
    rewardToken: rewardTokenAddress,
  };
}

main()
  .then((result) => {
    console.log(`\n🎉 DAO deployment successful!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 DAO deployment failed:");
    console.error(error.message);
    process.exit(1);
  });
