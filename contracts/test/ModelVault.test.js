const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ModelVault", function () {
  let ModelVault;
  let modelVault;
  let ModelAccessToken;
  let modelAccessToken;
  let owner;
  let modelOwner;
  let addr1;
  let addr2;
  let addrs;

  const MODEL_NAME = "Test AI Model";
  const MODEL_DESCRIPTION = "A test AI model";
  const MAX_SUPPLY = ethers.parseEther("1000000");
  const ACCESS_THRESHOLD = ethers.parseEther("1");
  const PREMIUM_THRESHOLD = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, modelOwner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy ModelVault
    ModelVault = await ethers.getContractFactory("ModelVault");
    modelVault = await ModelVault.deploy(owner.address, owner.address);

    // Deploy a test ModelAccessToken
    ModelAccessToken = await ethers.getContractFactory("ModelAccessToken");
    modelAccessToken = await ModelAccessToken.deploy(
      "Test Model Token",
      "TMT",
      "test-model-v1",
      MODEL_NAME,
      MODEL_DESCRIPTION,
      modelOwner.address,
      MAX_SUPPLY,
      ACCESS_THRESHOLD,
      PREMIUM_THRESHOLD
    );
  });

  describe("Deployment", function () {
    it("Should set the correct initial state", async function () {
      expect(await modelVault.totalModels()).to.equal(0);
      expect(await modelVault.totalActiveModels()).to.equal(0);
      expect(await modelVault.totalInferences()).to.equal(0);
      expect(await modelVault.platformFeePercentage()).to.equal(0);
      expect(await modelVault.feeRecipient()).to.equal(owner.address);
    });

    it("Should grant correct roles to admin", async function () {
      const DEFAULT_ADMIN_ROLE =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));

      expect(await modelVault.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be
        .true;
      expect(await modelVault.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Model Registration", function () {
    let modelId;
    const cid = "QmTestCID123456789";
    const pricePerInference = ethers.parseEther("0.001");
    const tags = ["test", "demo"];
    const version = "v1.0";

    beforeEach(async function () {
      modelId = await modelVault.generateModelId(
        modelOwner.address,
        MODEL_NAME,
        version
      );
    });

    it("Should register a new model successfully", async function () {
      const tokenAddress = await modelAccessToken.getAddress();

      await expect(
        modelVault.connect(modelOwner).registerModel(
          modelId,
          cid,
          tokenAddress,
          pricePerInference,
          0, // LANGUAGE_MODEL
          tags,
          version,
          ACCESS_THRESHOLD
        )
      )
        .to.emit(modelVault, "ModelRegistered")
        .withArgs(
          modelId,
          modelOwner.address,
          tokenAddress,
          cid,
          pricePerInference
        );

      // Check model was stored correctly
      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.cid).to.equal(cid);
      expect(modelInfo.tokenContract).to.equal(tokenAddress);
      expect(modelInfo.pricePerInference).to.equal(pricePerInference);
      expect(modelInfo.owner).to.equal(modelOwner.address);
      expect(modelInfo.active).to.be.true;
      expect(modelInfo.totalInferences).to.equal(0);

      // Check counters updated
      expect(await modelVault.totalModels()).to.equal(1);
      expect(await modelVault.totalActiveModels()).to.equal(1);
    });

    it("Should not allow duplicate model registration", async function () {
      const tokenAddress = await modelAccessToken.getAddress();

      // Register once
      await modelVault
        .connect(modelOwner)
        .registerModel(
          modelId,
          cid,
          tokenAddress,
          pricePerInference,
          0,
          tags,
          version,
          ACCESS_THRESHOLD
        );

      // Try to register again
      await expect(
        modelVault
          .connect(modelOwner)
          .registerModel(
            modelId,
            cid,
            tokenAddress,
            pricePerInference,
            0,
            tags,
            version,
            ACCESS_THRESHOLD
          )
      ).to.be.revertedWith("Model already exists");
    });

    it("Should not allow registration with invalid parameters", async function () {
      const tokenAddress = await modelAccessToken.getAddress();

      // Invalid model ID
      await expect(
        modelVault
          .connect(modelOwner)
          .registerModel(
            ethers.ZeroHash,
            cid,
            tokenAddress,
            pricePerInference,
            0,
            tags,
            version,
            ACCESS_THRESHOLD
          )
      ).to.be.revertedWith("Invalid model ID");

      // Invalid CID
      await expect(
        modelVault
          .connect(modelOwner)
          .registerModel(
            modelId,
            "",
            tokenAddress,
            pricePerInference,
            0,
            tags,
            version,
            ACCESS_THRESHOLD
          )
      ).to.be.revertedWith("Invalid CID");

      // Invalid token contract
      await expect(
        modelVault
          .connect(modelOwner)
          .registerModel(
            modelId,
            cid,
            ethers.ZeroAddress,
            pricePerInference,
            0,
            tags,
            version,
            ACCESS_THRESHOLD
          )
      ).to.be.revertedWith("Invalid token contract");
    });

    it("Should not allow unauthorized registration", async function () {
      const tokenAddress = await modelAccessToken.getAddress();

      await expect(
        modelVault
          .connect(addr1)
          .registerModel(
            modelId,
            cid,
            tokenAddress,
            pricePerInference,
            0,
            tags,
            version,
            ACCESS_THRESHOLD
          )
      ).to.be.revertedWith("Not authorized to register this model");
    });
  });

  describe("Model Management", function () {
    let modelId;
    const cid = "QmTestCID123456789";
    const pricePerInference = ethers.parseEther("0.001");
    const tags = ["test", "demo"];
    const version = "v1.0";

    beforeEach(async function () {
      modelId = await modelVault.generateModelId(
        modelOwner.address,
        MODEL_NAME,
        version
      );

      const tokenAddress = await modelAccessToken.getAddress();
      await modelVault
        .connect(modelOwner)
        .registerModel(
          modelId,
          cid,
          tokenAddress,
          pricePerInference,
          0,
          tags,
          version,
          ACCESS_THRESHOLD
        );
    });

    it("Should allow model owner to update price", async function () {
      const newPrice = ethers.parseEther("0.002");

      await expect(
        modelVault.connect(modelOwner).updatePrice(modelId, newPrice)
      )
        .to.emit(modelVault, "PriceUpdated")
        .withArgs(modelId, pricePerInference, newPrice);

      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.pricePerInference).to.equal(newPrice);
    });

    it("Should allow model owner to deactivate model", async function () {
      await expect(modelVault.connect(modelOwner).deactivateModel(modelId))
        .to.emit(modelVault, "ModelDeactivated")
        .withArgs(modelId, modelOwner.address);

      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.active).to.be.false;
      expect(await modelVault.totalActiveModels()).to.equal(0);
    });

    it("Should allow model owner to reactivate model", async function () {
      // First deactivate
      await modelVault.connect(modelOwner).deactivateModel(modelId);

      // Then reactivate
      await expect(modelVault.connect(modelOwner).reactivateModel(modelId))
        .to.emit(modelVault, "ModelReactivated")
        .withArgs(modelId, modelOwner.address);

      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.active).to.be.true;
      expect(await modelVault.totalActiveModels()).to.equal(1);
    });

    it("Should allow model owner to update metadata", async function () {
      const newCid = "QmNewCID987654321";
      const newTags = ["updated", "test"];
      const newVersion = "v2.0";

      await modelVault
        .connect(modelOwner)
        .updateModelMetadata(modelId, newCid, newTags, newVersion);

      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.cid).to.equal(newCid);
      expect(modelInfo.version).to.equal(newVersion);
    });

    it("Should not allow non-owner to modify model", async function () {
      const newPrice = ethers.parseEther("0.002");

      await expect(
        modelVault.connect(addr1).updatePrice(modelId, newPrice)
      ).to.be.revertedWith("Not model owner or admin");

      await expect(
        modelVault.connect(addr1).deactivateModel(modelId)
      ).to.be.revertedWith("Not model owner or admin");
    });
  });

  describe("Access Control", function () {
    let modelId;
    const tokenAddress = async () => await modelAccessToken.getAddress();

    beforeEach(async function () {
      modelId = await modelVault.generateModelId(
        modelOwner.address,
        MODEL_NAME,
        "v1.0"
      );

      await modelVault
        .connect(modelOwner)
        .registerModel(
          modelId,
          "QmTestCID123456789",
          await tokenAddress(),
          ethers.parseEther("0.001"),
          0,
          ["test"],
          "v1.0",
          ACCESS_THRESHOLD
        );

      // Mint tokens for access testing
      await modelAccessToken
        .connect(modelOwner)
        .mint(addr1.address, ethers.parseEther("5"));
    });

    it("Should correctly check user access", async function () {
      expect(await modelVault.hasAccess(modelId, addr1.address)).to.be.true;
      expect(await modelVault.hasAccess(modelId, addr2.address)).to.be.false;
    });
  });

  describe("Platform Settings", function () {
    it("Should allow admin to set platform fee", async function () {
      const newFee = 250; // 2.5%

      await expect(modelVault.setPlatformFee(newFee))
        .to.emit(modelVault, "PlatformFeeUpdated")
        .withArgs(0, newFee);

      expect(await modelVault.platformFeePercentage()).to.equal(newFee);
    });

    it("Should not allow excessive platform fee", async function () {
      await expect(
        modelVault.setPlatformFee(1001) // > 10%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow admin to set minimum price", async function () {
      const newMinPrice = ethers.parseEther("0.01");
      await modelVault.setMinPricePerInference(newMinPrice);
      expect(await modelVault.minPricePerInference()).to.equal(newMinPrice);
    });

    it("Should not allow non-admin to change settings", async function () {
      await expect(modelVault.connect(addr1).setPlatformFee(100)).to.be
        .reverted;

      await expect(
        modelVault
          .connect(addr1)
          .setMinPricePerInference(ethers.parseEther("0.01"))
      ).to.be.reverted;
    });
  });

  describe("Statistics and Queries", function () {
    let modelId1, modelId2;

    beforeEach(async function () {
      const tokenAddress = await modelAccessToken.getAddress();

      modelId1 = await modelVault.generateModelId(
        modelOwner.address,
        "Model1",
        "v1.0"
      );
      modelId2 = await modelVault.generateModelId(
        modelOwner.address,
        "Model2",
        "v1.0"
      );

      await modelVault.connect(modelOwner).registerModel(
        modelId1,
        "QmCID1",
        tokenAddress,
        ethers.parseEther("0.001"),
        0, // LANGUAGE_MODEL
        ["test"],
        "v1.0",
        ACCESS_THRESHOLD
      );

      await modelVault.connect(modelOwner).registerModel(
        modelId2,
        "QmCID2",
        tokenAddress,
        ethers.parseEther("0.002"),
        1, // IMAGE_GENERATION
        ["image"],
        "v1.0",
        ACCESS_THRESHOLD
      );
    });

    it("Should return correct platform statistics", async function () {
      const stats = await modelVault.getPlatformStats();
      expect(stats[0]).to.equal(2); // totalModels
      expect(stats[1]).to.equal(2); // totalActiveModels
      expect(stats[2]).to.equal(0); // totalInferences
      expect(stats[3]).to.equal(0); // platformFeePercentage
    });

    it("Should return models by owner", async function () {
      const ownerModels = await modelVault.getModelsByOwner(modelOwner.address);
      expect(ownerModels.length).to.equal(2);
      expect(ownerModels).to.include(modelId1);
      expect(ownerModels).to.include(modelId2);
    });

    it("Should return models by category", async function () {
      const languageModels = await modelVault.getModelsByCategory(0);
      const imageModels = await modelVault.getModelsByCategory(1);

      expect(languageModels.length).to.equal(1);
      expect(languageModels[0]).to.equal(modelId1);

      expect(imageModels.length).to.equal(1);
      expect(imageModels[0]).to.equal(modelId2);
    });

    it("Should return all models with pagination", async function () {
      const allModels = await modelVault.getAllModels(0, 10);
      expect(allModels.length).to.equal(2);

      const firstModel = await modelVault.getAllModels(0, 1);
      expect(firstModel.length).to.equal(1);
    });
  });

  describe("Inference Recording", function () {
    let modelId;
    const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));

    beforeEach(async function () {
      modelId = await modelVault.generateModelId(
        modelOwner.address,
        MODEL_NAME,
        "v1.0"
      );
      const tokenAddress = await modelAccessToken.getAddress();

      await modelVault
        .connect(modelOwner)
        .registerModel(
          modelId,
          "QmTestCID123456789",
          tokenAddress,
          ethers.parseEther("0.001"),
          0,
          ["test"],
          "v1.0",
          ACCESS_THRESHOLD
        );

      // Grant operator role to owner for testing
      await modelVault.grantRole(OPERATOR_ROLE, owner.address);
    });

    it("Should allow operator to record inference", async function () {
      const cost = ethers.parseEther("0.001");

      await expect(modelVault.recordInference(modelId, addr1.address, cost))
        .to.emit(modelVault, "InferenceRecorded")
        .withArgs(
          modelId,
          addr1.address,
          cost,
          (await ethers.provider.getBlockNumber()) + 1
        );

      const modelInfo = await modelVault.getModelInfo(modelId);
      expect(modelInfo.totalInferences).to.equal(1);
      expect(await modelVault.totalInferences()).to.equal(1);
    });

    it("Should not allow non-operator to record inference", async function () {
      await expect(
        modelVault
          .connect(addr1)
          .recordInference(modelId, addr1.address, ethers.parseEther("0.001"))
      ).to.be.reverted;
    });

    it("Should not record inference for inactive model", async function () {
      await modelVault.connect(modelOwner).deactivateModel(modelId);

      await expect(
        modelVault.recordInference(
          modelId,
          addr1.address,
          ethers.parseEther("0.001")
        )
      ).to.be.revertedWith("Model is not active");
    });
  });
});
