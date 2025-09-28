require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Deploying DAO with Properly Scaled Reward Rate...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const TEST_TOKEN_ADDRESS = "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4";

    console.log('📋 Using existing contracts:');
    console.log(`MockDataCoin: ${MOCK_DATA_COIN_ADDRESS}`);
    console.log(`TestToken: ${TEST_TOKEN_ADDRESS}\n`);

    // Deploy DAO with correctly scaled reward rate
    console.log('🏗️  Deploying DAO with properly scaled reward rate...');
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    
    // Correct calculation:
    // We want 10% rewards, so for 100 payment tokens, user gets 10 reward tokens
    // 
    // Contract calculation: reward = normalized * _rewardRate
    // Where normalized = paymentAmount (both in 18 decimals)
    // 
    // To get 10% rate:
    // reward = paymentAmount * rewardRate
    // 10 = 100 * rewardRate
    // rewardRate = 0.1
    // 
    // But since both are in 18 decimals:
    // 10 * 10^18 = 100 * 10^18 * rewardRate
    // rewardRate = 0.1 (but WITHOUT 18 decimal scaling)
    // 
    // So we need rewardRate = 0.1 in wei units = 100000000000000000 (17 zeros)
    
    const secondsPerToken = ethers.parseUnits("1", 18); // 1 token = 1 second
    const rewardRate = BigInt(1) * BigInt(10**17); // 0.1 in wei = 100000000000000000
    
    console.log(`Seconds per token: ${ethers.formatUnits(secondsPerToken, 18)}`);
    console.log(`Reward rate (raw): ${rewardRate}`);
    console.log(`Reward rate (as decimal): ${Number(rewardRate) / 10}`);
    
    // Test the math:
    // For 100 tokens payment:
    const testPayment = ethers.parseUnits("100", 18);
    const expectedReward = testPayment * rewardRate; // This should give us 10 * 10^18
    console.log(`\n🧮 Math check:`);
    console.log(`Payment: ${ethers.formatUnits(testPayment, 18)} tokens`);
    console.log(`Expected reward: ${ethers.formatUnits(expectedReward, 18)} tokens`);
    console.log(`Calculation: ${ethers.formatUnits(testPayment, 18)} * ${rewardRate} = ${ethers.formatUnits(expectedReward, 18)}\n`);
    
    const fixedDao = await FixedDAO.deploy(
        TEST_TOKEN_ADDRESS,          // paymentToken
        MOCK_DATA_COIN_ADDRESS,      // dataCoin (rewards)
        secondsPerToken,             // secondsPerToken (1 token = 1 second)
        rewardRate,                  // rewardRate (0.1 without decimal scaling)
        deployer.address,            // treasury
        deployer.address             // owner
    );
    await fixedDao.waitForDeployment();
    const fixedDaoAddress = await fixedDao.getAddress();
    console.log(`✅ Fixed DAO deployed: ${fixedDaoAddress}\n`);

    // Grant MINTER_ROLE to the DAO
    console.log('🔑 Granting MINTER_ROLE to DAO...');
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const MINTER_ROLE = await mockDataCoin.MINTER_ROLE();
    const grantTx = await mockDataCoin.grantRole(MINTER_ROLE, fixedDaoAddress);
    await grantTx.wait();
    console.log('✅ MINTER_ROLE granted\n');

    // Test with a reasonable amount
    console.log('🧪 Testing buyAccess...');
    
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(TEST_TOKEN_ADDRESS);
    
    const paymentAmount = ethers.parseUnits("10", 18); // 10 tokens
    console.log(`Using payment: ${ethers.formatUnits(paymentAmount, 18)} tokens`);
    
    // Calculate expected reward
    const calculatedReward = paymentAmount * rewardRate;
    console.log(`Expected reward: ${ethers.formatUnits(calculatedReward, 18)} DataCoins`);
    
    // Set up payment
    let balance = await testToken.balanceOf(deployer.address);
    if (balance < paymentAmount) {
        const mintTx = await testToken.mint(deployer.address, paymentAmount);
        await mintTx.wait();
    }
    
    const approveTx = await testToken.approve(fixedDaoAddress, paymentAmount);
    await approveTx.wait();
    console.log('✅ Setup complete');

    // Check initial state
    const initialDataBalance = await mockDataCoin.balanceOf(deployer.address);
    console.log(`\nInitial DataCoin balance: ${ethers.formatUnits(initialDataBalance, 18)}`);

    try {
        const buyAccessTx = await fixedDao.buyAccess(paymentAmount, deployer.address);
        const receipt = await buyAccessTx.wait();
        
        console.log(`✅ buyAccess successful! Hash: ${buyAccessTx.hash}`);
        console.log(`Gas used: ${receipt.gasUsed}`);

        // Check results
        const finalDataBalance = await mockDataCoin.balanceOf(deployer.address);
        const hasAccess = await fixedDao.hasAccess(deployer.address);
        const expiry = await fixedDao.expiry(deployer.address);
        
        const rewardGained = finalDataBalance - initialDataBalance;
        
        console.log('\n📊 Results:');
        console.log(`User has access: ${hasAccess}`);
        console.log(`Access expires: ${new Date(Number(expiry) * 1000).toISOString()}`);
        console.log(`DataCoin balance: ${ethers.formatUnits(finalDataBalance, 18)}`);
        console.log(`Rewards gained: ${ethers.formatUnits(rewardGained, 18)}`);
        console.log(`Expected rewards: ${ethers.formatUnits(calculatedReward, 18)}`);
        
        if (rewardGained === calculatedReward) {
            console.log('✅ Reward calculation is perfect!');
        }

        console.log('\n🎉 SUCCESS! DAO buyAccess function is now working correctly!');
        console.log(`\n📋 Final Working DAO Address: ${fixedDaoAddress}`);

    } catch (error) {
        console.error(`❌ buyAccess failed: ${error.message}`);
        
        // If still failing, the issue might be elsewhere
        console.log('\nIf this is still a MINT_FAIL, the issue might be:');
        console.log('1. Gas limit in the low-level call');
        console.log('2. Some other contract state issue');
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });