/**
 * Deployment script for CommunityAccessDAOFactory
 * 
 * This script deploys the CommunityAccessDAOFactory contract which is responsible for:
 * - Creating new CommunityAccessDAO instances
 * - Managing DataCoin creation through the DataCoinFactory
 * - Tracking ownership and providing discovery features
 * 
 * Usage:
 *   npx hardhat run scripts/deployCommunityAccessDAOFactory.js --network sepolia
 *   npx hardhat run scripts/deployCommunityAccessDAOFactory.js --network amoy
 * 
 * Required environment variables:
 * - PRIVATE_KEY: Your wallet private key
 * - DATACOIN_FACTORY_ADDRESS: Address of the deployed DataCoinFactory
 * - TREASURY_ADDRESS: Default treasury address for DAOs (optional, can be zero address)
 */

require("dotenv").config();
const hre = require("hardhat");
const { getChainConfig } = require("./chainConfig.js");

async function main() {
  console.log("\n🚀 Deploying CommunityAccessDAOFactory");
  console.log(`🌐 Network: ${hre.network.name}`);
  console.log(`🔗 Chain ID: ${hre.network.config.chainId}`);

  // Validate required environment variables
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  // Get DataCoin factory address from env or fallback to chainConfig
  let dataCoinFactoryAddress = process.env.DATACOIN_FACTORY_ADDRESS;
  if (!dataCoinFactoryAddress) {
    try {
      const chainConfig = getChainConfig(hre.network.name);
      dataCoinFactoryAddress = chainConfig.factoryAddress;
      console.log(`ℹ️  Using DataCoin factory address from chainConfig: ${dataCoinFactoryAddress}`);
    } catch (error) {
      throw new Error("❌ Missing DATACOIN_FACTORY_ADDRESS environment variable and no factory address found in chainConfig");
    }
  }

  // Default treasury is optional - can be zero address
  const defaultTreasury = process.env.TREASURY_ADDRESS || hre.ethers.ZeroAddress;
  
  // Create signer directly from private key in .env
  const provider = hre.ethers.provider;
  const deployer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Validate minimum balance for deployment
  const minBalance = hre.ethers.parseEther("0.01"); // 0.01 ETH minimum
  if (balance < minBalance) {
    throw new Error(`❌ Insufficient balance. Need at least 0.01 ETH, have ${hre.ethers.formatEther(balance)} ETH`);
  }

  console.log("\n📋 Deployment Configuration:");
  console.log(`🏭 DataCoin Factory: ${dataCoinFactoryAddress}`);
  console.log(`🏛️  Default Treasury: ${defaultTreasury === hre.ethers.ZeroAddress ? "None (Zero Address)" : defaultTreasury}`);

  // Deploy CommunityAccessDAOFactory
  console.log("\n🔨 Deploying contract...");
  const CommunityAccessDAOFactory = await hre.ethers.getContractFactory("CommunityAccessDAOFactory", deployer);
  
  const factory = await CommunityAccessDAOFactory.deploy(
    defaultTreasury,
    dataCoinFactoryAddress
  );

  console.log("⏳ Waiting for deployment confirmation...");
  await factory.waitForDeployment();

  const deployedAddress = await factory.getAddress();
  console.log("\n✅ CommunityAccessDAOFactory deployed successfully!");
  
  // Display deployment results
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📍 DEPLOYMENT RESULTS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📍 Factory Address      : ${deployedAddress}`);
  console.log(`🏭 DataCoin Factory     : ${dataCoinFactoryAddress}`);
  console.log(`🏛️  Default Treasury     : ${defaultTreasury}`);
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

  // Display next steps
  console.log("\n📝 NEXT STEPS:");
  console.log("1. Save the factory address to your .env file:");
  console.log(`   COMMUNITY_DAO_FACTORY_ADDRESS=${deployedAddress}`);
  console.log("");
  console.log("2. Use this address in your DAO creation scripts");
  console.log("");
  console.log("3. To create a new Community Access DAO, run:");
  console.log(`   npm run create:dao${hre.network.name === 'localhost' ? '' : ':' + hre.network.name}`);
  console.log("");
  console.log("4. Make sure your .env file has the required variables:");
  console.log("   - PAYMENT_TOKEN_ADDRESS");
  console.log("   - SECONDS_PER_TOKEN");
  console.log("   - REWARD_RATE");
  console.log("   - DATACOIN_* parameters for token creation");

  // Save deployment info to file (optional)
  if (process.env.SAVE_DEPLOYMENT_INFO === 'true') {
    const fs = require('fs');
    const path = require('path');
    
    const deploymentInfo = {
      contractName: "CommunityAccessDAOFactory",
      address: deployedAddress,
      network: hre.network.name,
      chainId: hre.network.config.chainId,
      deployer: deployer.address,
      deploymentTime: new Date().toISOString(),
      constructor: {
        defaultTreasury,
        dataCoinFactory: dataCoinFactoryAddress
      },
      explorerLink: getExplorerLink(deployedAddress, hre.network.name)
    };

    const deploymentDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const filename = `CommunityAccessDAOFactory-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n📄 Deployment info saved to: ${filepath}`);
  }
}

main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
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