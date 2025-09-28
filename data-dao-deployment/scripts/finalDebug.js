require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🔍 Final Debug: Isolating the exact issue in buyAccess...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const TEST_TOKEN_ADDRESS = "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4";
    const CORRECT_DAO_ADDRESS = "0xC1d5F7Cc53E5043BB09bD64FF7471339fe78F396";

    // Get contract instances
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const TestToken = await ethers.getContractFactory("TestToken");
    const testToken = TestToken.attach(TEST_TOKEN_ADDRESS);
    
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    const fixedDao = FixedDAO.attach(CORRECT_DAO_ADDRESS);

    console.log('✅ Contract instances loaded\n');

    // Check DAO configuration
    const secondsPerToken = await fixedDao.secondsPerToken();
    const rewardRate = await fixedDao.rewardRate();
    
    console.log('📊 DAO Configuration:');
    console.log(`Seconds per token: ${ethers.formatUnits(secondsPerToken, 18)}`);
    console.log(`Reward rate: ${ethers.formatUnits(rewardRate, 18)}\n`);

    // Test calculation step by step
    const paymentAmount = ethers.parseUnits("10", 18); // Use smaller amount to minimize risks
    console.log(`🧮 Testing calculation with ${ethers.formatUnits(paymentAmount, 18)} tokens:`);
    
    // Duration calculation
    const duration = paymentAmount * secondsPerToken / ethers.parseUnits("1", 18);
    console.log(`Duration: ${duration} seconds`);
    
    // Reward calculation (this is the normalized calculation from the contract)
    const normalized = paymentAmount; // 18 decimals, no normalization needed
    const reward = normalized * rewardRate / ethers.parseUnits("1", 18);
    console.log(`Normalized: ${ethers.formatUnits(normalized, 18)}`);
    console.log(`Reward calculation: ${ethers.formatUnits(normalized, 18)} * ${ethers.formatUnits(rewardRate, 18)} = ${ethers.formatUnits(reward, 18)}\n`);

    // Check if reward is reasonable
    if (reward === 0n) {
        console.log('❌ Reward is zero - this might cause the mint to fail');
        return;
    }

    // Test ownerMint with the exact same amount
    console.log('🧪 Testing ownerMint with calculated reward amount...');
    try {
        const ownerMintTx = await fixedDao.ownerMint(deployer.address, reward);
        await ownerMintTx.wait();
        console.log('✅ ownerMint with calculated reward successful\n');
    } catch (error) {
        console.error(`❌ ownerMint failed: ${error.message}`);
        console.log('This suggests the reward amount itself is the problem\n');
    }

    // Now let's try to simulate the exact conditions in buyAccess
    console.log('🎯 Setting up for buyAccess test...');
    
    // Ensure we have test tokens
    const balance = await testToken.balanceOf(deployer.address);
    if (balance < paymentAmount) {
        console.log('Minting test tokens...');
        const mintTx = await testToken.mint(deployer.address, paymentAmount);
        await mintTx.wait();
    }

    // Approve
    console.log('Approving DAO...');
    const approveTx = await testToken.approve(CORRECT_DAO_ADDRESS, paymentAmount);
    await approveTx.wait();

    console.log('✅ Setup complete\n');

    // Try buyAccess with reduced amount
    console.log('🎯 Attempting buyAccess...');
    try {
        // Try to get more specific error information
        const estimatedGas = await fixedDao.buyAccess.estimateGas(paymentAmount, deployer.address);
        console.log(`Gas estimate: ${estimatedGas}`);

        const buyAccessTx = await fixedDao.buyAccess(paymentAmount, deployer.address);
        const receipt = await buyAccessTx.wait();

        console.log('✅ buyAccess successful!');
        console.log(`Transaction: ${buyAccessTx.hash}`);
        console.log(`Gas used: ${receipt.gasUsed}`);

        // Check final states
        const hasAccess = await fixedDao.hasAccess(deployer.address);
        const expiry = await fixedDao.expiry(deployer.address);
        const finalBalance = await mockDataCoin.balanceOf(deployer.address);

        console.log('\n📊 Results:');
        console.log(`Has access: ${hasAccess}`);
        console.log(`Expires: ${new Date(Number(expiry) * 1000).toISOString()}`);
        console.log(`Final DataCoin balance: ${ethers.formatUnits(finalBalance, 18)}`);

    } catch (error) {
        console.error(`❌ buyAccess failed: ${error.message}`);
        
        // If it's a MINT_FAIL, let's examine the reward calculation more closely
        if (error.message.includes("MINT_FAIL")) {
            console.log('\n🔍 MINT_FAIL analysis:');
            console.log('The low-level call is failing. Possible causes:');
            console.log('1. Reward amount is invalid (too large, zero, etc.)');
            console.log('2. Gas limit issues in low-level call');
            console.log('3. Reentrancy or state issues');
            
            console.log(`\nReward amount being passed: ${reward}`);
            console.log(`Reward amount in ether: ${ethers.formatUnits(reward, 18)}`);
            
            // Let's check the total supply limits
            const totalSupply = await mockDataCoin.totalSupply();
            const maxSupply = await mockDataCoin.MAX_SUPPLY();
            console.log(`Current supply: ${ethers.formatUnits(totalSupply, 18)}`);
            console.log(`Max supply: ${ethers.formatUnits(maxSupply, 18)}`);
            console.log(`Would exceed max supply: ${totalSupply + reward > maxSupply}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });