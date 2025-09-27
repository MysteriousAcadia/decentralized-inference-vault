const hre = require("hardhat");

/**
 * Utility script to deploy a new model access token and register it in the vault
 * Usage: npx hardhat run scripts/deployModel.js --network <network>
 */

async function main() {
  // Configuration - Update these values for your specific model
  const config = {
    // Model Vault contract address (from previous deployment)
    modelVaultAddress: process.env.MODEL_VAULT_ADDRESS || "", // Set this!

    // Model Token Configuration
    modelToken: {
      name: "Advanced AI Model Token",
      symbol: "AIMT",
      modelId: "advanced-ai-model-v2",
      modelName: "Advanced AI Model",
      modelDescription: "An advanced AI model for complex inference tasks",
      maxSupply: hre.ethers.parseEther("500000"), // 500K tokens
      accessThreshold: hre.ethers.parseEther("5"), // 5 tokens for access
      premiumThreshold: hre.ethers.parseEther("50"), // 50 tokens for premium
    },

    // Model Registration Configuration
    modelInfo: {
      cid: "QmAdvancedModelCID123456789", // Replace with actual IPFS CID
      pricePerInference: hre.ethers.parseEther("0.005"), // 0.005 ETH per inference
      category: 1, // IMAGE_GENERATION - see ModelVault.sol for categories
      tags: ["image", "generation", "advanced"],
      version: "v2.0",
    },
  };

  console.log("Deploying new AI model...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "ETH\n"
  );

  if (!config.modelVaultAddress) {
    console.error(
      "❌ Please set MODEL_VAULT_ADDRESS environment variable or update the script"
    );
    process.exit(1);
  }

  try {
    // Step 1: Deploy ModelAccessToken
    console.log("1. Deploying ModelAccessToken...");
    const ModelAccessToken = await hre.ethers.getContractFactory(
      "ModelAccessToken"
    );
    const modelAccessToken = await ModelAccessToken.deploy(
      config.modelToken.name,
      config.modelToken.symbol,
      config.modelToken.modelId,
      config.modelToken.modelName,
      config.modelToken.modelDescription,
      deployer.address, // Model owner
      config.modelToken.maxSupply,
      config.modelToken.accessThreshold,
      config.modelToken.premiumThreshold
    );
    await modelAccessToken.waitForDeployment();
    const tokenAddress = await modelAccessToken.getAddress();
    console.log("ModelAccessToken deployed to:", tokenAddress);

    // Step 2: Configure the token
    console.log("\n2. Configuring ModelAccessToken...");

    // Set mint price
    console.log("   - Setting mint price to 0.01 ETH...");
    await modelAccessToken.setMintPrice(hre.ethers.parseEther("0.01"));

    // Enable public minting
    console.log("   - Enabling public minting...");
    await modelAccessToken.setPublicMintEnabled(true);

    // Step 3: Register model in ModelVault
    console.log("\n3. Registering model in ModelVault...");

    const modelVault = await hre.ethers.getContractAt(
      "ModelVault",
      config.modelVaultAddress
    );

    // Generate model ID
    const modelId = hre.ethers.keccak256(
      hre.ethers.solidityPacked(
        ["address", "string", "string"],
        [
          deployer.address,
          config.modelToken.modelName,
          config.modelInfo.version,
        ]
      )
    );

    console.log("   - Generated model ID:", modelId);

    // Register the model
    await modelVault.registerModel(
      modelId,
      config.modelInfo.cid,
      tokenAddress,
      config.modelInfo.pricePerInference,
      config.modelInfo.category,
      config.modelInfo.tags,
      config.modelInfo.version,
      config.modelToken.accessThreshold
    );

    console.log("   - Model registered successfully!");

    // Step 4: Output summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 MODEL DEPLOYMENT COMPLETE 🎉");
    console.log("=".repeat(60));

    console.log("\nModel Information:");
    console.log("├── Model ID:          ", modelId);
    console.log("├── Name:              ", config.modelToken.modelName);
    console.log("├── Symbol:            ", config.modelToken.symbol);
    console.log("├── Token Contract:    ", tokenAddress);
    console.log("├── IPFS CID:          ", config.modelInfo.cid);
    console.log(
      "├── Price per Inference:",
      hre.ethers.formatEther(config.modelInfo.pricePerInference),
      "ETH"
    );
    console.log(
      "├── Access Threshold:  ",
      hre.ethers.formatEther(config.modelToken.accessThreshold),
      "tokens"
    );
    console.log(
      "├── Premium Threshold: ",
      hre.ethers.formatEther(config.modelToken.premiumThreshold),
      "tokens"
    );
    console.log(
      "├── Max Supply:        ",
      hre.ethers.formatEther(config.modelToken.maxSupply),
      "tokens"
    );
    console.log("├── Mint Price:        ", "0.01 ETH");
    console.log("└── Version:           ", config.modelInfo.version);

    console.log("\nNext Steps:");
    console.log("1. Upload and encrypt your model using Lighthouse");
    console.log("2. Update the CID in the model registration if needed");
    console.log("3. Configure access conditions in Lighthouse");
    console.log("4. Set up Fluence VM for inference processing");
    console.log("5. Test the complete inference pipeline");

    // Save model deployment info
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      modelId: modelId,
      tokenContract: tokenAddress,
      modelVault: config.modelVaultAddress,
      configuration: config,
    };

    const fs = require("fs");
    const path = require("path");

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `model-${config.modelToken.modelId}-${
      hre.network.name
    }-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📝 Model deployment info saved to:", filepath);
  } catch (error) {
    console.error("\n❌ Model deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
