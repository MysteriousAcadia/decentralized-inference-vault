/**
 * Test BuyAccess Function Script
 * 
 * This script thoroughly tests the buyAccess function of the deployed DAO
 * including setting up proper permissions and testing the complete flow.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🧪 Testing BuyAccess Function");
  console.log(`🌐 Network: ${hre.network.name}`);

  // Setup signer
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Tester: ${signer.address}`);

  // Get deployed contract addresses
  const daoAddress = process.env.DAO_ADDRESS;
  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS;
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;

  if (!daoAddress || !paymentTokenAddress || !rewardTokenAddress) {
    throw new Error("❌ Missing contract addresses. Please ensure DAO_ADDRESS, PAYMENT_TOKEN_ADDRESS, and REWARD_TOKEN_ADDRESS are set in .env");
  }

  console.log("📋 Contract Addresses:");
  console.log(`🏛️  DAO: ${daoAddress}`);
  console.log(`💰 Payment Token: ${paymentTokenAddress}`);
  console.log(`🪙 Reward Token: ${rewardTokenAddress}`);

  // Connect to contracts
  const dao = await hre.ethers.getContractAt("CommunityAccessDAO", daoAddress, signer);
  const paymentToken = await hre.ethers.getContractAt("TestToken", paymentTokenAddress, signer);
  const rewardToken = await hre.ethers.getContractAt("MockDataCoin", rewardTokenAddress, signer);

  console.log("\n🔍 Initial Contract State:");
  
  // Check DAO configuration
  const owner = await dao.owner();
  const treasury = await dao.treasury();
  const rate = await dao.secondsPerToken();
  const rewardRate = await dao.rewardRate();

  console.log(`👤 DAO Owner: ${owner}`);
  console.log(`🏦 Treasury: ${treasury}`);
  console.log(`⏰ Seconds per Token: ${rate.toString()}`);
  console.log(`🎁 Reward Rate: ${hre.ethers.formatEther(rewardRate)}`);

  // Check initial balances
  const initialPaymentBalance = await paymentToken.balanceOf(signer.address);
  const initialRewardBalance = await rewardToken.balanceOf(signer.address);
  const initialAccess = await dao.getRemainingAccess(signer.address);

  console.log("\n💳 Initial User State:");
  console.log(`💰 Payment Token Balance: ${hre.ethers.formatEther(initialPaymentBalance)}`);
  console.log(`🪙 Reward Token Balance: ${hre.ethers.formatEther(initialRewardBalance)}`);
  console.log(`🔐 Remaining Access: ${initialAccess.toString()} seconds`);

  try {
    // Step 1: Setup minting permissions for DAO
    console.log("\n🔧 Setting up DAO permissions...");
    
    try {
      // Check if DAO already has minting role
      const minterRole = await rewardToken.MINTER_ROLE();
      console.log(`🔑 Minter Role: ${minterRole}`);
      
      // Grant minting role to DAO
      console.log("Granting minting role to DAO...");
      const grantTx = await rewardToken.grantRole(minterRole, daoAddress);
      await grantTx.wait();
      console.log("✅ DAO granted minting permissions");
      
    } catch (error) {
      console.log("⚠️  Note: Could not grant minting role:", error.message);
      console.log("   This might be expected if already granted or if permission structure differs");
    }

    // Step 2: Ensure we have payment tokens
    console.log("\n💰 Ensuring sufficient payment tokens...");
    
    const requiredAmount = hre.ethers.parseEther("10");
    if (initialPaymentBalance < requiredAmount) {
      console.log("Minting payment tokens...");
      const mintTx = await paymentToken.mintTokens(signer.address, requiredAmount);
      await mintTx.wait();
      console.log("✅ Payment tokens minted");
    } else {
      console.log("✅ Sufficient payment tokens already available");
    }

    // Step 3: Approve DAO to spend tokens
    console.log("\n✅ Approving DAO to spend payment tokens...");
    const purchaseAmount = hre.ethers.parseEther("5");
    
    const approveTx = await paymentToken.approve(daoAddress, purchaseAmount);
    await approveTx.wait();
    console.log(`✅ Approved ${hre.ethers.formatEther(purchaseAmount)} tokens for DAO`);
    
    // Verify approval
    const allowance = await paymentToken.allowance(signer.address, daoAddress);
    console.log(`🔍 Current Allowance: ${hre.ethers.formatEther(allowance)}`);

    // Step 4: Test buyAccess function
    console.log("\n🛒 Testing buyAccess function...");
    console.log(`💸 Purchase Amount: ${hre.ethers.formatEther(purchaseAmount)}`);
    console.log(`👥 Recipient: ${signer.address}`);
    
    // Get current state before purchase
    const beforePaymentBalance = await paymentToken.balanceOf(signer.address);
    const beforeRewardBalance = await rewardToken.balanceOf(signer.address);
    const beforeAccess = await dao.getRemainingAccess(signer.address);
    const beforeDAOBalance = await paymentToken.balanceOf(daoAddress);

    console.log(`\n📊 Pre-Purchase State:`);
    console.log(`   Payment Balance: ${hre.ethers.formatEther(beforePaymentBalance)}`);
    console.log(`   Reward Balance: ${hre.ethers.formatEther(beforeRewardBalance)}`);
    console.log(`   Access Remaining: ${beforeAccess.toString()} seconds`);
    console.log(`   DAO Balance: ${hre.ethers.formatEther(beforeDAOBalance)}`);

    // Execute buyAccess
    console.log("\n🎯 Executing buyAccess...");
    try {
      const buyTx = await dao.buyAccess(purchaseAmount, signer.address);
      console.log(`📝 Transaction Hash: ${buyTx.hash}`);
      
      const receipt = await buyTx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);

      // Parse events
      console.log("\n📢 Events Emitted:");
      for (const log of receipt.logs) {
        try {
          const parsed = dao.interface.parseLog(log);
          if (parsed) {
            console.log(`   📋 ${parsed.name}:`, parsed.args);
          }
        } catch (e) {
          // Try reward token events
          try {
            const parsed = rewardToken.interface.parseLog(log);
            if (parsed) {
              console.log(`   🪙 RewardToken - ${parsed.name}:`, parsed.args);
            }
          } catch (e2) {
            // Not a recognized event, skip
          }
        }
      }

      // Check post-purchase state
      const afterPaymentBalance = await paymentToken.balanceOf(signer.address);
      const afterRewardBalance = await rewardToken.balanceOf(signer.address);
      const afterAccess = await dao.getRemainingAccess(signer.address);
      const afterDAOBalance = await paymentToken.balanceOf(daoAddress);

      console.log(`\n📊 Post-Purchase State:`);
      console.log(`   Payment Balance: ${hre.ethers.formatEther(afterPaymentBalance)}`);
      console.log(`   Reward Balance: ${hre.ethers.formatEther(afterRewardBalance)}`);
      console.log(`   Access Remaining: ${afterAccess.toString()} seconds (${afterAccess.toString() / 3600} hours)`);
      console.log(`   DAO Balance: ${hre.ethers.formatEther(afterDAOBalance)}`);

      // Calculate changes
      const paymentUsed = beforePaymentBalance - afterPaymentBalance;
      const rewardsReceived = afterRewardBalance - beforeRewardBalance;
      const accessGained = afterAccess - beforeAccess;
      const daoReceived = afterDAOBalance - beforeDAOBalance;

      console.log(`\n📈 Transaction Results:`);
      console.log(`   💸 Payment Tokens Used: ${hre.ethers.formatEther(paymentUsed)}`);
      console.log(`   🎁 Reward Tokens Received: ${hre.ethers.formatEther(rewardsReceived)}`);
      console.log(`   ⏱️  Access Time Gained: ${accessGained.toString()} seconds (${accessGained.toString() / 3600} hours)`);
      console.log(`   🏦 DAO Received: ${hre.ethers.formatEther(daoReceived)}`);

      // Verify expected calculations
      const expectedAccess = purchaseAmount * rate;
      const expectedReward = purchaseAmount * rewardRate / (10n ** 18n); // Normalize for reward rate

      console.log(`\n🧮 Verification:`);
      console.log(`   Expected Access: ${expectedAccess.toString()} seconds`);
      console.log(`   Actual Access: ${accessGained.toString()} seconds`);
      console.log(`   ✅ Access Calculation: ${expectedAccess.toString() === accessGained.toString() ? 'CORRECT' : 'INCORRECT'}`);
      
      if (rewardsReceived > 0) {
        console.log(`   ✅ Rewards: RECEIVED (${hre.ethers.formatEther(rewardsReceived)})`);
      } else {
        console.log(`   ⚠️  Rewards: NONE (may need minting permissions)`);
      }

      // Test access validation
      console.log("\n🔐 Testing Access Validation:");
      const hasAccess = await dao.hasAccess(signer.address);
      const expiry = await dao.getExpiry(signer.address);
      
      console.log(`   Current Access: ${hasAccess ? 'YES' : 'NO'}`);
      console.log(`   Expiry Timestamp: ${expiry.toString()}`);
      console.log(`   Expiry Date: ${new Date(Number(expiry) * 1000).toLocaleString()}`);

      console.log("\n🎉 BUY ACCESS TEST COMPLETED SUCCESSFULLY!");
      
    } catch (buyError) {
      console.error("❌ buyAccess function failed:");
      console.error("Error:", buyError.message);
      
      // Provide debugging information
      if (buyError.message.includes("MINT_FAIL")) {
        console.log("\n💡 Debugging MINT_FAIL:");
        console.log("   - The DAO doesn't have minting permissions on the reward token");
        console.log("   - Try granting MINTER_ROLE to DAO address");
        console.log(`   - Command: await rewardToken.grantRole(await rewardToken.MINTER_ROLE(), "${daoAddress}")`);
      }
      
      if (buyError.message.includes("insufficient allowance") || buyError.message.includes("ERC20: transfer amount exceeds allowance")) {
        console.log("\n💡 Debugging Allowance Issue:");
        console.log("   - The approval might not have been processed");
        console.log("   - Check if approval transaction was confirmed");
        console.log("   - Try increasing the approval amount");
      }
      
      if (buyError.message.includes("execution reverted")) {
        console.log("\n💡 General Debugging:");
        console.log("   - Check all contract addresses are correct");
        console.log("   - Ensure signer has enough ETH for gas");
        console.log("   - Verify contract interfaces match deployed contracts");
      }
      
      throw buyError;
    }

  } catch (error) {
    console.error("\n💥 Test failed with error:");
    console.error(error.message);
    throw error;
  }

  // Optional: Test multiple purchases
  console.log("\n🔄 Testing Second Purchase (Extension):");
  try {
    const secondAmount = hre.ethers.parseEther("2");
    
    // Approve second purchase
    await paymentToken.approve(daoAddress, secondAmount);
    console.log(`✅ Approved ${hre.ethers.formatEther(secondAmount)} for second purchase`);
    
    const beforeSecondAccess = await dao.getRemainingAccess(signer.address);
    
    const secondBuyTx = await dao.buyAccess(secondAmount, signer.address);
    await secondBuyTx.wait();
    
    const afterSecondAccess = await dao.getRemainingAccess(signer.address);
    const accessExtension = afterSecondAccess - beforeSecondAccess;
    
    console.log(`✅ Second purchase successful!`);
    console.log(`   Access Extended By: ${accessExtension.toString()} seconds (${accessExtension.toString() / 3600} hours)`);
    console.log(`   Total Access Now: ${afterSecondAccess.toString()} seconds (${afterSecondAccess.toString() / 3600} hours)`);
    
  } catch (secondError) {
    console.log("⚠️  Second purchase test failed:", secondError.message);
  }
}

main()
  .then(() => {
    console.log("\n🏁 All tests completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test suite failed:");
    console.error(error.message);
    process.exit(1);
  });