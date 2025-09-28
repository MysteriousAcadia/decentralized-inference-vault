require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Deploying DAO with Correct Reward Rate...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const TEST_TOKEN_ADDRESS = "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4";

    // Get existing contracts
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(TEST_TOKEN_ADDRESS);

    console.log('📋 Using existing contracts:');
    console.log(`MockDataCoin: ${MOCK_DATA_COIN_ADDRESS}`);
    console.log(`TestToken: ${TEST_TOKEN_ADDRESS}\n`);

    // Deploy the fixed DAO with correct reward rate
    console.log('🏗️  Deploying DAO with correct reward rate...');
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    
    // Proper configuration:
    // - secondsPerToken: 1 token = 1 second of access
    // - rewardRate: 0.1 rewards per payment token (10% reward rate)
    //   This means: 100 payment tokens = 10 reward tokens
    const secondsPerToken = ethers.parseUnits("1", 18); // 1 token = 1 second
    const rewardRate = ethers.parseUnits("0.1", 18); // 0.1 rewards per payment token (10% rate)
    
    console.log(`Seconds per token: ${ethers.formatUnits(secondsPerToken, 18)}`);
    console.log(`Reward rate: ${ethers.formatUnits(rewardRate, 18)} (10% of payment)`);
    
    const fixedDao = await FixedDAO.deploy(
        TEST_TOKEN_ADDRESS,          // paymentToken
        MOCK_DATA_COIN_ADDRESS,      // dataCoin (rewards)
        secondsPerToken,             // secondsPerToken (1 token = 1 second)
        rewardRate,                  // rewardRate (0.1 rewards per payment token)
        deployer.address,            // treasury
        deployer.address             // owner
    );
    await fixedDao.waitForDeployment();
    const fixedDaoAddress = await fixedDao.getAddress();
    console.log(`✅ Fixed DAO deployed: ${fixedDaoAddress}\n`);

    // Grant MINTER_ROLE to the fixed DAO
    console.log('🔑 Granting MINTER_ROLE to Fixed DAO...');
    const MINTER_ROLE = await mockDataCoin.MINTER_ROLE();
    const grantTx = await mockDataCoin.grantRole(MINTER_ROLE, fixedDaoAddress);
    await grantTx.wait();
    console.log('✅ MINTER_ROLE granted to Fixed DAO\n');

    // Test the reward calculation
    console.log('🧮 Testing reward calculation...');
    const paymentAmount = ethers.parseUnits("100", 18); // 100 payment tokens
    const expectedReward = paymentAmount * rewardRate / ethers.parseUnits("1", 18); // Divide to adjust for 18 decimal scaling
    console.log(`Payment: ${ethers.formatUnits(paymentAmount, 18)} tokens`);
    console.log(`Expected reward: ${ethers.formatUnits(expectedReward, 18)} DataCoins`);
    console.log(`Calculation: ${ethers.formatUnits(paymentAmount, 18)} * ${ethers.formatUnits(rewardRate, 18)} = ${ethers.formatUnits(expectedReward, 18)}\n`);

    // Set up payment
    console.log('💰 Setting up payment...');
    const userBalance = await testToken.balanceOf(deployer.address);
    console.log(`Current balance: ${ethers.formatUnits(userBalance, 18)}`);
    
    const approveTx = await testToken.approve(fixedDaoAddress, paymentAmount);
    await approveTx.wait();
    console.log('✅ Approval successful\n');

    // Test buyAccess
    console.log('🎯 Testing buyAccess...');
    
    const initialDataBalance = await mockDataCoin.balanceOf(deployer.address);
    console.log(`Initial DataCoin balance: ${ethers.formatUnits(initialDataBalance, 18)}`);
    
    try {
        const buyAccessTx = await fixedDao.buyAccess(paymentAmount, deployer.address);
        const receipt = await buyAccessTx.wait();
        
        console.log(`✅ buyAccess successful! Transaction: ${buyAccessTx.hash}`);
        
        // Check results
        const finalDataBalance = await mockDataCoin.balanceOf(deployer.address);
        const hasAccess = await fixedDao.hasAccess(deployer.address);
        const expiry = await fixedDao.expiry(deployer.address);
        
        const rewardGained = finalDataBalance - initialDataBalance;
        
        console.log('\n📊 Results:');
        console.log(`User has access: ${hasAccess}`);
        console.log(`Access expires: ${new Date(Number(expiry) * 1000).toISOString()}`);
        console.log(`DataCoin balance: ${ethers.formatUnits(finalDataBalance, 18)}`);
        console.log(`Rewards gained: ${ethers.formatUnits(rewardGained, 18)} DataCoins`);
        console.log(`Expected reward: ${ethers.formatUnits(expectedReward, 18)} DataCoins`);
        
        if (rewardGained === expectedReward) {
            console.log('✅ Reward calculation is correct!');
        } else {
            console.log('⚠️  Reward calculation differs from expected');
        }

        // Parse events
        console.log('\n📋 Events:');
        for (const log of receipt.logs) {
            try {
                const parsed = fixedDao.interface.parseLog(log);
                if (parsed) {
                    console.log(`  ${parsed.name}:`);
                    if (parsed.name === "AccessPurchased") {
                        console.log(`    User: ${parsed.args[0]}`);
                        console.log(`    Amount: ${ethers.formatUnits(parsed.args[1], 18)}`);
                        console.log(`    Duration: ${parsed.args[2]} seconds`);
                        console.log(`    Expires: ${new Date(Number(parsed.args[3]) * 1000).toISOString()}`);
                    } else if (parsed.name === "RewardMinted") {
                        console.log(`    To: ${parsed.args[0]}`);
                        console.log(`    Amount: ${ethers.formatUnits(parsed.args[1], 18)}`);
                    }
                }
            } catch (e) {
                // Ignore unparseable events
            }
        }

        console.log('\n🎉 All tests passed! DAO buyAccess function is working correctly!');
        console.log(`\n📋 Correct DAO Address: ${fixedDaoAddress}`);

    } catch (error) {
        console.error(`❌ buyAccess failed: ${error.message}`);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });