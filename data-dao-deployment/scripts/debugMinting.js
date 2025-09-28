require('dotenv').config();
const { ethers } = require('hardhat');

async function main() {
    console.log('🔍 Testing direct mint function to debug the issue...\n');

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Contract addresses
    const MOCK_DATA_COIN_ADDRESS = "0xc2871125d534e75089f3ac1fB59Fe67632F3a89A";
    const FIXED_DAO_ADDRESS = "0x4d4d65aea0dEf662aB50055266483F64FfCf0623";

    // Get contract instances
    const MockDataCoin = await ethers.getContractFactory("MockDataCoin");
    const mockDataCoin = MockDataCoin.attach(MOCK_DATA_COIN_ADDRESS);
    
    const FixedDAO = await ethers.getContractFactory("FixedCommunityAccessDAO");
    const fixedDao = FixedDAO.attach(FIXED_DAO_ADDRESS);

    console.log('📋 Contract instances loaded');
    console.log(`MockDataCoin: ${MOCK_DATA_COIN_ADDRESS}`);
    console.log(`Fixed DAO: ${FIXED_DAO_ADDRESS}\n`);

    // Check permissions
    console.log('🔍 Checking permissions...');
    const hasMinterRole = await mockDataCoin.minters(FIXED_DAO_ADDRESS);
    console.log(`Fixed DAO has minter role: ${hasMinterRole}`);
    
    const isPaused = await mockDataCoin.mintingPaused();
    console.log(`Minting paused: ${isPaused}\n`);

    // Test 1: Direct mint from MockDataCoin (should work)
    console.log('🧪 Test 1: Direct mint from MockDataCoin...');
    try {
        const directMintTx = await mockDataCoin.mint(deployer.address, ethers.parseUnits("1", 18));
        await directMintTx.wait();
        console.log('✅ Direct mint successful');
    } catch (error) {
        console.error(`❌ Direct mint failed: ${error.message}`);
    }

    // Test 2: Owner mint from Fixed DAO (should work)
    console.log('\n🧪 Test 2: Owner mint from Fixed DAO...');
    try {
        const ownerMintTx = await fixedDao.ownerMint(deployer.address, ethers.parseUnits("1", 18));
        await ownerMintTx.wait();
        console.log('✅ Owner mint successful');
    } catch (error) {
        console.error(`❌ Owner mint failed: ${error.message}`);
    }

    // Test 3: Check if abi.encodeWithSignature works correctly
    console.log('\n🧪 Test 3: Testing function encoding...');
    
    // Test the encoding we're using
    const functionSig = "mint(address,uint256)";
    const recipient = deployer.address;
    const amount = ethers.parseUnits("1", 18);
    
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes4", "address", "uint256"],
        [ethers.id(functionSig).substring(0, 10), recipient, amount]
    );
    console.log(`Function signature: ${functionSig}`);
    console.log(`Function selector: ${ethers.id(functionSig).substring(0, 10)}`);
    console.log(`Encoded data length: ${encodedData.length}`);

    // Let's also try with abi.encodeWithSelector approach
    const mintInterface = new ethers.Interface(["function mint(address to, uint256 amount)"]);
    const encodedCall = mintInterface.encodeFunctionData("mint", [recipient, amount]);
    console.log(`ABI encoded call: ${encodedCall}`);
    
    // Test 4: Manual low-level call from deployer
    console.log('\n🧪 Test 4: Manual low-level call...');
    try {
        const tx = await deployer.sendTransaction({
            to: MOCK_DATA_COIN_ADDRESS,
            data: encodedCall
        });
        await tx.wait();
        console.log('✅ Manual low-level call successful');
    } catch (error) {
        console.error(`❌ Manual low-level call failed: ${error.message}`);
    }

    // Test 5: Check MockDataCoin balance and total supply
    console.log('\n📊 Final status:');
    const balance = await mockDataCoin.balanceOf(deployer.address);
    const totalSupply = await mockDataCoin.totalSupply();
    const maxSupply = await mockDataCoin.MAX_SUPPLY();
    
    console.log(`Deployer balance: ${ethers.formatUnits(balance, 18)}`);
    console.log(`Total supply: ${ethers.formatUnits(totalSupply, 18)}`);
    console.log(`Max supply: ${ethers.formatUnits(maxSupply, 18)}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });