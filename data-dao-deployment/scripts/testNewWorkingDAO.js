require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Testing the Working DAO Implementation...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const TEST_TOKEN_ADDRESS = "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4";

    console.log('📋 Using existing contracts:');
    console.log(`MockDataCoin: ${MOCK_DATA_COIN_ADDRESS}`);
    console.log(`TestToken: ${TEST_TOKEN_ADDRESS}\n`);

    // Deploy the working DAO
    console.log('🏗️  Deploying WorkingCommunityAccessDAO...');
    const WorkingDAO = await ethers.getContractFactory("WorkingCommunityAccessDAO");
    
    const secondsPerToken = ethers.parseUnits("1", 18);
    const rewardRate = ethers.parseUnits("0.1", 18);
    
    console.log(`Seconds per token: ${ethers.formatUnits(secondsPerToken, 18)}`);
    console.log(`Reward rate: ${ethers.formatUnits(rewardRate, 18)} (will be scaled in contract)`);
    
    const workingDao = await WorkingDAO.deploy(
        TEST_TOKEN_ADDRESS,
        MOCK_DATA_COIN_ADDRESS,
        secondsPerToken,
        rewardRate,
        deployer.address,
        deployer.address
    );
    await workingDao.waitForDeployment();
    const workingDaoAddress = await workingDao.getAddress();
    console.log(`✅ Working DAO deployed: ${workingDaoAddress}\n`);

    // Grant MINTER_ROLE
    console.log('🔑 Granting MINTER_ROLE...');
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const MINTER_ROLE = await mockDataCoin.MINTER_ROLE();
    const grantTx = await mockDataCoin.grantRole(MINTER_ROLE, workingDaoAddress);
    await grantTx.wait();
    console.log('✅ MINTER_ROLE granted\n');

    // Test buyAccess
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(TEST_TOKEN_ADDRESS);
    
    const paymentAmount = ethers.parseUnits("10", 18);
    console.log(`🧪 Testing with payment: ${ethers.formatUnits(paymentAmount, 18)} tokens\n`);
    
    // Setup
    const balance = await testToken.balanceOf(deployer.address);
    if (balance < paymentAmount) {
        const mintTx = await testToken.mint(deployer.address, paymentAmount);
        await mintTx.wait();
    }
    
    const approveTx = await testToken.approve(workingDaoAddress, paymentAmount);
    await approveTx.wait();

    // Test
    const initialDataBalance = await mockDataCoin.balanceOf(deployer.address);
    console.log(`Initial DataCoin balance: ${ethers.formatUnits(initialDataBalance, 18)}\n`);

    console.log('🎯 Calling buyAccess...');
    const buyAccessTx = await workingDao.buyAccess(paymentAmount, deployer.address);
    const receipt = await buyAccessTx.wait();
    
    console.log(`✅ SUCCESS! Transaction: ${buyAccessTx.hash}`);

    // Check results
    const finalDataBalance = await mockDataCoin.balanceOf(deployer.address);
    const hasAccess = await workingDao.hasAccess(deployer.address);
    const expiry = await workingDao.expiry(deployer.address);
    
    console.log('\n📊 Results:');
    console.log(`Has access: ${hasAccess}`);
    console.log(`Access expires: ${new Date(Number(expiry / 1000n) * 1000).toISOString()}`);
    console.log(`Final DataCoin balance: ${ethers.formatUnits(finalDataBalance, 18)}`);
    console.log(`Rewards gained: ${ethers.formatUnits(finalDataBalance - initialDataBalance, 18)}`);

    console.log('\n🎉 SUCCESS! DAO buyAccess function is working!');
    console.log(`📋 Working DAO Address: ${workingDaoAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });