/**
 * Create DAO Script - Deploy a new Community Access DAO
 * 
 * This script creates a new DAO using the deployed CommunityAccessDAOFactory
 * and TestToken. It demonstrates the full DAO creation workflow.
 * 
 * Usage:
 *   npx hardhat run scripts/createDAO.js --network sepolia
 *   npx hardhat run scripts/createDAO.js --network amoy
 * 
 * Environment variables required:
 * - PRIVATE_KEY: Wallet private key for deployment
 * - COMMUNITY_DAO_FACTORY_ADDRESS: Address of deployed factory
 * - PAYMENT_TOKEN_ADDRESS: Address of payment token (TestToken)
 * - DATACOIN_FACTORY_ADDRESS: Address of DataCoin factory
 */

require("dotenv").config();
const hre = require("hardhat");
const { getChainConfig } = require("./chainConfig.js");

// DAO Configuration - Customize these parameters
const DAO_CONFIG = {
  // DataCoin parameters
  dataCoin: {
    name: "Community Data Token",
    symbol: "CDT",
    tokenURI: "https://example.com/metadata/community-data-token.json",
    creatorAllocationBps: 1000, // 10% to creator
    creatorVestingDuration: 0, // No vesting for testing
    contributorsAllocationBps: 6000, // 60% to contributors
    liquidityAllocationBps: 3000, // 30% to liquidity
    lockToken: "0x0000000000000000000000000000000000000000", // No lock token required
    lockAmount: 0, // No lock amount required
  },
  
  // Access parameters
  access: {
    secondsPerToken: 3600, // 1 hour per token (3600 seconds)
    rewardRate: 1, // 1 DataCoin reward per payment token
    treasury: "", // Will be set to signer address if empty
  }
};

async function main() {
  console.log("\n🎯 Creating New Community Access DAO");
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);

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
  const dataCoinFactoryAddress = process.env.DATACOIN_FACTORY_ADDRESS;

  if (!factoryAddress || !paymentTokenAddress || !dataCoinFactoryAddress) {
    console.log("❌ Missing required contract addresses in .env:");
    console.log(`   COMMUNITY_DAO_FACTORY_ADDRESS: ${factoryAddress || 'MISSING'}`);
    console.log(`   PAYMENT_TOKEN_ADDRESS: ${paymentTokenAddress || 'MISSING'}`);
    console.log(`   DATACOIN_FACTORY_ADDRESS: ${dataCoinFactoryAddress || 'MISSING'}`);
    
    // Try to get from chainConfig as fallback
    const chainConfig = getChainConfig(hre.network.name);
    console.log("\n🔄 Attempting to use chainConfig fallback...");
    
    if (!chainConfig.communityDAOFactoryAddress && !factoryAddress) {
      throw new Error("❌ No CommunityAccessDAOFactory address available");
    }
    
    console.log(`✅ Using factory: ${factoryAddress || chainConfig.communityDAOFactoryAddress}`);
  }

  // Connect to contracts
  const factory = await hre.ethers.getContractAt(
    "CommunityAccessDAOFactory",
    factoryAddress,
    signer
  );

  const paymentToken = await hre.ethers.getContractAt(
    "TestToken",
    paymentTokenAddress,
    signer
  );

  // Set treasury to signer address if not specified
  if (!DAO_CONFIG.access.treasury) {
    DAO_CONFIG.access.treasury = signer.address;
  }

  console.log("\n📋 DAO Configuration:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🏭 Factory Address: ${factoryAddress}`);
  console.log(`💰 Payment Token: ${paymentTokenAddress}`);
  console.log(`🏗️  DataCoin Factory: ${dataCoinFactoryAddress}`);
  console.log(`\n🪙 DataCoin Settings:`);
  console.log(`   Name: ${DAO_CONFIG.dataCoin.name}`);
  console.log(`   Symbol: ${DAO_CONFIG.dataCoin.symbol}`);
  console.log(`   Creator Allocation: ${DAO_CONFIG.dataCoin.creatorAllocationBps / 100}%`);
  console.log(`   Contributors Allocation: ${DAO_CONFIG.dataCoin.contributorsAllocationBps / 100}%`);
  console.log(`   Liquidity Allocation: ${DAO_CONFIG.dataCoin.liquidityAllocationBps / 100}%`);
  console.log(`\n🔐 Access Settings:`);
  console.log(`   Seconds per Token: ${DAO_CONFIG.access.secondsPerToken} (${DAO_CONFIG.access.secondsPerToken / 3600} hours)`);
  console.log(`   Reward Rate: ${DAO_CONFIG.access.rewardRate} DataCoin per payment token`);
  console.log(`   Treasury: ${DAO_CONFIG.access.treasury}`);

  // Check balances before deployment
  const ethBalance = await provider.getBalance(signer.address);
  const tokenBalance = await paymentToken.balanceOf(signer.address);
  console.log(`\n💳 Account Status:`);
  console.log(`   ETH Balance: ${hre.ethers.formatEther(ethBalance)} ETH`);
  console.log(`   Token Balance: ${hre.ethers.formatEther(tokenBalance)} ${await paymentToken.symbol()}`);

  if (ethBalance < hre.ethers.parseEther("0.01")) {
    console.log("⚠️  Warning: Low ETH balance. You may need more ETH for gas fees.");
  }

  // Check if we're using a real DataCoin factory or mock
  let dataCoinFactory;
  try {
    dataCoinFactory = await hre.ethers.getContractAt("IDataCoinFactory", dataCoinFactoryAddress, signer);
    console.log("\n🔍 Testing DataCoin Factory...");
    
    // Try to call a view function to see if it's a real factory
    try {
      const minLockAmount = await dataCoinFactory.getMinLockAmount(DAO_CONFIG.dataCoin.lockToken);
      console.log(`✅ Real DataCoin Factory detected. Min lock amount: ${minLockAmount}`);
    } catch (e) {
      console.log("⚠️  Mock DataCoin Factory detected or lock token not supported");
      // For mock factory, we'll use minimal parameters
      DAO_CONFIG.dataCoin.lockToken = "0x0000000000000000000000000000000000000000";
      DAO_CONFIG.dataCoin.lockAmount = 0;
    }
  } catch (e) {
    console.log("⚠️  Could not connect to DataCoin Factory, using minimal parameters");
  }

  // Prepare transaction parameters
  const dcParams = {
    name: DAO_CONFIG.dataCoin.name,
    symbol: DAO_CONFIG.dataCoin.symbol,
    tokenURI: DAO_CONFIG.dataCoin.tokenURI,
    creatorAllocationBps: DAO_CONFIG.dataCoin.creatorAllocationBps,
    creatorVestingDuration: DAO_CONFIG.dataCoin.creatorVestingDuration,
    contributorsAllocationBps: DAO_CONFIG.dataCoin.contributorsAllocationBps,
    liquidityAllocationBps: DAO_CONFIG.dataCoin.liquidityAllocationBps,
    lockToken: DAO_CONFIG.dataCoin.lockToken,
    lockAmount: DAO_CONFIG.dataCoin.lockAmount,
    salt: hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes(`${Date.now()}-${signer.address}-${DAO_CONFIG.dataCoin.name}`)
    )
  };

  const apParams = {
    paymentToken: paymentTokenAddress,
    secondsPerToken: DAO_CONFIG.access.secondsPerToken,
    rewardRate: DAO_CONFIG.access.rewardRate,
    treasury: DAO_CONFIG.access.treasury
  };

  console.log("\n🔧 Final Parameters:");
  console.log(`   Lock Token: ${dcParams.lockToken}`);
  console.log(`   Lock Amount: ${dcParams.lockAmount}`);
  console.log(`   Salt: ${dcParams.salt}`);

  console.log("\n🚀 Creating Community Access DAO...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    // First try to estimate gas to catch errors early
    console.log("⛽ Estimating gas...");
    try {
      const gasEstimate = await factory.createCommunityAccessDAO.estimateGas(dcParams, apParams);
      console.log(`⛽ Gas Estimate: ${gasEstimate.toString()}`);
    } catch (gasError) {
      console.log("❌ Gas estimation failed. This usually indicates the transaction will revert.");
      console.log("Error details:", gasError.message);
      
      // Try to provide more specific error information
      if (gasError.message.includes("TREASURY_REQUIRED")) {
        throw new Error("Treasury address is required but not set properly");
      }
      if (gasError.message.includes("revert")) {
        throw new Error("Transaction would revert. Check contract parameters and factory implementation.");
      }
      throw gasError;
    }

    // Execute the transaction
    const tx = await factory.createCommunityAccessDAO(dcParams, apParams);
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);

    // Parse events to get DAO details
    const factoryInterface = factory.interface;
    const logs = receipt.logs.map(log => {
      try {
        return factoryInterface.parseLog(log);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    const daoDeployedEvent = logs.find(log => log.name === 'CommunityDAODeployed');
    
    if (daoDeployedEvent) {
      const {
        owner,
        daoAddress,
        dataCoin,
        paymentToken: eventPaymentToken,
        secondsPerToken,
        rewardRate,
        treasury,
        index
      } = daoDeployedEvent.args;

      console.log("\n🎉 DAO DEPLOYMENT SUCCESS!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🏛️  DAO Address: ${daoAddress}`);
      console.log(`🪙 DataCoin Address: ${dataCoin}`);
      console.log(`👤 Owner: ${owner}`);
      console.log(`💰 Payment Token: ${eventPaymentToken}`);
      console.log(`⏰ Seconds per Token: ${secondsPerToken.toString()}`);
      console.log(`🎁 Reward Rate: ${rewardRate.toString()}`);
      console.log(`🏦 Treasury: ${treasury}`);
      console.log(`📊 DAO Index: ${index.toString()}`);

      // Get explorer links
      const explorerBaseUrl = getExplorerBaseUrl(hre.network.name);
      console.log("\n🔗 EXPLORER LINKS:");
      console.log(`🏛️  DAO Contract: ${explorerBaseUrl}/address/${daoAddress}`);
      console.log(`🪙 DataCoin Contract: ${explorerBaseUrl}/address/${dataCoin}`);
      console.log(`📝 Transaction: ${explorerBaseUrl}/tx/${tx.hash}`);

      // Save addresses to a file for future use
      const deploymentData = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        timestamp: new Date().toISOString(),
        deployer: signer.address,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        addresses: {
          dao: daoAddress,
          dataCoin: dataCoin,
          factory: factoryAddress,
          paymentToken: paymentTokenAddress
        },
        config: {
          dataCoin: DAO_CONFIG.dataCoin,
          access: DAO_CONFIG.access
        }
      };

      // Write deployment info to file
      const fs = require('fs');
      const deploymentFileName = `dao-deployment-${hre.network.name}-${Date.now()}.json`;
      fs.writeFileSync(deploymentFileName, JSON.stringify(deploymentData, null, 2));
      console.log(`\n💾 Deployment details saved to: ${deploymentFileName}`);

      // Provide next steps
      console.log("\n🎯 NEXT STEPS:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("1. 🪙 Mint test tokens:");
      console.log(`   TestToken.mintTokens("${signer.address}", ethers.parseEther("1000"))`);
      console.log("2. 🔐 Purchase access:");
      console.log(`   DAO.buyAccess(ethers.parseEther("10"), "${signer.address}")`);
      console.log("3. 🎁 Check rewards:");
      console.log(`   DataCoin.balanceOf("${signer.address}")`);
      console.log("4. 🌐 Add to frontend:");
      console.log(`   DAO_ADDRESS="${daoAddress}"`);
      console.log(`   DATACOIN_ADDRESS="${dataCoin}"`);

    } else {
      console.log("⚠️  Could not parse deployment event. Transaction succeeded but details unavailable.");
    }

  } catch (error) {
    console.error("❌ DAO creation failed:");
    console.error(error.message);
    
    if (error.message.includes("TREASURY_REQUIRED")) {
      console.log("\n💡 Suggestion: Set a valid treasury address in DAO_CONFIG.access.treasury");
    }
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Suggestion: Add more ETH to your wallet for gas fees");
    }
    
    throw error;
  }
}

function getExplorerBaseUrl(networkName) {
  switch (networkName.toLowerCase()) {
    case 'sepolia':
      return 'https://sepolia.etherscan.io';
    case 'amoy':
      return 'https://amoy.polygonscan.com';
    case 'polygon':
      return 'https://polygonscan.com';
    case 'base':
      return 'https://basescan.org';
    case 'mainnet':
      return 'https://etherscan.io';
    default:
      return `https://${networkName}.etherscan.io`;
  }
}

// Test function to demonstrate DAO usage
async function testDAOFunctionality(daoAddress, dataCoinAddress, paymentTokenAddress) {
  console.log("\n🧪 Testing DAO Functionality...");
  
  const privateKey = process.env.PRIVATE_KEY;
  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  
  try {
    // Connect to contracts
    const dao = await hre.ethers.getContractAt("CommunityAccessDAO", daoAddress, signer);
    const dataCoin = await hre.ethers.getContractAt("TestToken", dataCoinAddress, signer); // Assuming DataCoin has similar interface
    const paymentToken = await hre.ethers.getContractAt("TestToken", paymentTokenAddress, signer);
    
    // 1. Mint payment tokens
    console.log("1. 🪙 Minting test payment tokens...");
    const mintAmount = hre.ethers.parseEther("100");
    await paymentToken.mintTokens(signer.address, mintAmount);
    console.log(`   ✅ Minted ${hre.ethers.formatEther(mintAmount)} tokens`);
    
    // 2. Approve DAO to spend tokens
    console.log("2. ✅ Approving DAO to spend tokens...");
    const purchaseAmount = hre.ethers.parseEther("10");
    await paymentToken.approve(daoAddress, purchaseAmount);
    console.log(`   ✅ Approved ${hre.ethers.formatEther(purchaseAmount)} tokens`);
    
    // 3. Purchase access
    console.log("3. 🔐 Purchasing DAO access...");
    const tx = await dao.buyAccess(purchaseAmount, signer.address);
    await tx.wait();
    console.log(`   ✅ Access purchased successfully!`);
    
    // 4. Check balances
    console.log("4. 📊 Checking balances...");
    const accessBalance = await dao.accessBalance(signer.address);
    const dataCoinBalance = await dataCoin.balanceOf(signer.address);
    console.log(`   Access Seconds: ${accessBalance.toString()}`);
    console.log(`   DataCoin Balance: ${hre.ethers.formatEther(dataCoinBalance)}`);
    
    console.log("\n🎉 DAO functionality test completed successfully!");
    
  } catch (error) {
    console.error("❌ DAO functionality test failed:");
    console.error(error.message);
  }
}

main()
  .then(() => {
    console.log("\n✅ DAO creation script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 DAO creation script failed:");
    console.error(error.message);
    process.exit(1);
  });