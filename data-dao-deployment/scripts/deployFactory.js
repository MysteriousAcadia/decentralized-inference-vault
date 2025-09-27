/**
 * Deployment script for DataCoinFactory.
 * NOTE: The factory Solidity implementation is not present in this repository.
 * This script assumes you will either:
 *  1. Add the DataCoinFactory.sol contract under contracts/ and compile, OR
 *  2. Provide FACTORY_BYTECODE + FACTORY_ABI JSON via environment / external file.
 *
 * Constructor signature inferred from ABI used in scripts:
 * constructor(
 *   address dataCoinImpl_,
 *   address uniswapV2Factory_,
 *   address uniswapV2Router_,
 *   address treasuryAddress_,
 *   uint256 dataCoinCreationFeeBps_,
 *   uint256 liquidityLockDuration_,
 *   address[] assets_,
 *   uint256[] minLockAmounts_,
 *   uint256[] buyTaxBps_,
 *   uint256[] sellTaxBps_,
 *   uint256[] mintTaxBps_,
 *   uint256[] lighthouseShareBps_
 * )
 */

require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Deploying DataCoinFactory");
  console.log(`Network: ${hre.network.name}`);

  const {
    DATACOIN_IMPL_ADDRESS,
    UNISWAP_V2_FACTORY_ADDRESS,
    UNISWAP_V2_ROUTER_ADDRESS,
    TREASURY_ADDRESS,
    DATACOIN_CREATION_FEE_BPS,
    LIQUIDITY_LOCK_DURATION,
    FACTORY_ASSETS_FILE,
    FACTORY_ABI_PATH,
    FACTORY_BYTECODE_PATH,
  } = process.env;

  // Basic validation
  const required = {
    DATACOIN_IMPL_ADDRESS,
    UNISWAP_V2_FACTORY_ADDRESS,
    UNISWAP_V2_ROUTER_ADDRESS,
    TREASURY_ADDRESS,
  };
  Object.entries(required).forEach(([k, v]) => {
    if (!v) throw new Error(`Missing env var: ${k}`);
  });

  const feeBps = DATACOIN_CREATION_FEE_BPS || "500"; // default 5%
  const lockDuration =
    LIQUIDITY_LOCK_DURATION || (30 * 24 * 60 * 60).toString(); // default 30 days

  // Load assets config list (JSON file expected with shape {assets:[{address,minLockAmount,buyTaxBps,sellTaxBps,mintTaxBps,lighthouseShareBps}]})
  let assetsConfig = [];
  if (FACTORY_ASSETS_FILE) {
    const raw = fs.readFileSync(path.resolve(FACTORY_ASSETS_FILE), "utf8");
    assetsConfig = JSON.parse(raw).assets || [];
  }
  if (assetsConfig.length === 0) {
    console.warn(
      "⚠️  No assets supplied; deploying with empty asset lists (can add later if factory supports it)."
    );
  }

  const assets = assetsConfig.map((a) => a.address);
  const minLockAmounts = assetsConfig.map((a) => a.minLockAmount);
  const buyTax = assetsConfig.map((a) => a.buyTaxBps);
  const sellTax = assetsConfig.map((a) => a.sellTaxBps);
  const mintTax = assetsConfig.map((a) => a.mintTaxBps);
  const lighthouseShare = assetsConfig.map((a) => a.lighthouseShareBps);

  let factoryContract;
  // Path-based artifact loading (preferred once solidity source added)
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "DataCoinFactory.sol",
    "DataCoinFactory.json"
  );
  if (fs.existsSync(artifactPath)) {
    console.log("✅ Found compiled artifact at", artifactPath);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const Factory = await hre.ethers.getContractFactory(
      artifact.abi,
      artifact.bytecode
    );
    factoryContract = await Factory.deploy(
      DATACOIN_IMPL_ADDRESS,
      UNISWAP_V2_FACTORY_ADDRESS,
      UNISWAP_V2_ROUTER_ADDRESS,
      TREASURY_ADDRESS,
      feeBps,
      lockDuration,
      assets,
      minLockAmounts,
      buyTax,
      sellTax,
      mintTax,
      lighthouseShare
    );
  } else {
    console.log("ℹ️  Artifact not found, attempting ABI/bytecode manual load");
    if (!FACTORY_ABI_PATH || !FACTORY_BYTECODE_PATH) {
      throw new Error(
        "Provide FACTORY_ABI_PATH and FACTORY_BYTECODE_PATH env paths when artifact missing"
      );
    }
    const abi = JSON.parse(
      fs.readFileSync(path.resolve(FACTORY_ABI_PATH), "utf8")
    );
    const bytecode = fs
      .readFileSync(path.resolve(FACTORY_BYTECODE_PATH), "utf8")
      .trim();
    const Factory = await hre.ethers.getContractFactory(abi, bytecode);
    factoryContract = await Factory.deploy(
      DATACOIN_IMPL_ADDRESS,
      UNISWAP_V2_FACTORY_ADDRESS,
      UNISWAP_V2_ROUTER_ADDRESS,
      TREASURY_ADDRESS,
      feeBps,
      lockDuration,
      assets,
      minLockAmounts,
      buyTax,
      sellTax,
      mintTax,
      lighthouseShare
    );
  }

  console.log("⏳ Waiting for deployment...");
  await factoryContract.waitForDeployment();

  console.log("\n✅ DataCoinFactory deployed");
  console.log("Factory Address    :", factoryContract.target);
  console.log("DataCoin Impl      :", DATACOIN_IMPL_ADDRESS);
  console.log("UniswapV2 Factory  :", UNISWAP_V2_FACTORY_ADDRESS);
  console.log("UniswapV2 Router   :", UNISWAP_V2_ROUTER_ADDRESS);
  console.log("Treasury           :", TREASURY_ADDRESS);
  console.log("Creation Fee (bps) :", feeBps);
  console.log("Lock Duration      :", lockDuration, "seconds");
  console.log("Assets Count       :", assets.length);
  if (assets.length) {
    assets.forEach((a, i) =>
      console.log(
        `  - ${a} min=${minLockAmounts[i]} buy=${buyTax[i]} sell=${sellTax[i]} mint=${mintTax[i]} lighthouse=${lighthouseShare[i]}`
      )
    );
  }
  console.log(
    "\n➡️  Set DATACOIN_FACTORY_ADDRESS in .env to this address for helper deployments."
  );
}

main().catch((e) => {
  console.error("❌ Deployment failed", e);
  process.exit(1);
});
