const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestToken", function () {
  let testToken;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const TestToken = await ethers.getContractFactory("TestToken");
    testToken = await TestToken.deploy("Test Payment Token", "TPT");
    await testToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right token name and symbol", async function () {
      expect(await testToken.name()).to.equal("Test Payment Token");
      expect(await testToken.symbol()).to.equal("TPT");
      expect(await testToken.decimals()).to.equal(18);
    });

    it("Should mint initial supply to deployer", async function () {
      const expectedSupply = ethers.parseEther("1000000"); // 1M tokens
      expect(await testToken.totalSupply()).to.equal(expectedSupply);
      expect(await testToken.balanceOf(owner.address)).to.equal(expectedSupply);
    });
  });

  describe("Minting Functions", function () {
    it("Should allow anyone to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");

      // Any address can mint to any other address
      await testToken.connect(addr1).mint(addr2.address, mintAmount);
      expect(await testToken.balanceOf(addr2.address)).to.equal(mintAmount);
    });

    it("Should allow minting with human-readable amounts", async function () {
      await testToken.mintTokens(addr1.address, 500);
      expect(await testToken.balanceOfTokens(addr1.address)).to.equal(500);
      expect(await testToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("500")
      );
    });

    it("Should allow minting to self", async function () {
      await testToken.connect(addr1).mintToSelf(ethers.parseEther("100"));
      expect(await testToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("Should allow minting tokens to self with human-readable amounts", async function () {
      await testToken.connect(addr2).mintTokensToSelf(250);
      expect(await testToken.balanceOfTokens(addr2.address)).to.equal(250);
    });

    it("Should allow batch minting same amounts", async function () {
      const recipients = [addr1.address, addr2.address, addr3.address];
      const amount = ethers.parseEther("100");

      await testToken.batchMint(recipients, amount);

      for (const recipient of recipients) {
        expect(await testToken.balanceOf(recipient)).to.equal(amount);
      }
    });

    it("Should allow batch minting different amounts", async function () {
      const recipients = [addr1.address, addr2.address, addr3.address];
      const amounts = [
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("300"),
      ];

      await testToken.batchMintDifferentAmounts(recipients, amounts);

      for (let i = 0; i < recipients.length; i++) {
        expect(await testToken.balanceOf(recipients[i])).to.equal(amounts[i]);
      }
    });

    it("Should allow airdropping tokens", async function () {
      const recipients = [addr1.address, addr2.address, addr3.address];
      const amountPerRecipient = 150;

      await testToken.airdrop(recipients, amountPerRecipient);

      for (const recipient of recipients) {
        expect(await testToken.balanceOfTokens(recipient)).to.equal(
          amountPerRecipient
        );
      }
    });

    it("Should allow minting a million tokens", async function () {
      await testToken.mintMillion(addr1.address);
      expect(await testToken.balanceOfTokens(addr1.address)).to.equal(
        1_000_000
      );
    });
  });

  describe("Burning Functions", function () {
    it("Should allow burning own tokens", async function () {
      // First mint some tokens
      await testToken.mintTokensToSelf(1000);
      const initialBalance = await testToken.balanceOf(owner.address);

      // Burn some tokens
      const burnAmount = ethers.parseEther("500");
      await testToken.burn(burnAmount);

      expect(await testToken.balanceOf(owner.address)).to.equal(
        initialBalance - burnAmount
      );
    });

    it("Should allow burning from any address", async function () {
      // Mint tokens to addr1
      await testToken.mintTokens(addr1.address, 1000);
      const initialBalance = await testToken.balanceOf(addr1.address);

      // Anyone can burn from any address (for testing purposes)
      const burnAmount = ethers.parseEther("300");
      await testToken.connect(addr2).burnFrom(addr1.address, burnAmount);

      expect(await testToken.balanceOf(addr1.address)).to.equal(
        initialBalance - burnAmount
      );
    });
  });

  describe("View Functions", function () {
    it("Should return token info correctly", async function () {
      const [name, symbol, decimals, totalSupply] =
        await testToken.getTokenInfo();

      expect(name).to.equal("Test Payment Token");
      expect(symbol).to.equal("TPT");
      expect(decimals).to.equal(18);
      expect(totalSupply).to.equal(ethers.parseEther("1000000"));
    });

    it("Should return human-readable balance", async function () {
      await testToken.mintTokens(addr1.address, 2500);
      expect(await testToken.balanceOfTokens(addr1.address)).to.equal(2500);
    });
  });

  describe("Standard ERC20 Functions", function () {
    it("Should allow transfers", async function () {
      const transferAmount = ethers.parseEther("1000");

      await testToken.transfer(addr1.address, transferAmount);
      expect(await testToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should allow approvals and transferFrom", async function () {
      const amount = ethers.parseEther("500");

      // Owner approves addr1 to spend tokens
      await testToken.approve(addr1.address, amount);

      // addr1 transfers from owner to addr2
      await testToken
        .connect(addr1)
        .transferFrom(owner.address, addr2.address, amount);

      expect(await testToken.balanceOf(addr2.address)).to.equal(amount);
    });
  });

  describe("Error Handling", function () {
    it("Should revert batch mint with mismatched arrays", async function () {
      const recipients = [addr1.address, addr2.address];
      const amounts = [ethers.parseEther("100")]; // Only one amount for two recipients

      await expect(
        testToken.batchMintDifferentAmounts(recipients, amounts)
      ).to.be.revertedWith("Arrays length mismatch");
    });
  });
});
