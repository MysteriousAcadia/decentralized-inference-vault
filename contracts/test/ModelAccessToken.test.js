const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ModelAccessToken", function () {
  let ModelAccessToken;
  let modelAccessToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const TOKEN_NAME = "Test Model Token";
  const TOKEN_SYMBOL = "TMT";
  const MODEL_ID = "test-model-v1";
  const MODEL_NAME = "Test AI Model";
  const MODEL_DESCRIPTION = "A test AI model for unit testing";
  const MAX_SUPPLY = ethers.parseEther("1000000");
  const ACCESS_THRESHOLD = ethers.parseEther("1");
  const PREMIUM_THRESHOLD = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    ModelAccessToken = await ethers.getContractFactory("ModelAccessToken");
    modelAccessToken = await ModelAccessToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      MODEL_ID,
      MODEL_NAME,
      MODEL_DESCRIPTION,
      owner.address,
      MAX_SUPPLY,
      ACCESS_THRESHOLD,
      PREMIUM_THRESHOLD
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await modelAccessToken.modelOwner()).to.equal(owner.address);
    });

    it("Should set the correct token parameters", async function () {
      expect(await modelAccessToken.name()).to.equal(TOKEN_NAME);
      expect(await modelAccessToken.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await modelAccessToken.modelId()).to.equal(MODEL_ID);
      expect(await modelAccessToken.modelName()).to.equal(MODEL_NAME);
      expect(await modelAccessToken.maxSupply()).to.equal(MAX_SUPPLY);
      expect(await modelAccessToken.accessThreshold()).to.equal(ACCESS_THRESHOLD);
      expect(await modelAccessToken.premiumThreshold()).to.equal(PREMIUM_THRESHOLD);
    });

    it("Should assign roles correctly", async function () {
      const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));

      expect(await modelAccessToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await modelAccessToken.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await modelAccessToken.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Should start with public minting disabled", async function () {
      expect(await modelAccessToken.publicMintEnabled()).to.be.false;
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(modelAccessToken.mint(addr1.address, amount))
        .to.emit(modelAccessToken, "TokensMinted")
        .withArgs(addr1.address, amount, 0);

      expect(await modelAccessToken.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(
        modelAccessToken.connect(addr1).mint(addr2.address, amount)
      ).to.be.reverted;
    });

    it("Should not exceed max supply", async function () {
      const amount = MAX_SUPPLY + 1n;
      
      await expect(
        modelAccessToken.mint(addr1.address, amount)
      ).to.be.revertedWith("Exceeds max supply");
    });

    describe("Public Minting", function () {
      beforeEach(async function () {
        await modelAccessToken.setPublicMintEnabled(true);
        await modelAccessToken.setMintPrice(ethers.parseEther("0.01"));
      });

      it("Should allow public minting when enabled", async function () {
        const amount = ethers.parseEther("10");
        const cost = ethers.parseEther("0.1"); // 10 tokens * 0.01 ETH

        await expect(
          modelAccessToken.connect(addr1).publicMint(amount, { value: cost })
        ).to.emit(modelAccessToken, "TokensMinted")
          .withArgs(addr1.address, amount, cost);

        expect(await modelAccessToken.balanceOf(addr1.address)).to.equal(amount);
      });

      it("Should refund excess payment", async function () {
        const amount = ethers.parseEther("10");
        const cost = ethers.parseEther("0.1");
        const excess = ethers.parseEther("0.05");
        
        const initialBalance = await ethers.provider.getBalance(addr1.address);
        
        const tx = await modelAccessToken.connect(addr1).publicMint(amount, { 
          value: cost + excess 
        });
        const receipt = await tx.wait();
        const gasUsed = receipt.gasUsed * receipt.gasPrice;

        const finalBalance = await ethers.provider.getBalance(addr1.address);
        
        // Check that only the cost was deducted (plus gas)
        expect(finalBalance).to.be.closeTo(
          initialBalance - cost - gasUsed,
          ethers.parseEther("0.001") // Small tolerance for gas estimation
        );
      });

      it("Should not allow public minting with insufficient payment", async function () {
        const amount = ethers.parseEther("10");
        const insufficientPayment = ethers.parseEther("0.05"); // Less than required

        await expect(
          modelAccessToken.connect(addr1).publicMint(amount, { value: insufficientPayment })
        ).to.be.revertedWith("Insufficient payment");
      });
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      // Mint tokens for testing access control
      await modelAccessToken.mint(addr1.address, ethers.parseEther("50"));
      await modelAccessToken.mint(addr2.address, ethers.parseEther("150"));
    });

    it("Should correctly check basic access", async function () {
      expect(await modelAccessToken.hasAccess(addr1.address)).to.be.true;
      expect(await modelAccessToken.hasAccess(addr2.address)).to.be.true;
      expect(await modelAccessToken.hasAccess(addrs[0].address)).to.be.false;
    });

    it("Should correctly check premium access", async function () {
      expect(await modelAccessToken.hasPremiumAccess(addr1.address)).to.be.false;
      expect(await modelAccessToken.hasPremiumAccess(addr2.address)).to.be.true;
      expect(await modelAccessToken.hasPremiumAccess(addrs[0].address)).to.be.false;
    });

    it("Should check access with custom minimum balance", async function () {
      const customThreshold = ethers.parseEther("75");
      
      expect(await modelAccessToken["hasAccess(address,uint256)"](addr1.address, customThreshold)).to.be.false;
      expect(await modelAccessToken["hasAccess(address,uint256)"](addr2.address, customThreshold)).to.be.true;
    });
  });

  describe("Threshold Management", function () {
    it("Should allow admin to update access threshold", async function () {
      const newThreshold = ethers.parseEther("5");
      
      await expect(modelAccessToken.setAccessThreshold(newThreshold))
        .to.emit(modelAccessToken, "AccessThresholdUpdated")
        .withArgs(ACCESS_THRESHOLD, newThreshold);

      expect(await modelAccessToken.accessThreshold()).to.equal(newThreshold);
    });

    it("Should allow admin to update premium threshold", async function () {
      const newThreshold = ethers.parseEther("200");
      
      await expect(modelAccessToken.setPremiumThreshold(newThreshold))
        .to.emit(modelAccessToken, "PremiumThresholdUpdated")
        .withArgs(PREMIUM_THRESHOLD, newThreshold);

      expect(await modelAccessToken.premiumThreshold()).to.equal(newThreshold);
    });

    it("Should not allow premium threshold below access threshold", async function () {
      const lowThreshold = ethers.parseEther("0.5");
      
      await expect(
        modelAccessToken.setPremiumThreshold(lowThreshold)
      ).to.be.revertedWith("Premium threshold must be >= access threshold");
    });

    it("Should not allow non-admin to update thresholds", async function () {
      await expect(
        modelAccessToken.connect(addr1).setAccessThreshold(ethers.parseEther("5"))
      ).to.be.reverted;
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await modelAccessToken.mint(addr1.address, ethers.parseEther("100"));
    });

    it("Should allow admin to burn tokens", async function () {
      const burnAmount = ethers.parseEther("50");
      
      await expect(modelAccessToken.burn(addr1.address, burnAmount))
        .to.emit(modelAccessToken, "TokensBurned")
        .withArgs(addr1.address, burnAmount);

      expect(await modelAccessToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("Should not allow burning more than balance", async function () {
      const excessiveAmount = ethers.parseEther("200");
      
      await expect(
        modelAccessToken.burn(addr1.address, excessiveAmount)
      ).to.be.revertedWith("Insufficient balance to burn");
    });

    it("Should not allow non-admin to burn tokens", async function () {
      await expect(
        modelAccessToken.connect(addr1).burn(addr1.address, ethers.parseEther("10"))
      ).to.be.reverted;
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to pause contract", async function () {
      await modelAccessToken.pause();
      expect(await modelAccessToken.paused()).to.be.true;
    });

    it("Should prevent transfers when paused", async function () {
      await modelAccessToken.mint(addr1.address, ethers.parseEther("100"));
      await modelAccessToken.pause();

      await expect(
        modelAccessToken.connect(addr1).transfer(addr2.address, ethers.parseEther("10"))
      ).to.be.revertedWithCustomError(modelAccessToken, "EnforcedPause");
    });

    it("Should prevent minting when paused", async function () {
      await modelAccessToken.pause();

      await expect(
        modelAccessToken.mint(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(modelAccessToken, "EnforcedPause");
    });
  });

  describe("Token Information", function () {
    it("Should return correct token information", async function () {
      const tokenInfo = await modelAccessToken.getTokenInfo();
      
      expect(tokenInfo[0]).to.equal(MODEL_ID); // modelId
      expect(tokenInfo[1]).to.equal(MODEL_NAME); // modelName
      expect(tokenInfo[2]).to.equal(MODEL_DESCRIPTION); // modelDescription
      expect(tokenInfo[3]).to.equal(owner.address); // modelOwner
      expect(tokenInfo[5]).to.equal(MAX_SUPPLY); // maxSupply
      expect(tokenInfo[6]).to.equal(ACCESS_THRESHOLD); // accessThreshold
      expect(tokenInfo[7]).to.equal(PREMIUM_THRESHOLD); // premiumThreshold
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero amounts correctly", async function () {
      await expect(
        modelAccessToken.mint(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");

      await expect(
        modelAccessToken.burn(addr1.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should handle zero addresses correctly", async function () {
      await expect(
        modelAccessToken.mint(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWith("Cannot mint to zero address");

      await expect(
        modelAccessToken.burn(ethers.ZeroAddress, ethers.parseEther("100"))
      ).to.be.revertedWith("Cannot burn from zero address");
    });
  });
});