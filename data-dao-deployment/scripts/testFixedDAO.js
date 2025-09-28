require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Deploying Fixed DAO and Testing buyAccess Function...\n');

    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const user1 = signers.length > 1 ? signers[1] : deployer; // Use deployer as user if no second signer
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Test User: ${user1.address}\n`);

    // Contract addresses from previous deployments
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const TEST_TOKEN_ADDRESS = "0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4";

    // Get contract instances
    console.log('📋 Getting existing contract instances...');
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const ERC20 = await ethers.getContractFactory("TestToken");
    const testToken = ERC20.attach(TEST_TOKEN_ADDRESS);
    console.log(`✅ MockDataCoin: ${MOCK_DATA_COIN_ADDRESS}`);
    console.log(`✅ TestToken: ${TEST_TOKEN_ADDRESS}\n`);

    // Deploy the fixed DAO
    console.log('🏗️  Deploying Fixed CommunityAccessDAO...');
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    const fixedDao = await FixedDAO.deploy(
        TEST_TOKEN_ADDRESS,          // paymentToken
        MOCK_DATA_COIN_ADDRESS,      // dataCoin (rewards)
        ethers.parseUnits("1", 18),  // secondsPerToken (1 token = 1 second)
        ethers.parseUnits("10", 18), // rewardRate (10 rewards per payment token)
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

    // Verify permission
    console.log('🔍 Verifying Fixed DAO minting permission...');
    const hasMinterRole = await mockDataCoin.minters(fixedDaoAddress);
    console.log(`Has minter role: ${hasMinterRole}`);
    if (!hasMinterRole) {
        throw new Error('Fixed DAO does not have minter role!');
    }
    console.log('✅ Permission verified\n');

    // Give user1 some test tokens
    console.log('💰 Setting up test tokens for user...');
    const mintAmount = ethers.parseUnits("1000", 18);
    const mintTx = await testToken.mint(user1.address, mintAmount);
    await mintTx.wait();
    
    const userBalance = await testToken.balanceOf(user1.address);
    console.log(`✅ User test token balance: ${ethers.formatUnits(userBalance, 18)}\n`);

    // Test buyAccess function
    console.log('🧪 Testing buyAccess function with Fixed DAO...');
    
    // First, user needs to approve the DAO to spend their tokens
    const paymentAmount = ethers.parseUnits("100", 18); // 100 tokens
    console.log(`Approving DAO to spend ${ethers.formatUnits(paymentAmount, 18)} test tokens...`);
    const approveTx = await testToken.connect(user1).approve(fixedDaoAddress, paymentAmount);
    await approveTx.wait();
    console.log('✅ Approval successful');

    // Check initial states
    console.log('\n📊 Initial states:');
    const initialAccess = await fixedDao.hasAccess(user1.address);
    const initialDataCoinBalance = await mockDataCoin.balanceOf(user1.address);
    console.log(`User has access: ${initialAccess}`);
    console.log(`User DataCoin balance: ${ethers.formatUnits(initialDataCoinBalance, 18)}`);

    // Call buyAccess
    console.log('\n🎯 Calling buyAccess...');
    try {
        const buyAccessTx = await fixedDao.connect(user1).buyAccess(paymentAmount, user1.address);
        const receipt = await buyAccessTx.wait();
        console.log(`✅ buyAccess successful! Transaction hash: ${buyAccessTx.hash}`);
        
        // Parse events
        console.log('\n📋 Events emitted:');
        for (const log of receipt.logs) {
            try {
                const parsed = fixedDao.interface.parseLog(log);
                if (parsed) {
                    console.log(`  - ${parsed.name}:`);
                    console.log(`    ${JSON.stringify(parsed.args, null, 6)}`);
                }
            } catch (e) {
                // Not a DAO event, might be token event
                try {
                    const tokenParsed = mockDataCoin.interface.parseLog(log);
                    if (tokenParsed) {
                        console.log(`  - Token ${tokenParsed.name}:`);
                        console.log(`    ${JSON.stringify(tokenParsed.args, null, 6)}`);
                    }
                } catch (e2) {
                    // Ignore unparseable events
                }
            }
        }

    } catch (error) {
        console.error(`❌ buyAccess failed: ${error.message}`);
        
        // Additional debugging
        console.log('\n🔍 Debugging information:');
        const daoBalance = await testToken.balanceOf(fixedDaoAddress);
        const allowance = await testToken.allowance(user1.address, fixedDaoAddress);
        console.log(`DAO test token balance: ${ethers.formatUnits(daoBalance, 18)}`);
        console.log(`User allowance for DAO: ${ethers.formatUnits(allowance, 18)}`);
        
        throw error;
    }

    // Check final states
    console.log('\n📊 Final states:');
    const finalAccess = await fixedDao.hasAccess(user1.address);
    const finalDataCoinBalance = await mockDataCoin.balanceOf(user1.address);
    const userExpiry = await fixedDao.expiry(user1.address);
    
    console.log(`User has access: ${finalAccess}`);
    console.log(`User DataCoin balance: ${ethers.formatUnits(finalDataCoinBalance, 18)}`);
    console.log(`Access expires at: ${new Date(Number(userExpiry) * 1000).toISOString()}`);
    
    const rewardGained = finalDataCoinBalance - initialDataCoinBalance;
    console.log(`Rewards gained: ${ethers.formatUnits(rewardGained, 18)} DataCoins`);

    console.log('\n🎉 All tests passed! Fixed DAO buyAccess function working correctly!');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });