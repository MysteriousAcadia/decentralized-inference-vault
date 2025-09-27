/**
 * Deployment script for TestToken (Mock ERC20 for testing)
 * 
 * This script deploys a test ERC20 token that allows unlimited minting by anyone.
 * Perfect for testing the CommunityAccessDAO functionality without needing real tokens.
 * 
 * Usage:
 *   npx hardhat run scripts/deployTestToken.js --network sepolia
 *   npx hardhat run scripts/deployTestToken.js --network amoy
 *   npx hardhat run scripts/deployTestToken.js --network localhost
 * 
 * Environment variables:
 * - PRIVATE_KEY: Your wallet private key
 * - TOKEN_NAME (optional): Name of the test token (default: "Test Payment Token")
 * - TOKEN_SYMBOL (optional): Symbol of the test token (default: "TPT")
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🪙 Deploying TestToken (Mock ERC20)");
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);

  // Get configuration from environment or use defaults
  const tokenName = process.env.TOKEN_NAME || "Test Payment Token";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "TPT";

  // Validate required environment variables
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  // Create signer directly from private key in .env
  const provider = hre.ethers.provider;
  const deployer = new hre.ethers.Wallet(privateKey, provider);
  
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Validate minimum balance for deployment
  const minBalance = hre.ethers.parseEther("0.001"); // 0.001 ETH minimum
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.001 ETH, have ${hre.ethers.formatEther(balance)} ETH`);
  }

  console.log("\n📋 Token Configuration:");
  console.log(`📛 Name: ${tokenName}`);
  console.log(`🏷️  Symbol: ${tokenSymbol}`);
  console.log(`🔢 Decimals: 18 (standard)`);
  console.log(`🎯 Initial Supply: 1,000,000 tokens (to deployer)`);
  console.log(`🔓 Minting: Unlimited, permissionless`);

  // Deploy TestToken
  console.log("\n🔨 Deploying TestToken contract...");
  const TestToken = await hre.ethers.getContractFactory("TestToken", deployer);
  
  const token = await TestToken.deploy(tokenName, tokenSymbol);

  console.log("⏳ Waiting for deployment confirmation...");
  await token.waitForDeployment();

  const deployedAddress = await token.getAddress();
  console.log("\n✅ TestToken deployed successfully!");
  
  // Get initial token info
  const [name, symbol, decimals, totalSupply] = await token.getTokenInfo();
  const deployerBalance = await token.balanceOf(deployer.address);
  
  // Display deployment results
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 DEPLOYMENT RESULTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Token Address        : ${deployedAddress}`);
  console.log(`📛 Name                 : ${name}`);
  console.log(`🏷️  Symbol               : ${symbol}`);
  console.log(`🔢 Decimals             : ${decimals}`);
  console.log(`📊 Total Supply         : ${hre.ethers.formatEther(totalSupply)} ${symbol}`);
  console.log(`👤 Deployer Balance     : ${hre.ethers.formatEther(deployerBalance)} ${symbol}`);
  console.log(`🌐 Network              : ${hre.network.name}`);
  console.log(`🔗 Chain ID             : ${hre.network.config.chainId}`);
  console.log(`👤 Deployer             : ${deployer.address}`);
  
  // Network-specific explorer links
  const getExplorerLink = (address, networkName) => {
    switch (networkName.toLowerCase()) {
      case 'sepolia':
        return `https://sepolia.etherscan.io/address/${address}`;
      case 'amoy':
        return `https://www.oklink.com/amoy/address/${address}`;
      case 'polygon':
        return `https://polygonscan.com/address/${address}`;
      case 'base':
        return `https://basescan.org/address/${address}`;
      default:
        return `Explorer: Check ${networkName} block explorer for ${address}`;
    }
  };
  
  console.log(`🔍 Explorer             : ${getExplorerLink(deployedAddress, hre.network.name)}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Test minting functionality
  console.log("\n🧪 Testing minting functionality...");
  
  try {
    // Mint some tokens to test
    console.log("🔄 Minting 1000 tokens to deployer...");
    const mintTx = await token.mintTokensToSelf(1000);
    await mintTx.wait();
    
    const newBalance = await token.balanceOfTokens(deployer.address);
    console.log(`✅ New balance: ${newBalance.toLocaleString()} ${symbol}`);
    
    console.log("✅ Minting functionality verified!");
  } catch (error) {
    console.log("❌ Minting test failed:", error.message);
  }

  // Display usage instructions
  console.log("\n📝 USAGE INSTRUCTIONS:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 Basic Minting:");
  console.log(`   token.mintTokens("${deployer.address}", 1000) // Mint 1000 tokens`);
  console.log(`   token.mintToSelf(ethers.parseEther("100"))     // Mint 100 tokens to yourself`);
  console.log("");
  console.log("🎯 Batch Operations:");
  console.log("   token.airdrop([addr1, addr2, addr3], 100)      // Airdrop 100 to each");
  console.log("   token.mintMillion(address)                     // Mint 1M tokens");
  console.log("");
  console.log("📋 For Community DAO Testing:");
  console.log("1. Save this token address to your .env file:");
  console.log(`   PAYMENT_TOKEN_ADDRESS=${deployedAddress}`);
  console.log("");
  console.log("2. Mint tokens to users who want to buy DAO access:");
  console.log(`   await token.mintTokens(userAddress, 10000)`);
  console.log("");
  console.log("3. Users can then approve and buy DAO access:");
  console.log("   await token.approve(daoAddress, amount)");
  console.log("   await dao.buyAccess(amount, recipient)");

  // Contract interaction examples
  console.log("\n🛠️  CONTRACT INTERACTION EXAMPLES:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Using ethers.js:");
  console.log(`const token = new ethers.Contract("${deployedAddress}", abi, signer);`);
  console.log("");
  console.log("// Mint 1000 tokens to yourself");
  console.log("await token.mintTokensToSelf(1000);");
  console.log("");
  console.log("// Mint specific amount to another address");
  console.log('await token.mint("0x...", ethers.parseEther("100"));');
  console.log("");
  console.log("// Check balance in human-readable format");
  console.log("const balance = await token.balanceOfTokens(address);");

  // Save deployment info to file (optional)
  if (process.env.SAVE_DEPLOYMENT_INFO === 'true') {
    const fs = require('fs');
    const path = require('path');
    
    const deploymentInfo = {
      contractName: "TestToken",
      address: deployedAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      constructor: {
        name: tokenName,
        symbol: tokenSymbol
      },
      tokenInfo: {
        name: name,
        symbol: symbol,
        decimals: decimals.toString(),
        totalSupply: totalSupply.toString(),
        deployerBalance: deployerBalance.toString()
      },
      explorerLink: getExplorerLink(deployedAddress, hre.network.name),
      features: [
        "Unlimited minting by anyone",
        "Standard ERC20 functionality",
        "Batch operations support",
        "Human-readable convenience functions"
      ]
    };

    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const filename = `TestToken-${tokenSymbol}-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📄 Deployment info saved to: ${filepath}`);
  }
}

main()
  .then(() => {
    console.log("\n🎉 TestToken deployment completed successfully!");
    console.log("💡 This token is ready for testing your Community DAO!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    if (error.reason) {
      console.error(`Reason: ${error.reason}`);
    }
    process.exit(1);
  });