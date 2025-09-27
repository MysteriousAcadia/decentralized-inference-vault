const hre = require("hardhat");

async function main() {
  console.log("Starting DIV Platform deployment...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "ETH\n"
  );

  // Deployment configuration
  const config = {
    // Platform admin (can be changed after deployment)
    admin: deployer.address,

    // Fee recipient for platform fees
    feeRecipient: deployer.address,

    // Model Access Token parameters (example model)
    modelToken: {
      name: "DIV Demo Model Token",
      symbol: "DMT",
      modelId: "demo-model-v1",
      modelName: "Demo Language Model",
      modelDescription: "A demonstration language model for the DIV platform",
      maxSupply: hre.ethers.parseEther("1000000"), // 1M tokens
      accessThreshold: hre.ethers.parseEther("1"), // 1 token for basic access
      premiumThreshold: hre.ethers.parseEther("100"), // 100 tokens for premium access
    },
  };

  try {
    // Step 1: Deploy ModelVault
    console.log("1. Deploying ModelVault...");
    const ModelVault = await hre.ethers.getContractFactory("ModelVault");
    const modelVault = await ModelVault.deploy(
      config.admin,
      config.feeRecipient
    );
    await modelVault.waitForDeployment();
    const modelVaultAddress = await modelVault.getAddress();
    console.log("ModelVault deployed to:", modelVaultAddress);

    // Step 2: Deploy PaymentStream
    console.log("\n2. Deploying PaymentStream...");
    const PaymentStream = await hre.ethers.getContractFactory("PaymentStream");
    const paymentStream = await PaymentStream.deploy(
      modelVaultAddress,
      config.admin,
      config.feeRecipient
    );
    await paymentStream.waitForDeployment();
    const paymentStreamAddress = await paymentStream.getAddress();
    console.log("PaymentStream deployed to:", paymentStreamAddress);

    // Step 3: Deploy ModelAccessToken (example model)
    console.log("\n3. Deploying ModelAccessToken (Demo Model)...");
    const ModelAccessToken = await hre.ethers.getContractFactory(
      "ModelAccessToken"
    );
    const modelAccessToken = await ModelAccessToken.deploy(
      config.modelToken.name,
      config.modelToken.symbol,
      config.modelToken.modelId,
      config.modelToken.modelName,
      config.modelToken.modelDescription,
      config.admin, // Model owner
      config.modelToken.maxSupply,
      config.modelToken.accessThreshold,
      config.modelToken.premiumThreshold
    );
    await modelAccessToken.waitForDeployment();
    const modelAccessTokenAddress = await modelAccessToken.getAddress();
    console.log("ModelAccessToken deployed to:", modelAccessTokenAddress);

    // Step 4: Configure contracts
    console.log("\n4. Configuring contracts...");

    // Grant OPERATOR_ROLE to PaymentStream in ModelVault
    console.log(
      "   - Granting OPERATOR_ROLE to PaymentStream in ModelVault..."
    );
    const OPERATOR_ROLE = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes("OPERATOR_ROLE")
    );
    await modelVault.grantRole(OPERATOR_ROLE, paymentStreamAddress);

    // Grant OPERATOR_ROLE to PaymentStream contract
    console.log("   - Granting OPERATOR_ROLE to deployer in PaymentStream...");
    await paymentStream.grantRole(OPERATOR_ROLE, deployer.address);

    // Enable public minting for the demo token
    console.log("   - Enabling public minting for demo token...");
    await modelAccessToken.setPublicMintEnabled(true);

    // Step 5: Register demo model in ModelVault
    console.log("\n5. Registering demo model in ModelVault...");
    const modelId = hre.ethers.keccak256(
      hre.ethers.solidityPacked(
        ["address", "string", "string"],
        [config.admin, config.modelToken.modelName, "v1.0"]
      )
    );

    await modelVault.registerModel(
      modelId,
      "QmExampleCIDForDemoModel123456789", // Example IPFS CID
      modelAccessTokenAddress,
      hre.ethers.parseEther("0.001"), // 0.001 ETH per inference
      0, // LANGUAGE_MODEL category
      ["language", "demo", "example"], // Tags
      "v1.0", // Version
      config.modelToken.accessThreshold // Min token balance
    );

    console.log("Demo model registered with ID:", modelId);

    // Step 6: Output deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DIV PLATFORM DEPLOYMENT COMPLETE 🎉");
    console.log("=".repeat(60));
    console.log("\nDeployed Contracts:");
    console.log("├── ModelVault:        ", modelVaultAddress);
    console.log("├── PaymentStream:     ", paymentStreamAddress);
    console.log("└── ModelAccessToken:  ", modelAccessTokenAddress);

    console.log("\nDemo Model Information:");
    console.log("├── Model ID:          ", modelId);
    console.log("├── Name:              ", config.modelToken.modelName);
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
    console.log("└── Price per Inference:", "0.001 ETH");

    console.log("\nConfiguration:");
    console.log("├── Platform Admin:    ", config.admin);
    console.log("├── Fee Recipient:     ", config.feeRecipient);
    console.log("├── Public Minting:    ", "Enabled");
    console.log("└── Token Mint Price:  ", "0.001 ETH");

    console.log("\nNext Steps:");
    console.log("1. Verify contracts on Etherscan (if on public network)");
    console.log("2. Set up frontend application with contract addresses");
    console.log("3. Configure Lighthouse integration for model encryption");
    console.log("4. Set up Fluence VM instances for inference processing");
    console.log("5. Integrate Synapse SDK for cross-chain payments");

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: {
        ModelVault: modelVaultAddress,
        PaymentStream: paymentStreamAddress,
        ModelAccessToken: modelAccessTokenAddress,
      },
      demoModel: {
        modelId: modelId,
        name: config.modelToken.modelName,
        tokenContract: modelAccessTokenAddress,
      },
      configuration: config,
    };

    const fs = require("fs");
    const path = require("path");

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📝 Deployment info saved to:", filepath);
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
