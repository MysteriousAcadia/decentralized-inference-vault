// Deploys a full mock stack: ERC20 payment token, MockDataCoinFactory, CommunityAccessDAOFactory
// Usage: npx hardhat run scripts/deployCommunityAccessStack.js --network <network>

const hre = require("hardhat");

async function main() {
  console.log("\n🚀 Deploying Community Access stack");
  console.log("Network:", hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1. Payment token (mock)
  const ERC20Mock = await hre.ethers.getContractFactory("ERC20Mock");
  const paymentToken = await ERC20Mock.deploy(
    "PayToken",
    "PAY",
    deployer.address,
    hre.ethers.parseUnits("1000000", 18)
  );
  await paymentToken.waitForDeployment();
  console.log("PaymentToken:", paymentToken.target);

  // 2. Mock DataCoin Factory
  const MockDataCoinFactory = await hre.ethers.getContractFactory(
    "MockDataCoinFactory"
  );
  const dataCoinFactory = await MockDataCoinFactory.deploy();
  await dataCoinFactory.waitForDeployment();
  console.log("MockDataCoinFactory:", dataCoinFactory.target);

  // 3. CommunityAccessDAOFactory (defaultTreasury set to deployer for now)
  const CommunityAccessDAOFactory = await hre.ethers.getContractFactory(
    "CommunityAccessDAOFactory"
  );
  const communityFactory = await CommunityAccessDAOFactory.deploy(
    deployer.address,
    dataCoinFactory.target
  );
  await communityFactory.waitForDeployment();
  console.log("CommunityAccessDAOFactory:", communityFactory.target);

  console.log("\n✅ Deployment complete");
  console.log(
    JSON.stringify(
      {
        network: hre.network.name,
        deployer: deployer.address,
        paymentToken: paymentToken.target,
        mockDataCoinFactory: dataCoinFactory.target,
        communityAccessDAOFactory: communityFactory.target,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
