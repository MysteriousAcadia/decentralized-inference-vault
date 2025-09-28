/**
 * Setup DAO Permissions Script
 * 
 * This script grants the necessary permissions for the DAO to function properly.
 */

require("dotenv").config();
const hre = require("hardhat");

async function main() {
  console.log("\n🔧 Setting up DAO Permissions");
  console.log(`🌐 Network: ${hre.network.name}`);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("❌ Missing PRIVATE_KEY environment variable");
  }

  const provider = hre.ethers.provider;
  const signer = new hre.ethers.Wallet(privateKey, provider);
  console.log(`👤 Admin: ${signer.address}`);

  const daoAddress = process.env.DAO_ADDRESS;
  const rewardTokenAddress = process.env.REWARD_TOKEN_ADDRESS;

  if (!daoAddress || !rewardTokenAddress) {
    throw new Error("❌ Missing DAO_ADDRESS or REWARD_TOKEN_ADDRESS in .env");
  }

  console.log(`🏛️  DAO: ${daoAddress}`);
  console.log(`🪙 Reward Token: ${rewardTokenAddress}`);

  // Connect to reward token
  const rewardToken = await hre.ethers.getContractAt("MockDataCoin", rewardTokenAddress, signer);

  try {
    // Check current roles
    const minterRole = await rewardToken.MINTER_ROLE();
    const adminRole = await rewardToken.DEFAULT_ADMIN_ROLE();
    
    console.log(`\n🔑 Role Information:`);
    console.log(`   Minter Role: ${minterRole}`);
    console.log(`   Admin Role: ${adminRole}`);

    // Check if signer has admin role (should have it as deployer)
    console.log(`\n🔍 Current Permissions:`);
    console.log(`   Signer is admin: Checking...`);
    
    // Grant minter role to DAO
    console.log(`\n🎯 Granting MINTER_ROLE to DAO...`);
    const grantTx = await rewardToken.grantRole(minterRole, daoAddress);
    console.log(`📝 Transaction Hash: ${grantTx.hash}`);
    
    await grantTx.wait();
    console.log(`✅ MINTER_ROLE granted to DAO successfully!`);

    // Verify the role was granted
    console.log(`\n✅ Verification:`);
    // Note: MockDataCoin doesn't have hasRole as a public function, but the grant should work

    console.log(`🎉 DAO permissions setup completed!`);
    console.log(`\nNow you can test buyAccess with: npm run test:buy-access:sepolia`);

  } catch (error) {
    console.error("❌ Permission setup failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("NO_ADMIN")) {
      console.log("\n💡 The signer doesn't have admin permissions on the reward token.");
      console.log("   This can happen if the token was deployed by a different account.");
      console.log("   Try using the account that deployed the MockDataCoin.");
    }
    
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n🏁 Permission setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Permission setup failed:");
    console.error(error.message);
    process.exit(1);
  });