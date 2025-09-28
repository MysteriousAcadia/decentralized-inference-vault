require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🔍 Debugging buyAccess function step by step...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const TEST_TOKEN_ADDRESS = "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4";
    const FIXED_DAO_ADDRESS = "0x4d4d65aea0dEf662aB50055266483F64FfCf0623";

    // Get contract instances
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(TEST_TOKEN_ADDRESS);
    
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    const fixedDao = FixedDAO.attach(FIXED_DAO_ADDRESS);

    console.log('📋 Contract instances loaded\n');

    // Check current DAO configuration
    console.log('🔍 Current DAO configuration:');
    const secondsPerToken = await fixedDao.secondsPerToken();
    const rewardRate = await fixedDao.rewardRate();
    const paymentToken = await fixedDao.paymentToken();
    const rewardToken = await fixedDao.rewardToken();
    
    console.log(`Seconds per token: ${ethers.formatUnits(secondsPerToken, 18)}`);
    console.log(`Reward rate: ${ethers.formatUnits(rewardRate, 18)}`);
    console.log(`Payment token: ${paymentToken}`);
    console.log(`Reward token: ${rewardToken}`);

    // Test payment calculation
    const paymentAmount = ethers.parseUnits("100", 18); // 100 tokens
    console.log(`\n💰 Testing with payment: ${ethers.formatUnits(paymentAmount, 18)} tokens`);
    
    // Calculate expected duration
    const expectedDuration = paymentAmount * secondsPerToken;
    console.log(`Expected duration: ${expectedDuration} seconds`);
    
    // Calculate expected reward
    const normalized = paymentAmount; // 18 decimals, so no normalization needed
    const expectedReward = normalized * rewardRate / (10n ** 18n); // Adjust for rate scaling
    console.log(`Expected reward: ${ethers.formatUnits(expectedReward, 18)} DataCoins`);

    // Give deployer some test tokens and approve
    console.log(`\n💸 Setting up payment tokens...`);
    
    // Check current balance
    let balance = await testToken.balanceOf(deployer.address);
    console.log(`Current test token balance: ${ethers.formatUnits(balance, 18)}`);
    
    if (balance < paymentAmount) {
        console.log('Minting more test tokens...');
        const mintTx = await testToken.mint(deployer.address, paymentAmount);
        await mintTx.wait();
        balance = await testToken.balanceOf(deployer.address);
        console.log(`New balance: ${ethers.formatUnits(balance, 18)}`);
    }

    // Approve
    console.log('Approving DAO to spend tokens...');
    const approveTx = await testToken.approve(FIXED_DAO_ADDRESS, paymentAmount);
    await approveTx.wait();
    const allowance = await testToken.allowance(deployer.address, FIXED_DAO_ADDRESS);
    console.log(`Allowance: ${ethers.formatUnits(allowance, 18)}`);

    // Test individual components of buyAccess
    console.log(`\n🧪 Testing buyAccess components...`);

    // Check initial states
    const initialAccess = await fixedDao.hasAccess(deployer.address);
    const initialDataBalance = await mockDataCoin.balanceOf(deployer.address);
    const initialTestBalance = await testToken.balanceOf(deployer.address);
    
    console.log(`Initial access: ${initialAccess}`);
    console.log(`Initial DataCoin balance: ${ethers.formatUnits(initialDataBalance, 18)}`);
    console.log(`Initial TestToken balance: ${ethers.formatUnits(initialTestBalance, 18)}`);

    // Now try buyAccess
    console.log(`\n🎯 Calling buyAccess...`);
    try {
        // Estimate gas first
        const gasEstimate = await fixedDao.buyAccess.estimateGas(paymentAmount, deployer.address);
        console.log(`Gas estimate: ${gasEstimate}`);
        
        const buyAccessTx = await fixedDao.buyAccess(paymentAmount, deployer.address, {
            gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        });
        const receipt = await buyAccessTx.wait();
        
        console.log(`✅ buyAccess successful! Gas used: ${receipt.gasUsed}`);
        
        // Check final states
        const finalAccess = await fixedDao.hasAccess(deployer.address);
        const finalDataBalance = await mockDataCoin.balanceOf(deployer.address);
        const finalTestBalance = await testToken.balanceOf(deployer.address);
        const expiry = await fixedDao.expiry(deployer.address);
        
        console.log(`\n📊 Final states:`);
        console.log(`Final access: ${finalAccess}`);
        console.log(`Final DataCoin balance: ${ethers.formatUnits(finalDataBalance, 18)}`);
        console.log(`Final TestToken balance: ${ethers.formatUnits(finalTestBalance, 18)}`);
        console.log(`Access expires: ${new Date(Number(expiry) * 1000).toISOString()}`);
        
        const rewardGained = finalDataBalance - initialDataBalance;
        console.log(`Reward gained: ${ethers.formatUnits(rewardGained, 18)} DataCoins`);
        
    } catch (error) {
        console.error(`❌ buyAccess failed: ${error.message}`);
        
        // Try to get more details about the error
        if (error.message.includes("MINT_FAIL")) {
            console.log('\n🔍 MINT_FAIL detected. Let me check the reward calculation...');
            
            // Manual calculation
            console.log(`Payment amount: ${paymentAmount}`);
            console.log(`Seconds per token: ${secondsPerToken}`);
            console.log(`Reward rate: ${rewardRate}`);
            
            const duration = paymentAmount * secondsPerToken;
            console.log(`Duration calculation: ${duration} seconds`);
            
            // Check if the issue is with zero reward
            const normalized = paymentAmount; // Assuming 18 decimals
            const reward = normalized * rewardRate; // This might overflow!
            console.log(`Normalized: ${normalized}`);
            console.log(`Raw reward calc: ${reward}`);
            
            if (reward === 0n) {
                console.log('❌ Reward is zero! This might be the issue.');
            } else if (reward > ethers.MaxUint256) {
                console.log('❌ Reward calculation overflows!');
            } else {
                console.log(`Calculated reward: ${ethers.formatUnits(reward, 18)}`);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });