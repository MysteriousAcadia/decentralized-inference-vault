const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DIV Platform Integration", function () {
  let ModelVault;
  let modelVault;
  let PaymentStream;
  let paymentStream;
  let ModelAccessToken;
  let modelAccessToken;
  let owner;
  let modelOwner1;
  let modelOwner2;
  let user1;
  let user2;
  let addrs;

  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));

  beforeEach(async function () {
    [owner, modelOwner1, modelOwner2, user1, user2, ...addrs] =
      await ethers.getSigners();

    // Deploy ModelVault
    ModelVault = await ethers.getContractFactory("ModelVault");
    modelVault = await ModelVault.deploy(owner.address, owner.address);

    // Deploy PaymentStream
    PaymentStream = await ethers.getContractFactory("PaymentStream");
    paymentStream = await PaymentStream.deploy(
      await modelVault.getAddress(),
      owner.address,
      owner.address
    );

    // Set up roles
    await modelVault.grantRole(OPERATOR_ROLE, await paymentStream.getAddress());
    await paymentStream.grantRole(OPERATOR_ROLE, owner.address);
  });

  describe("Complete Model Lifecycle", function () {
    let modelId;
    let tokenAddress;

    it("Should handle complete model registration and usage flow", async function () {
      // Step 1: Deploy model access token
      ModelAccessToken = await ethers.getContractFactory("ModelAccessToken");
      modelAccessToken = await ModelAccessToken.deploy(
        "Advanced LLM Token",
        "ALLM",
        "advanced-llm-v1",
        "Advanced Language Model",
        "An advanced language model for complex tasks",
        modelOwner1.address,
        ethers.parseEther("100000"), // 100K max supply
        ethers.parseEther("5"), // 5 tokens for access
        ethers.parseEther("50") // 50 tokens for premium
      );

      tokenAddress = await modelAccessToken.getAddress();

      // Step 2: Configure token
      await modelAccessToken
        .connect(modelOwner1)
        .setMintPrice(ethers.parseEther("0.01"));
      await modelAccessToken.connect(modelOwner1).setPublicMintEnabled(true);

      // Step 3: Register model in vault
      modelId = await modelVault.generateModelId(
        modelOwner1.address,
        "Advanced Language Model",
        "v1.0"
      );

      await expect(
        modelVault.connect(modelOwner1).registerModel(
          modelId,
          "QmAdvancedLLMCID123456789",
          tokenAddress,
          ethers.parseEther("0.002"), // 0.002 ETH per inference
          0, // LANGUAGE_MODEL
          ["language", "advanced", "llm"],
          "v1.0",
          ethers.parseEther("5")
        )
      ).to.emit(modelVault, "ModelRegistered");

      // Step 4: User purchases access tokens
      const tokenPurchase = ethers.parseEther("10"); // Buy 10 tokens
      const tokenCost = ethers.parseEther("0.1"); // 10 * 0.01 ETH

      await expect(
        modelAccessToken
          .connect(user1)
          .publicMint(tokenPurchase, { value: tokenCost })
      ).to.emit(modelAccessToken, "TokensMinted");

      // Verify user has access
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.true;
      expect(await modelAccessToken.hasAccess(user1.address)).to.be.true;

      // Step 5: User deposits ETH for payments
      const depositAmount = ethers.parseEther("0.1");
      await paymentStream.connect(user1).deposit({ value: depositAmount });

      // Step 6: Process inference payment
      const inferenceId = "inference-12345";
      const inferenceCost = ethers.parseEther("0.002");

      await expect(
        paymentStream.processPayment(
          modelId,
          user1.address,
          modelOwner1.address,
          inferenceCost,
          ethers.ZeroAddress,
          inferenceId
        )
      ).to.emit(paymentStream, "PaymentProcessed");

      // Step 7: Verify final state
      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.totalInferences).to.equal(1);
      expect(await paymentStream.totalEarnings(modelOwner1.address)).to.equal(
        inferenceCost
      );
      expect(await paymentStream.getBalance(user1.address)).to.equal(
        depositAmount - inferenceCost
      );
    });
  });

  describe("Multi-Model Marketplace", function () {
    let model1Id, model2Id;
    let token1Address, token2Address;

    beforeEach(async function () {
      // Deploy two different model tokens
      const ModelAccessToken1 = await ethers.getContractFactory(
        "ModelAccessToken"
      );
      const modelToken1 = await ModelAccessToken1.deploy(
        "LLM Token",
        "LLM",
        "llm-v1",
        "Language Model",
        "A language model",
        modelOwner1.address,
        ethers.parseEther("50000"),
        ethers.parseEther("1"),
        ethers.parseEther("10")
      );
      token1Address = await modelToken1.getAddress();

      const ModelAccessToken2 = await ethers.getContractFactory(
        "ModelAccessToken"
      );
      const modelToken2 = await ModelAccessToken2.deploy(
        "IMG Token",
        "IMG",
        "image-v1",
        "Image Model",
        "An image generation model",
        modelOwner2.address,
        ethers.parseEther("25000"),
        ethers.parseEther("2"),
        ethers.parseEther("20")
      );
      token2Address = await modelToken2.getAddress();

      // Register both models
      model1Id = await modelVault.generateModelId(
        modelOwner1.address,
        "Language Model",
        "v1.0"
      );
      model2Id = await modelVault.generateModelId(
        modelOwner2.address,
        "Image Model",
        "v1.0"
      );

      await modelVault.connect(modelOwner1).registerModel(
        model1Id,
        "QmLLMCID123",
        token1Address,
        ethers.parseEther("0.001"),
        0, // LANGUAGE_MODEL
        ["language"],
        "v1.0",
        ethers.parseEther("1")
      );

      await modelVault.connect(modelOwner2).registerModel(
        model2Id,
        "QmIMGCID456",
        token2Address,
        ethers.parseEther("0.005"),
        1, // IMAGE_GENERATION
        ["image", "generation"],
        "v1.0",
        ethers.parseEther("2")
      );

      // Mint access tokens for users
      await modelToken1
        .connect(modelOwner1)
        .mint(user1.address, ethers.parseEther("5"));
      await modelToken1
        .connect(modelOwner1)
        .mint(user2.address, ethers.parseEther("15"));
      await modelToken2
        .connect(modelOwner2)
        .mint(user1.address, ethers.parseEther("3"));

      // Deposit funds
      await paymentStream
        .connect(user1)
        .deposit({ value: ethers.parseEther("0.1") });
      await paymentStream
        .connect(user2)
        .deposit({ value: ethers.parseEther("0.1") });
    });

    it("Should handle multiple models and users correctly", async function () {
      // User1 can access both models
      expect(await modelVault.hasAccess(model1Id, user1.address)).to.be.true;
      expect(await modelVault.hasAccess(model2Id, user1.address)).to.be.true;

      // User2 can only access model1 (needs more tokens for model2)
      expect(await modelVault.hasAccess(model1Id, user2.address)).to.be.true;
      expect(await modelVault.hasAccess(model2Id, user2.address)).to.be.false;

      // Process payments for different models
      await paymentStream.processPayment(
        model1Id,
        user1.address,
        modelOwner1.address,
        ethers.parseEther("0.001"),
        ethers.ZeroAddress,
        "llm-inference-1"
      );

      await paymentStream.processPayment(
        model2Id,
        user1.address,
        modelOwner2.address,
        ethers.parseEther("0.005"),
        ethers.ZeroAddress,
        "img-inference-1"
      );

      await paymentStream.processPayment(
        model1Id,
        user2.address,
        modelOwner1.address,
        ethers.parseEther("0.001"),
        ethers.ZeroAddress,
        "llm-inference-2"
      );

      // Check earnings distribution
      expect(await paymentStream.totalEarnings(modelOwner1.address)).to.equal(
        ethers.parseEther("0.002") // Two LLM inferences
      );
      expect(await paymentStream.totalEarnings(modelOwner2.address)).to.equal(
        ethers.parseEther("0.005") // One image inference
      );

      // Check platform statistics
      const stats = await modelVault.getPlatformStats();
      expect(stats[0]).to.equal(2); // totalModels
      expect(stats[2]).to.equal(3); // totalInferences
    });

    it("Should correctly categorize and query models", async function () {
      const languageModels = await modelVault.getModelsByCategory(0);
      const imageModels = await modelVault.getModelsByCategory(1);

      expect(languageModels.length).to.equal(1);
      expect(languageModels[0]).to.equal(model1Id);

      expect(imageModels.length).to.equal(1);
      expect(imageModels[0]).to.equal(model2Id);

      const allModels = await modelVault.getAllModels(0, 10);
      expect(allModels.length).to.equal(2);
    });
  });

  describe("Platform Fee Distribution", function () {
    let modelId;

    beforeEach(async function () {
      // Set up a model and user
      ModelAccessToken = await ethers.getContractFactory("ModelAccessToken");
      modelAccessToken = await ModelAccessToken.deploy(
        "Fee Test Token",
        "FTT",
        "fee-test-v1",
        "Fee Test Model",
        "Testing platform fees",
        modelOwner1.address,
        ethers.parseEther("10000"),
        ethers.parseEther("1"),
        ethers.parseEther("10")
      );

      const tokenAddress = await modelAccessToken.getAddress();
      modelId = await modelVault.generateModelId(
        modelOwner1.address,
        "Fee Test Model",
        "v1.0"
      );

      await modelVault
        .connect(modelOwner1)
        .registerModel(
          modelId,
          "QmFeeTestCID",
          tokenAddress,
          ethers.parseEther("0.01"),
          0,
          ["test"],
          "v1.0",
          ethers.parseEther("1")
        );

      await modelAccessToken
        .connect(modelOwner1)
        .mint(user1.address, ethers.parseEther("5"));
      await paymentStream
        .connect(user1)
        .deposit({ value: ethers.parseEther("1") });
    });

    it("Should correctly distribute payments with platform fee", async function () {
      // Set 5% platform fee
      await paymentStream.setPlatformFee(500); // 5%
      await modelVault.setPlatformFee(500); // 5%

      const paymentAmount = ethers.parseEther("0.1");
      const expectedFee = (paymentAmount * 500n) / 10000n; // 5%
      const expectedNetAmount = paymentAmount - expectedFee;

      const initialFeeRecipientBalance = await ethers.provider.getBalance(
        owner.address
      );
      const initialModelOwnerBalance = await ethers.provider.getBalance(
        modelOwner1.address
      );

      await paymentStream.processPayment(
        modelId,
        user1.address,
        modelOwner1.address,
        paymentAmount,
        ethers.ZeroAddress,
        "fee-test"
      );

      // Model owner should receive net amount
      expect(await paymentStream.totalEarnings(modelOwner1.address)).to.equal(
        expectedNetAmount
      );

      // Platform should track the fee
      expect(await paymentStream.totalVolume()).to.equal(paymentAmount);
    });

    it("Should handle zero platform fee (commission-free)", async function () {
      // Keep platform fee at 0%
      expect(await paymentStream.platformFeePercentage()).to.equal(0);

      const paymentAmount = ethers.parseEther("0.1");

      await paymentStream.processPayment(
        modelId,
        user1.address,
        modelOwner1.address,
        paymentAmount,
        ethers.ZeroAddress,
        "commission-free-test"
      );

      // Model owner should receive full amount
      expect(await paymentStream.totalEarnings(modelOwner1.address)).to.equal(
        paymentAmount
      );
    });
  });

  describe("Access Control Integration", function () {
    let modelId;
    let tokenAddress;

    beforeEach(async function () {
      ModelAccessToken = await ethers.getContractFactory("ModelAccessToken");
      modelAccessToken = await ModelAccessToken.deploy(
        "Access Test Token",
        "ATT",
        "access-test-v1",
        "Access Test Model",
        "Testing access control",
        modelOwner1.address,
        ethers.parseEther("1000"),
        ethers.parseEther("5"), // Higher threshold
        ethers.parseEther("50")
      );

      tokenAddress = await modelAccessToken.getAddress();
      modelId = await modelVault.generateModelId(
        modelOwner1.address,
        "Access Test Model",
        "v1.0"
      );

      await modelVault.connect(modelOwner1).registerModel(
        modelId,
        "QmAccessTestCID",
        tokenAddress,
        ethers.parseEther("0.001"),
        0,
        ["access", "test"],
        "v1.0",
        ethers.parseEther("5") // Same threshold as token
      );

      await paymentStream
        .connect(user1)
        .deposit({ value: ethers.parseEther("0.1") });
      await paymentStream
        .connect(user2)
        .deposit({ value: ethers.parseEther("0.1") });
    });

    it("Should enforce access control through token ownership", async function () {
      // User1 has no tokens, should not have access
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.false;

      // Give user1 insufficient tokens
      await modelAccessToken
        .connect(modelOwner1)
        .mint(user1.address, ethers.parseEther("3"));
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.false;

      // Give user1 sufficient tokens
      await modelAccessToken
        .connect(modelOwner1)
        .mint(user1.address, ethers.parseEther("3")); // Total: 6
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.true;

      // Payment should fail for user without access
      // Note: This would typically be checked by the frontend/middleware before calling processPayment
      // The contracts themselves don't prevent payment if the user pays, but access checking is separate
    });

    it("Should allow dynamic threshold changes", async function () {
      // Give user1 some tokens
      await modelAccessToken
        .connect(modelOwner1)
        .mint(user1.address, ethers.parseEther("3"));
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.false;

      // Lower the access threshold
      await modelAccessToken
        .connect(modelOwner1)
        .setAccessThreshold(ethers.parseEther("3"));
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.true;

      // Raise it again
      await modelAccessToken
        .connect(modelOwner1)
        .setAccessThreshold(ethers.parseEther("5"));
      expect(await modelVault.hasAccess(modelId, user1.address)).to.be.false;
    });
  });
});
