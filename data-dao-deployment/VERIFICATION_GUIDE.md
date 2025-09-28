# Contract Verification Guide

This guide explains how to verify your deployed contracts on Etherscan and other block explorers.

## 📋 Prerequisites

### 1. Get API Keys

You need API keys from the relevant block explorers:

#### Ethereum Networks

- **Etherscan**: Get your API key from [etherscan.io/apis](https://etherscan.io/apis)
- Add to `.env`: `ETHERSCAN_API_KEY=your_key_here`

#### Polygon Networks

- **Polygonscan**: Get your API key from [polygonscan.com/apis](https://polygonscan.com/apis)
- Add to `.env`: `POLYGONSCAN_API_KEY=your_key_here`

#### Base Networks

- **Basescan**: Get your API key from [basescan.org/apis](https://basescan.org/apis)
- Add to `.env`: `BASESCAN_API_KEY=your_key_here`

### 2. Update Environment Variables

Add these to your `.env` file:

```bash
# Etherscan API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
OPTIMISM_API_KEY=your_optimism_api_key
```

## 🚀 Verification Methods

### Method 1: Quick Verification (Recommended)

Use the pre-configured quick verification script:

```bash
# Verify all contracts on Sepolia
npm run verify:quick:sepolia

# Verify specific contract on Sepolia
npm run verify:dao-factory:sepolia
npm run verify:test-token:sepolia

# Verify all contracts on Amoy
npm run verify:quick:amoy
```

### Method 2: Comprehensive Verification

Use the full verification script with detailed logging:

```bash
# Verify all contracts with detailed output
npm run verify:all:sepolia
npm run verify:all:amoy
```

### Method 3: Manual Hardhat Verification

Verify contracts manually using Hardhat's built-in verify command:

```bash
# CommunityAccessDAOFactory on Sepolia
npx hardhat verify --network sepolia 0xEB37A065E20D0BB04b161B1d2985065Fb242866a "0x0000000000000000000000000000000000000000" "0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990"

# TestToken on Sepolia
npx hardhat verify --network sepolia 0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4 "Test Payment Token" "TPT"
```

## 📍 Current Deployments

### Sepolia Testnet

#### CommunityAccessDAOFactory

- **Address**: `0xEB37A065E20D0BB04b161B1d2985065Fb242866a`
- **Constructor Args**:
  - `defaultTreasury`: `0x0000000000000000000000000000000000000000` (Zero address)
  - `dataCoinFactory`: `0xC7Bc3432B0CcfeFb4237172340Cd8935f95f2990`

#### TestToken

- **Address**: `0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4`
- **Constructor Args**:
  - `name`: `"Test Payment Token"`
  - `symbol`: `"TPT"`

## 🛠️ Available NPM Scripts

```bash
# Quick verification (auto-detects contracts)
npm run verify:quick:sepolia
npm run verify:quick:amoy

# Verify all contracts with detailed logging
npm run verify:all:sepolia
npm run verify:all:amoy

# Verify specific contracts
npm run verify:dao-factory:sepolia
npm run verify:test-token:sepolia

# Functional verification (includes contract interaction tests)
npm run verify:dao-factory:functional:sepolia
```

## 🔧 Verification Process

### What happens during verification:

1. **Contract Detection**: Script identifies deployed contracts for the network
2. **API Key Check**: Validates that the correct API key is available
3. **Source Code Upload**: Compiles and uploads contract source code
4. **Constructor Verification**: Matches constructor arguments with deployment
5. **Bytecode Matching**: Verifies deployed bytecode matches compiled code
6. **Explorer Integration**: Contract becomes readable on block explorer

### Success Indicators:

- ✅ Green checkmarks for successful verifications
- 🔍 Explorer links to view verified contracts
- 📊 Summary of verification results

## 🐛 Troubleshooting

### Common Issues:

#### "Invalid API Key"

- Make sure you have the correct API key for the network
- Check that the key is properly set in your `.env` file
- Verify the key hasn't expired

#### "Constructor arguments mismatch"

- Double-check the constructor arguments in the verification script
- Ensure arguments match exactly what was used during deployment
- Check the deployment transaction on the block explorer

#### "Already verified"

- This is actually good news! The contract is already verified
- The script will show this as a success

#### "Compilation failed"

- Ensure your Solidity version matches what was used for deployment
- Check that all dependencies are installed
- Verify the contract source code hasn't changed

### Getting Help:

1. **Check the deployment transaction** on the block explorer to see the exact constructor arguments
2. **Compare bytecode** between local compilation and deployed contract
3. **Use the functional verification** scripts to test contract interaction

## 📚 Explorer Links

### Sepolia (After Verification)

- [CommunityAccessDAOFactory](https://sepolia.etherscan.io/address/0xEB37A065E20D0BB04b161B1d2985065Fb242866a#code)
- [TestToken](https://sepolia.etherscan.io/address/0xb4452088fAa8920b026Cd52Bb7eca958f984B1D4#code)

## 🎯 Next Steps

After successful verification:

1. **Contract Source Code** becomes publicly readable on the explorer
2. **Users can interact** directly through the explorer interface
3. **Contract ABI** is automatically available for frontend integration
4. **Enhanced trust** - users can audit the contract code
5. **Better debugging** - stack traces show source code instead of bytecode

## 💡 Pro Tips

- **Verify immediately** after deployment while the build environment is fresh
- **Save constructor arguments** during deployment for easy verification later
- **Use consistent Solidity versions** across development and deployment
- **Test on testnets first** before verifying mainnet contracts
- **Keep API keys secure** and don't commit them to version control

---

## 🔗 Quick Commands Reference

```bash
# One-liner to verify everything on Sepolia
npm run verify:quick:sepolia

# Check if verification worked
# Visit: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS#code

# Manual verification if automated scripts fail
npx hardhat verify --network sepolia CONTRACT_ADDRESS "constructor" "args"
```
