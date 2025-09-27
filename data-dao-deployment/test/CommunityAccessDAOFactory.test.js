const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CommunityAccessDAOFactory", function () {
  async function deployFixture() {
    const [deployer, user, recipient] = await ethers.getSigners();

    // Deploy mock payment token (simple ERC20 from OpenZeppelin if present or minimal mock)
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const paymentToken = await ERC20Mock.deploy(
      "PayToken",
      "PAY",
      deployer.address,
      ethers.parseUnits("100000", 18)
    );

    // Deploy mock data coin factory
    const MockDataCoinFactory = await ethers.getContractFactory(
      "MockDataCoinFactory"
    );
    const dataCoinFactory = await MockDataCoinFactory.deploy();

    // Deploy access factory
    const CommunityAccessDAOFactory = await ethers.getContractFactory(
      "CommunityAccessDAOFactory"
    );
    const factory = await CommunityAccessDAOFactory.deploy(
      ethers.ZeroAddress,
      dataCoinFactory.target
    );

    // Prepare params
    const dcParams = {
      name: "DataCoinOne",
      symbol: "DC1",
      tokenURI: "ipfs://token",
      creatorAllocationBps: 1000,
      creatorVestingDuration: 0,
      contributorsAllocationBps: 6000,
      liquidityAllocationBps: 3000,
      lockToken: ethers.ZeroAddress,
      lockAmount: 0n,
      salt: ethers.keccak256(ethers.toUtf8Bytes("salt1")),
    };
    console.log("DataCoin Params:", dcParams);
    const apParams = {
      paymentToken: paymentToken.target,
      secondsPerToken: 3600,
      rewardRate: 1n, // 1 DataCoin per payment token unit (simplified mock decimals assumption)
      treasury: deployer.address,
    };
    console.log("Access Params:", apParams);
    return {
      deployer,
      user,
      recipient,
      paymentToken,
      dataCoinFactory,
      factory,
      dcParams,
      apParams,
    };
  }

  it("deploys DAO and DataCoin and mints rewards on access purchase", async function () {
    const {
      factory,
      dcParams,
      apParams,
      deployer,
      user,
      recipient,
      paymentToken,
    } = await deployFixture();

    // fund user with payment tokens
    await paymentToken.transfer(user.address, ethers.parseUnits("1000", 18));

    // create DAO
    const tx = await factory
      .connect(user)
      .createCommunityAccessDAO(dcParams, apParams);
    const receipt = await tx.wait();

    // Find event
    expect(receipt.status).to.equal(1);

    const event = receipt.logs
      .map((l) => {
        try {
          return factory.interface.parseLog(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .find((e) => e.name === "CommunityDAODeployed");
    expect(event, "Deployment event missing").to.exist;

    const daoAddress = event.args.daoAddress;
    const dataCoinAddress = event.args.dataCoin;
    console.log("DAO Address:", daoAddress);
    console.log("DataCoin Address:", dataCoinAddress);

    expect(daoAddress).to.properAddress;
    expect(dataCoinAddress).to.properAddress;

    const dao = await ethers.getContractAt("CommunityAccessDAO", daoAddress);
    const dataCoin = await ethers.getContractAt(
      "MockDataCoin",
      dataCoinAddress
    );

    // Grant MINTER_ROLE to DAO (since constructor best-effort grant may fail due to role ownership)
    const minterRole = await dataCoin.MINTER_ROLE();
    await dataCoin.connect(user).grantRole(minterRole, daoAddress);

    // Approve and buy access
    await paymentToken
      .connect(user)
      .approve(daoAddress, ethers.parseUnits("10", 18));
    const beforeExpiry = await dao.getExpiry(recipient.address);
    expect(beforeExpiry).to.equal(0);

    await expect(
      dao
        .connect(user)
        .buyAccess(ethers.parseUnits("10", 18), recipient.address)
    )
      .to.emit(dao, "AccessPurchased")
      .and.to.emit(dao, "RewardMinted");

    const afterExpiry = await dao.getExpiry(recipient.address);
    expect(afterExpiry).to.be.gt(0);

    // Reward minted to recipient (1:1 simplified)
    const rewardBal = await dataCoin.balanceOf(recipient.address);
    expect(rewardBal).to.equal(ethers.parseUnits("10", 18));
  });
});
