/**
 * Direct DAO Deployment Script
 *
 * This script deploys a CommunityAccessDAO directly without using the factory,
 * which allows us to test the DAO functionality independently.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🎯 Direct DAO Deployment (Bypassing Factory)");
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

  // First, deploy a mock DataCoin that implements IDataCoin interface
  console.log("\n📝 Deploying Mock DataCoin...");
  const MockDataCoin = await hre.ethers.getContractFactory("MockDataCoin");
  const dataCoin = await MockDataCoin.deploy(
    "Community Data Coin",
    "CDC",
    "https://example.com/datacoin.json"
  );
  await dataCoin.waitForDeployment();

  const dataCoinAddress = await dataCoin.getAddress();
  console.log(`✅ DataCoin deployed at: ${dataCoinAddress}`);

  // Now deploy the CommunityAccessDAO
  console.log("\n🏛️  Deploying CommunityAccessDAO...");

  const CommunityAccessDAO = await hre.ethers.getContractFactory(
    "CommunityAccessDAO"
  );

  const daoParams = {
    paymentToken: paymentTokenAddress,
    dataCoin: dataCoinAddress,
    secondsPerToken: 3600, // 1 hour per token
    rewardRate: hre.ethers.parseEther("1"), // 1 DataCoin per payment token
    treasury: signer.address,
  };

  console.log("📋 DAO Parameters:");
  console.log(`   Payment Token: ${daoParams.paymentToken}`);
  console.log(`   DataCoin: ${daoParams.dataCoin}`);
  console.log(`   Seconds per Token: ${daoParams.secondsPerToken}`);
  console.log(
    `   Reward Rate: ${hre.ethers.formatEther(daoParams.rewardRate)}`
  );
  console.log(`   Treasury: ${daoParams.treasury}`);

  const dao = await CommunityAccessDAO.deploy(
    daoParams.paymentToken,
    daoParams.dataCoin,
    daoParams.secondsPerToken,
    daoParams.rewardRate,
    daoParams.treasury
  );

  await dao.waitForDeployment();
  const daoAddress = await dao.getAddress();

  console.log(`✅ CommunityAccessDAO deployed at: ${daoAddress}`);

  // Test the DAO functionality
  console.log("\n🧪 Testing DAO Functionality...");

  try {
    // Connect to payment token
    const paymentToken = await hre.ethers.getContractAt(
      "TestToken",
      paymentTokenAddress,
      signer
    );

    // 1. Check initial balances
    console.log("1. 📊 Checking initial state...");
    const initialPaymentBalance = await paymentToken.balanceOf(signer.address);
    const initialDataBalance = await dataCoin.balanceOf(signer.address);
    console.log(
      `   Payment Token Balance: ${hre.ethers.formatEther(
        initialPaymentBalance
      )}`
    );
    console.log(
      `   DataCoin Balance: ${hre.ethers.formatEther(initialDataBalance)}`
    );

    // 2. Mint some payment tokens if needed
    console.log("2. 🪙 Ensuring sufficient payment tokens...");
    if (initialPaymentBalance < hre.ethers.parseEther("10")) {
      console.log("   Minting additional payment tokens...");
      await paymentToken.mintTokens(
        signer.address,
        hre.ethers.parseEther("100")
      );
    }

    // 3. Give DAO minting permission for DataCoin
    console.log("3. 🔐 Granting DAO minting permissions...");
    await dataCoin.grantRole(await dataCoin.MINTER_ROLE(), daoAddress);
    console.log("   ✅ DAO granted minting role for DataCoin");

    // 4. Approve DAO to spend payment tokens
    console.log("4. ✅ Approving payment tokens...");
    const purchaseAmount = hre.ethers.parseEther("5");
    await paymentToken.approve(daoAddress, purchaseAmount);

    // 5. Purchase access
    console.log("5. 🛒 Purchasing DAO access...");
    const buyTx = await dao.buyAccess(purchaseAmount, signer.address);
    await buyTx.wait();
    console.log("   ✅ Access purchased successfully!");

    // 6. Check if rewards were automatically minted by DAO
    console.log("6. 🎁 Checking reward tokens...");
    // Note: The DAO should automatically mint rewards during buyAccess call

    // 7. Check final state
    console.log("7. 📈 Checking final state...");
    const accessBalance = await dao.accessBalance(signer.address);
    const finalPaymentBalance = await paymentToken.balanceOf(signer.address);
    const finalDataBalance = await dataCoin.balanceOf(signer.address);

    console.log(
      `   Access Seconds: ${accessBalance.toString()} (${
        accessBalance.toString() / 3600
      } hours)`
    );
    console.log(
      `   Payment Token Balance: ${hre.ethers.formatEther(finalPaymentBalance)}`
    );
    console.log(
      `   DataCoin Balance: ${hre.ethers.formatEther(finalDataBalance)}`
    );

    console.log("\n🎉 DAO FUNCTIONALITY TEST COMPLETE!");
  } catch (error) {
    console.error("❌ DAO functionality test failed:", error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    timestamp: new Date().toISOString(),
    deployer: signer.address,
    addresses: {
      dao: daoAddress,
      dataCoin: dataCoinAddress,
      paymentToken: paymentTokenAddress,
    },
    parameters: daoParams,
    explorerLinks: {
      dao: `${getExplorerUrl(hre.network.name)}/address/${daoAddress}`,
      dataCoin: `${getExplorerUrl(
        hre.network.name
      )}/address/${dataCoinAddress}`,
      paymentToken: `${getExplorerUrl(
        hre.network.name
      )}/address/${paymentTokenAddress}`,
    },
  };

  // Write to file
  const fs = require("fs");
  const filename = `direct-dao-deployment-${
    hre.network.name
  }-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏛️  DAO Address: ${daoAddress}`);
  console.log(`🪙 DataCoin Address: ${dataCoinAddress}`);
  console.log(`💰 Payment Token: ${paymentTokenAddress}`);
  console.log(`🔗 DAO Explorer: ${deploymentInfo.explorerLinks.dao}`);
  console.log(`💾 Details saved to: ${filename}`);

  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Add these addresses to your frontend configuration");
  console.log("2. Test the full access purchase flow in your UI");
  console.log("3. Implement reward token minting in your DAO logic");
  console.log(
    "4. Consider implementing proper access control for DataCoin minting"
  );

  return {
    dao: daoAddress,
    dataCoin: dataCoinAddress,
    paymentToken: paymentTokenAddress,
  };
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
    console.log(`\n✅ Direct DAO deployment completed successfully!`);
    console.log(`🏛️  DAO: ${result.dao}`);
    console.log(`🪙 DataCoin: ${result.dataCoin}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Direct DAO deployment failed:");
    console.error(error.message);
    process.exit(1);
  });
