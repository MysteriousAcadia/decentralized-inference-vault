// Creates a CommunityAccessDAO using an existing deployed stack.
// Prerequisites: Provide FACTORY_ADDRESS (CommunityAccessDAOFactory) and PAYMENT_TOKEN in .env or inline.
// Usage: npx hardhat run scripts/createCommunityAccessDAO.js --network <network>

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  const factoryAddress =
    process.env.COMMUNITY_DAO_FACTORY_ADDRESS || process.env.FACTORY_ADDRESS;
  if (!factoryAddress)
    throw new Error("Missing COMMUNITY_DAO_FACTORY_ADDRESS or FACTORY_ADDRESS");

  // Configuration (replace / parameterize as needed)
  const paymentToken = process.env.PAYMENT_TOKEN_ADDRESS; // optional override
  const secondsPerToken = parseInt(process.env.SECONDS_PER_TOKEN || "3600", 10); // 1 token = 1 hour
  const rewardRate = BigInt(process.env.REWARD_RATE || "1"); // normalized reward per payment unit
  const treasury = process.env.TREASURY_ADDRESS || hre.ethers.ZeroAddress; // fallback resolved in factory if zero

  // DataCoin params (mock factory ignores economics but we keep structure)
  const dcParams = {
    name: process.env.DATACOIN_NAME || "AccessDataToken",
    symbol: process.env.DATACOIN_SYMBOL || "ADT",
    tokenURI: process.env.DATACOIN_TOKEN_URI || "ipfs://token",
    creatorAllocationBps: parseInt(
      process.env.DATACOIN_CREATOR_ALLOC || "1000",
      10
    ),
    creatorVestingDuration: parseInt(
      process.env.DATACOIN_CREATOR_VESTING || "0",
      10
    ),
    contributorsAllocationBps: parseInt(
      process.env.DATACOIN_CONTRIBUTORS_ALLOC || "6000",
      10
    ),
    liquidityAllocationBps: parseInt(
      process.env.DATACOIN_LIQUIDITY_ALLOC || "3000",
      10
    ),
    lockToken: hre.ethers.ZeroAddress,
    lockAmount: 0n,
    salt: hre.ethers.id(process.env.DATACOIN_SALT || "default-salt"),
  };

  const [signer] = await hre.ethers.getSigners();
  console.log("\n🚀 Creating CommunityAccessDAO");
  console.log("Factory:", factoryAddress);
  console.log("Signer :", signer.address);

  const factory = await hre.ethers.getContractAt(
    "CommunityAccessDAOFactory",
    factoryAddress,
    signer
  );

  // Resolve payment token: if not provided deploy a quick mock
  let paymentTokenAddress = paymentToken;
  if (!paymentTokenAddress) {
    const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
    const mock = await ERC20Mock.deploy(
      "PayToken",
      "PAY",
      signer.address,
      hre.ethers.parseUnits("1000000", 18)
    );
    await mock.waitForDeployment();
    paymentTokenAddress = mock.target;
    console.log("Deployed temp payment token:", paymentTokenAddress);
  }

  const apParams = {
    paymentToken: paymentTokenAddress,
    secondsPerToken,
    rewardRate,
    treasury,
  };

  const tx = await factory.createCommunityAccessDAO(dcParams, apParams);
  console.log("Tx hash:", tx.hash);
  const receipt = await tx.wait();

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

  if (!event) throw new Error("CommunityDAODeployed event not found");

  const { daoAddress, dataCoin } = event.args;
  console.log("\n✅ CommunityAccessDAO created");
  console.log("DAO      :", daoAddress);
  console.log("DataCoin :", dataCoin);
  console.log("Payment  :", paymentTokenAddress);
  console.log("Seconds/token:", secondsPerToken);
  console.log("RewardRate   :", rewardRate.toString());

  console.log(
    "\n➡️  Next: grant MINTER_ROLE to DAO if not already and call buyAccess()."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
