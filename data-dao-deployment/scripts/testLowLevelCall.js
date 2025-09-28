require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🔍 Testing Low-Level Call from DAO Contract...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const CORRECT_DAO_ADDRESS = "0xC1d5F7Cc53E5043BB09bD64FF7471339fe78F396";

    // Get contract instances
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    const fixedDao = FixedDAO.attach(CORRECT_DAO_ADDRESS);

    console.log('📋 Contract instances:');
    console.log(`MockDataCoin: ${MOCK_DATA_COIN_ADDRESS}`);
    console.log(`Fixed DAO: ${CORRECT_DAO_ADDRESS}\n`);

    // Verify permissions
    console.log('🔍 Checking permissions...');
    const hasMinterRole = await mockDataCoin.minters(CORRECT_DAO_ADDRESS);
    const isPaused = await mockDataCoin.mintingPaused();
    console.log(`DAO has minter role: ${hasMinterRole}`);
    console.log(`Minting paused: ${isPaused}\n`);

    // Test ownerMint function which also uses low-level call
    console.log('🧪 Testing ownerMint function (uses same low-level call)...');
    
    const initialBalance = await mockDataCoin.balanceOf(deployer.address);
    console.log(`Initial balance: ${ethers.formatUnits(initialBalance, 18)}`);

    try {
        const ownerMintTx = await fixedDao.ownerMint(deployer.address, ethers.parseUnits("5", 18));
        await ownerMintTx.wait();
        console.log('✅ ownerMint successful');

        const newBalance = await mockDataCoin.balanceOf(deployer.address);
        console.log(`New balance: ${ethers.formatUnits(newBalance, 18)}`);
        console.log(`Minted: ${ethers.formatUnits(newBalance - initialBalance, 18)}\n`);

    } catch (error) {
        console.error(`❌ ownerMint failed: ${error.message}\n`);
    }

    // Now let's create a test contract that isolates the buyAccess minting logic
    console.log('🏗️  Creating test contract to isolate the issue...');
    
    const TestMinting = await ethers.getContractFactory("TestMinting", {
        // Define inline contract
        bytecode: '',
        abi: []
    });

    // Create a simple test contract inline
    const testContractSource = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.23;
        
        contract TestMinting {
            address public dataCoin;
            
            constructor(address _dataCoin) {
                dataCoin = _dataCoin;
            }
            
            function testMint(address to, uint256 amount) external returns (bool success) {
                (bool ok, ) = address(dataCoin).call(
                    abi.encodeWithSignature("mint(address,uint256)", to, amount)
                );
                return ok;
            }
            
            function testMintWithSelector(address to, uint256 amount) external returns (bool success) {
                bytes4 selector = bytes4(keccak256("mint(address,uint256)"));
                (bool ok, ) = address(dataCoin).call(
                    abi.encodeWithSelector(selector, to, amount)
                );
                return ok;
            }
        }
    `;

    console.log('Creating TestMinting contract source...');
    await require('fs').promises.writeFile(
        '/Users/notanshuman/Projects/ethGlobal2025/tezos-cross-chain-resolver/data-dao-deployment/contracts/TestMinting.sol',
        testContractSource
    );

    console.log('Compiling...');
    await require('child_process').execSync('npx hardhat compile', { cwd: '/Users/notanshuman/Projects/ethGlobal2025/tezos-cross-chain-resolver/data-dao-deployment' });

    console.log('Deploying TestMinting...');
    const TestMintingFactory = await ethers.getContractFactory("TestMinting");
    const testMinting = await TestMintingFactory.deploy(MOCK_DATA_COIN_ADDRESS);
    await testMinting.waitForDeployment();
    const testMintingAddress = await testMinting.getAddress();
    
    console.log(`TestMinting deployed: ${testMintingAddress}`);

    // Grant minter role to test contract
    console.log('Granting minter role to TestMinting...');
    const MINTER_ROLE = await mockDataCoin.MINTER_ROLE();
    const grantTx = await mockDataCoin.grantRole(MINTER_ROLE, testMintingAddress);
    await grantTx.wait();

    // Test both methods
    console.log('\n🧪 Testing abi.encodeWithSignature...');
    try {
        const result1 = await testMinting.testMint(deployer.address, ethers.parseUnits("1", 18));
        console.log(`Result: ${result1}`);
    } catch (error) {
        console.error(`Failed: ${error.message}`);
    }

    console.log('🧪 Testing abi.encodeWithSelector...');
    try {
        const result2 = await testMinting.testMintWithSelector(deployer.address, ethers.parseUnits("1", 18));
        console.log(`Result: ${result2}`);
    } catch (error) {
        console.error(`Failed: ${error.message}`);
    }

    const finalBalance = await mockDataCoin.balanceOf(deployer.address);
    console.log(`\nFinal balance: ${ethers.formatUnits(finalBalance, 18)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });