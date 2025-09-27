const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentStream", function () {
  let PaymentStream;
  let paymentStream;
  let ModelVault;
  let modelVault;
  let ModelAccessToken;
  let modelAccessToken;
  let MockERC20;
  let mockToken;
  let owner;
  let modelOwner;
  let user1;
  let user2;
  let addrs;

  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));

  beforeEach(async function () {
    [owner, modelOwner, user1, user2, ...addrs] = await ethers.getSigners();

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

    // Deploy test ModelAccessToken
    ModelAccessToken = await ethers.getContractFactory("ModelAccessToken");
    modelAccessToken = await ModelAccessToken.deploy(
      "Test Model Token",
      "TMT",
      "test-model-v1",
      "Test AI Model",
      "Test description",
      modelOwner.address,
      ethers.parseEther("1000000"),
      ethers.parseEther("1"),
      ethers.parseEther("100")
    );

    // Deploy mock ERC20 token
    MockERC20 = await ethers.getContractFactory("ModelAccessToken"); // Reuse for simplicity
    mockToken = await MockERC20.deploy(
      "Mock USDC",
      "USDC",
      "mock-usdc",
      "Mock USDC Token",
      "Mock USDC for testing",
      owner.address,
      ethers.parseUnits("1000000", 6), // 1M USDC with 6 decimals
      ethers.parseUnits("1", 6),
      ethers.parseUnits("100", 6)
    );

    // Set up roles
    await modelVault.grantRole(OPERATOR_ROLE, await paymentStream.getAddress());
    await paymentStream.grantRole(OPERATOR_ROLE, owner.address);

    // Register test model
    const modelId = await modelVault.generateModelId(
      modelOwner.address,
      "Test AI Model",
      "v1.0"
    );

    await modelVault
      .connect(modelOwner)
      .registerModel(
        modelId,
        "QmTestCID123456789",
        await modelAccessToken.getAddress(),
        ethers.parseEther("0.001"),
        0,
        ["test"],
        "v1.0",
        ethers.parseEther("1")
      );

    // Mint tokens for access
    await modelAccessToken
      .connect(modelOwner)
      .mint(user1.address, ethers.parseEther("10"));

    // Mint mock USDC
    await mockToken.mint(user1.address, ethers.parseUnits("1000", 6));
    await mockToken.mint(user2.address, ethers.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set correct initial state", async function () {
      expect(await paymentStream.modelVault()).to.equal(
        await modelVault.getAddress()
      );
      expect(await paymentStream.feeRecipient()).to.equal(owner.address);
      expect(await paymentStream.platformFeePercentage()).to.equal(0);
      expect(await paymentStream.totalPayments()).to.equal(0);
      expect(await paymentStream.totalVolume()).to.equal(0);
    });

    it("Should have ETH as default supported token", async function () {
      const ethToken = await paymentStream.supportedTokens(ethers.ZeroAddress);
      expect(ethToken.active).to.be.true;
      expect(ethToken.symbol).to.equal("ETH");
      expect(ethToken.decimals).to.equal(18);
    });
  });

  describe("Deposits and Withdrawals", function () {
    describe("ETH Operations", function () {
      it("Should allow ETH deposits", async function () {
        const depositAmount = ethers.parseEther("1");

        await expect(
          paymentStream.connect(user1).deposit({ value: depositAmount })
        )
          .to.emit(paymentStream, "Deposit")
          .withArgs(user1.address, depositAmount, ethers.ZeroAddress);

        expect(await paymentStream.getBalance(user1.address)).to.equal(
          depositAmount
        );
      });

      it("Should allow ETH deposits via receive function", async function () {
        const depositAmount = ethers.parseEther("0.5");

        await expect(
          user1.sendTransaction({
            to: await paymentStream.getAddress(),
            value: depositAmount,
          })
        )
          .to.emit(paymentStream, "Deposit")
          .withArgs(user1.address, depositAmount, ethers.ZeroAddress);

        expect(await paymentStream.getBalance(user1.address)).to.equal(
          depositAmount
        );
      });

      it("Should allow ETH withdrawals", async function () {
        const depositAmount = ethers.parseEther("1");
        const withdrawAmount = ethers.parseEther("0.5");

        // Deposit first
        await paymentStream.connect(user1).deposit({ value: depositAmount });

        const initialBalance = await ethers.provider.getBalance(user1.address);

        await expect(paymentStream.connect(user1).withdraw(withdrawAmount))
          .to.emit(paymentStream, "Withdrawal")
          .withArgs(user1.address, withdrawAmount, ethers.ZeroAddress);

        expect(await paymentStream.getBalance(user1.address)).to.equal(
          depositAmount - withdrawAmount
        );
      });

      it("Should not allow withdrawal of more than balance", async function () {
        const depositAmount = ethers.parseEther("1");
        const excessiveAmount = ethers.parseEther("2");

        await paymentStream.connect(user1).deposit({ value: depositAmount });

        await expect(
          paymentStream.connect(user1).withdraw(excessiveAmount)
        ).to.be.revertedWith("Insufficient balance");
      });
    });

    describe("ERC20 Operations", function () {
      beforeEach(async function () {
        // Add mock token as supported
        await paymentStream.addSupportedToken(
          await mockToken.getAddress(),
          "USDC",
          6,
          ethers.parseUnits("1", 6), // 1 USDC min
          ethers.parseUnits("10000", 6) // 10K USDC max
        );

        // Approve PaymentStream to spend user tokens
        await mockToken
          .connect(user1)
          .approve(
            await paymentStream.getAddress(),
            ethers.parseUnits("1000", 6)
          );
      });

      it("Should allow ERC20 deposits", async function () {
        const depositAmount = ethers.parseUnits("100", 6);
        const tokenAddress = await mockToken.getAddress();

        await expect(
          paymentStream.connect(user1).depositToken(tokenAddress, depositAmount)
        )
          .to.emit(paymentStream, "Deposit")
          .withArgs(user1.address, depositAmount, tokenAddress);

        expect(
          await paymentStream.getTokenBalance(user1.address, tokenAddress)
        ).to.equal(depositAmount);
      });

      it("Should allow ERC20 withdrawals", async function () {
        const depositAmount = ethers.parseUnits("100", 6);
        const withdrawAmount = ethers.parseUnits("50", 6);
        const tokenAddress = await mockToken.getAddress();

        // Deposit first
        await paymentStream
          .connect(user1)
          .depositToken(tokenAddress, depositAmount);

        await expect(
          paymentStream
            .connect(user1)
            .withdrawToken(tokenAddress, withdrawAmount)
        )
          .to.emit(paymentStream, "Withdrawal")
          .withArgs(user1.address, withdrawAmount, tokenAddress);

        expect(
          await paymentStream.getTokenBalance(user1.address, tokenAddress)
        ).to.equal(depositAmount - withdrawAmount);
      });

      it("Should not allow deposits of unsupported tokens", async function () {
        const unsupportedToken = await MockERC20.deploy(
          "Unsupported",
          "UNS",
          "unsupported",
          "Unsupported Token",
          "Not supported",
          owner.address,
          ethers.parseEther("1000"),
          1,
          100
        );

        await expect(
          paymentStream
            .connect(user1)
            .depositToken(
              await unsupportedToken.getAddress(),
              ethers.parseEther("10")
            )
        ).to.be.revertedWith("Token not supported");
      });
    });
  });

  describe("Payment Processing", function () {
    let modelId;

    beforeEach(async function () {
      modelId = await modelVault.generateModelId(
        modelOwner.address,
        "Test AI Model",
        "v1.0"
      );

      // Deposit ETH for user1
      await paymentStream
        .connect(user1)
        .deposit({ value: ethers.parseEther("1") });
    });

    it("Should process ETH payments successfully", async function () {
      const paymentAmount = ethers.parseEther("0.001");
      const inferenceId = "test-inference-1";

      const initialModelOwnerBalance = await ethers.provider.getBalance(
        modelOwner.address
      );

      const paymentId = await paymentStream.processPayment.staticCall(
        modelId,
        user1.address,
        modelOwner.address,
        paymentAmount,
        ethers.ZeroAddress,
        inferenceId
      );

      await expect(
        paymentStream.processPayment(
          modelId,
          user1.address,
          modelOwner.address,
          paymentAmount,
          ethers.ZeroAddress,
          inferenceId
        )
      )
        .to.emit(paymentStream, "PaymentProcessed")
        .withArgs(
          paymentId,
          modelId,
          user1.address,
          modelOwner.address,
          paymentAmount,
          ethers.ZeroAddress,
          inferenceId
        );

      // Check balances updated
      expect(await paymentStream.getBalance(user1.address)).to.equal(
        ethers.parseEther("1") - paymentAmount
      );

      expect(await paymentStream.totalEarnings(modelOwner.address)).to.equal(
        paymentAmount
      );
      expect(await paymentStream.totalPayments()).to.equal(1);
      expect(await paymentStream.totalVolume()).to.equal(paymentAmount);
    });

    it("Should process ERC20 payments successfully", async function () {
      // Set up ERC20 payment
      const tokenAddress = await mockToken.getAddress();
      await paymentStream.addSupportedToken(
        tokenAddress,
        "USDC",
        6,
        ethers.parseUnits("1", 6),
        ethers.parseUnits("10000", 6)
      );

      // Deposit tokens
      await mockToken
        .connect(user1)
        .approve(await paymentStream.getAddress(), ethers.parseUnits("100", 6));
      await paymentStream
        .connect(user1)
        .depositToken(tokenAddress, ethers.parseUnits("100", 6));

      const paymentAmount = ethers.parseUnits("10", 6); // 10 USDC
      const inferenceId = "test-inference-2";

      const paymentId = await paymentStream.processPayment.staticCall(
        modelId,
        user1.address,
        modelOwner.address,
        paymentAmount,
        tokenAddress,
        inferenceId
      );

      await expect(
        paymentStream.processPayment(
          modelId,
          user1.address,
          modelOwner.address,
          paymentAmount,
          tokenAddress,
          inferenceId
        )
      ).to.emit(paymentStream, "PaymentProcessed");

      expect(
        await paymentStream.getTokenBalance(user1.address, tokenAddress)
      ).to.equal(ethers.parseUnits("90", 6));
      expect(
        await paymentStream.tokenEarnings(modelOwner.address, tokenAddress)
      ).to.equal(paymentAmount);
    });

    it("Should handle platform fees correctly", async function () {
      // Set 5% platform fee
      await paymentStream.setPlatformFee(500);

      const paymentAmount = ethers.parseEther("0.1");
      const expectedFee = (paymentAmount * 500n) / 10000n; // 5%
      const expectedNetAmount = paymentAmount - expectedFee;

      const initialFeeRecipientBalance = await ethers.provider.getBalance(
        owner.address
      );

      await paymentStream.processPayment(
        modelId,
        user1.address,
        modelOwner.address,
        paymentAmount,
        ethers.ZeroAddress,
        "test-inference-fee"
      );

      expect(await paymentStream.totalEarnings(modelOwner.address)).to.equal(
        expectedNetAmount
      );
    });

    it("Should not allow payment with insufficient balance", async function () {
      const excessiveAmount = ethers.parseEther("2"); // More than user1's balance

      await expect(
        paymentStream.processPayment(
          modelId,
          user1.address,
          modelOwner.address,
          excessiveAmount,
          ethers.ZeroAddress,
          "test-inference-fail"
        )
      ).to.be.revertedWith("Insufficient ETH balance");
    });

    it("Should not allow payment for inactive model", async function () {
      // Deactivate the model
      await modelVault.connect(modelOwner).deactivateModel(modelId);

      await expect(
        paymentStream.processPayment(
          modelId,
          user1.address,
          modelOwner.address,
          ethers.parseEther("0.001"),
          ethers.ZeroAddress,
          "test-inference-inactive"
        )
      ).to.be.revertedWith("Model is not active");
    });

    it("Should not allow non-operator to process payments", async function () {
      await expect(
        paymentStream
          .connect(user1)
          .processPayment(
            modelId,
            user1.address,
            modelOwner.address,
            ethers.parseEther("0.001"),
            ethers.ZeroAddress,
            "unauthorized"
          )
      ).to.be.reverted;
    });
  });

  describe("Token Management", function () {
    it("Should allow admin to add supported tokens", async function () {
      const tokenAddress = await mockToken.getAddress();

      await expect(
        paymentStream.addSupportedToken(
          tokenAddress,
          "USDC",
          6,
          ethers.parseUnits("1", 6),
          ethers.parseUnits("10000", 6)
        )
      )
        .to.emit(paymentStream, "TokenAdded")
        .withArgs(tokenAddress, "USDC", 6);

      const tokenInfo = await paymentStream.supportedTokens(tokenAddress);
      expect(tokenInfo.active).to.be.true;
      expect(tokenInfo.symbol).to.equal("USDC");
      expect(tokenInfo.decimals).to.equal(6);
    });

    it("Should allow admin to remove supported tokens", async function () {
      const tokenAddress = await mockToken.getAddress();

      // Add first
      await paymentStream.addSupportedToken(
        tokenAddress,
        "USDC",
        6,
        ethers.parseUnits("1", 6),
        ethers.parseUnits("10000", 6)
      );

      // Then remove
      await expect(paymentStream.removeSupportedToken(tokenAddress))
        .to.emit(paymentStream, "TokenRemoved")
        .withArgs(tokenAddress);

      const tokenInfo = await paymentStream.supportedTokens(tokenAddress);
      expect(tokenInfo.active).to.be.false;
    });

    it("Should not allow adding duplicate tokens", async function () {
      const tokenAddress = await mockToken.getAddress();

      await paymentStream.addSupportedToken(
        tokenAddress,
        "USDC",
        6,
        ethers.parseUnits("1", 6),
        ethers.parseUnits("10000", 6)
      );

      await expect(
        paymentStream.addSupportedToken(
          tokenAddress,
          "USDC2",
          6,
          ethers.parseUnits("1", 6),
          ethers.parseUnits("10000", 6)
        )
      ).to.be.revertedWith("Token already supported");
    });

    it("Should not allow non-admin to manage tokens", async function () {
      const tokenAddress = await mockToken.getAddress();

      await expect(
        paymentStream
          .connect(user1)
          .addSupportedToken(
            tokenAddress,
            "USDC",
            6,
            ethers.parseUnits("1", 6),
            ethers.parseUnits("10000", 6)
          )
      ).to.be.reverted;
    });
  });

  describe("Platform Settings", function () {
    it("Should allow admin to set platform fee", async function () {
      const newFee = 250; // 2.5%
      await paymentStream.setPlatformFee(newFee);
      expect(await paymentStream.platformFeePercentage()).to.equal(newFee);
    });

    it("Should not allow excessive platform fee", async function () {
      await expect(
        paymentStream.setPlatformFee(1001) // > 10%
      ).to.be.revertedWith("Fee too high");
    });

    it("Should allow admin to change fee recipient", async function () {
      await paymentStream.setFeeRecipient(user2.address);
      expect(await paymentStream.feeRecipient()).to.equal(user2.address);
    });
  });

  describe("Statistics and Queries", function () {
    let modelId;

    beforeEach(async function () {
      modelId = await modelVault.generateModelId(
        modelOwner.address,
        "Test AI Model",
        "v1.0"
      );

      // Process some test payments
      await paymentStream
        .connect(user1)
        .deposit({ value: ethers.parseEther("1") });

      await paymentStream.processPayment(
        modelId,
        user1.address,
        modelOwner.address,
        ethers.parseEther("0.1"),
        ethers.ZeroAddress,
        "test-1"
      );

      await paymentStream.processPayment(
        modelId,
        user1.address,
        modelOwner.address,
        ethers.parseEther("0.05"),
        ethers.ZeroAddress,
        "test-2"
      );
    });

    it("Should return correct platform statistics", async function () {
      const stats = await paymentStream.getPlatformStats();
      expect(stats[0]).to.equal(2); // totalPayments
      expect(stats[1]).to.equal(ethers.parseEther("0.15")); // totalVolume
      expect(stats[2]).to.equal(0); // platformFeePercentage
      expect(stats[3]).to.equal(owner.address); // feeRecipient
    });

    it("Should return user payment history", async function () {
      const userPayments = await paymentStream.getUserPayments(user1.address);
      expect(userPayments.length).to.equal(2);
    });

    it("Should return model owner payment history", async function () {
      const ownerPayments = await paymentStream.getModelOwnerPayments(
        modelOwner.address
      );
      expect(ownerPayments.length).to.equal(2);
    });
  });
});
