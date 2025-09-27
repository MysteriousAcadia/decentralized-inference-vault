# DIV Platform Smart Contracts

A comprehensive suite of smart contracts for the **Decentralized Inference Vault (DIV)** platform - a commission-free, token-gated Model-as-a-Service (MaaS) infrastructure.

## 🏗️ Architecture Overview

The DIV platform consists of three core smart contracts:

### 1. ModelAccessToken.sol

- **Purpose**: ERC-20 token representing Data DAO membership
- **Features**:
  - Token-gated access control for AI models
  - Configurable access thresholds (basic & premium tiers)
  - Public minting with configurable pricing
  - Role-based access control (ADMIN, MINTER, PAUSER)
  - Pausable functionality for emergency stops

### 2. ModelVault.sol

- **Purpose**: Central registry for AI model metadata and management
- **Features**:
  - Model registration with IPFS/Filecoin storage references
  - Pricing and access control management
  - Model categorization (Language, Image, Audio, Video, etc.)
  - Usage analytics and inference tracking
  - Commission-free operation (0% platform fees by default)

### 3. PaymentStream.sol

- **Purpose**: Direct P2P payment settlement between users and model owners
- **Features**:
  - Multi-token support (ETH + ERC-20 tokens)
  - Commission-free payments (configurable platform fees)
  - User balance management with deposits/withdrawals
  - Cross-chain payment compatibility (via Synapse integration)
  - Real-time payment processing for inference services

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/div-platform/contracts.git
   cd contracts
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Compile contracts**

   ```bash
   npm run compile
   ```

4. **Run tests**

   ```bash
   npm test
   ```

5. **Deploy to local network**

   ```bash
   # Terminal 1: Start local Hardhat node
   npm run node

   # Terminal 2: Deploy contracts
   npm run deploy:local
   ```

## 📋 Contract Specifications

### ModelAccessToken

```solidity
// Constructor parameters
constructor(
    string memory _name,           // Token name
    string memory _symbol,         // Token symbol
    string memory _modelId,        // Unique model identifier
    string memory _modelName,      // Human-readable model name
    string memory _modelDescription, // Model description
    address _modelOwner,           // Model owner address
    uint256 _maxSupply,           // Maximum token supply
    uint256 _accessThreshold,     // Minimum tokens for basic access
    uint256 _premiumThreshold     // Minimum tokens for premium access
)
```

**Key Functions:**

- `mint(address to, uint256 amount)` - Mint tokens (MINTER_ROLE)
- `publicMint(uint256 amount)` - Public token purchase
- `hasAccess(address user)` - Check basic access
- `hasPremiumAccess(address user)` - Check premium access
- `setAccessThreshold(uint256 threshold)` - Update access requirements

### ModelVault

```solidity
// Model registration
function registerModel(
    bytes32 modelId,              // Generated model identifier
    string memory cid,            // IPFS CID of encrypted model
    address tokenContract,        // Associated access token
    uint256 pricePerInference,    // Cost per inference in wei
    ModelCategory category,       // Model category enum
    string[] memory tags,         // Searchable tags
    string memory version,        // Model version
    uint256 minTokenBalance       // Required token balance for access
)
```

**Key Functions:**

- `registerModel(...)` - Register new AI model
- `updatePrice(bytes32 modelId, uint256 newPrice)` - Update pricing
- `deactivateModel(bytes32 modelId)` - Temporarily disable model
- `getModelInfo(bytes32 modelId)` - Retrieve model metadata
- `hasAccess(bytes32 modelId, address user)` - Verify user access

### PaymentStream

```solidity
// Payment processing
function processPayment(
    bytes32 modelId,              // Target model identifier
    address user,                 // User making payment
    address modelOwner,           // Model owner receiving payment
    uint256 amount,               // Payment amount
    address token,                // Token address (0x0 for ETH)
    string memory inferenceId     // Optional inference identifier
)
```

**Key Functions:**

- `deposit()` / `depositToken(address token, uint256 amount)` - Add funds
- `withdraw(uint256 amount)` / `withdrawToken(address token, uint256 amount)` - Withdraw funds
- `processPayment(...)` - Execute inference payment
- `addSupportedToken(...)` - Add new payment token
- `getBalance(address user)` - Check user balance

## 🧪 Testing

The project includes comprehensive test coverage (target: >90%) with multiple test suites:

### Test Categories

1. **Unit Tests** - Individual contract functionality

   ```bash
   npm test test/ModelAccessToken.test.js
   npm test test/ModelVault.test.js
   npm test test/PaymentStream.test.js
   ```

2. **Integration Tests** - Cross-contract interactions

   ```bash
   npm test test/Integration.test.js
   ```

3. **Gas Analysis** - Transaction cost optimization

   ```bash
   npm run test:gas
   ```

4. **Coverage Report** - Code coverage analysis
   ```bash
   npm run test:coverage
   ```

### Test Scenarios Covered

- ✅ Token minting and access control
- ✅ Model registration and lifecycle management
- ✅ Payment processing (ETH + ERC-20)
- ✅ Multi-user marketplace interactions
- ✅ Platform fee distribution
- ✅ Access control integration
- ✅ Edge cases and error handling
- ✅ Pause/unpause functionality
- ✅ Role-based permissions

## 🚀 Deployment Guide

### Network Configuration

The contracts support deployment to multiple networks:

```javascript
// hardhat.config.js networks
networks: {
  localhost: "http://127.0.0.1:8545",
  sepolia: process.env.SEPOLIA_URL,
  mainnet: process.env.MAINNET_URL,
  polygon: process.env.POLYGON_URL,
  arbitrum: process.env.ARBITRUM_URL
}
```

### Deployment Scripts

1. **Full Platform Deployment**

   ```bash
   # Deploy all contracts + demo model
   npm run deploy:sepolia
   ```

2. **Individual Model Deployment**
   ```bash
   # Deploy new model to existing platform
   MODEL_VAULT_ADDRESS=0x... npm run deploy-model:sepolia
   ```

### Environment Variables

Create a `.env` file with:

```bash
# Network URLs
SEPOLIA_URL="https://sepolia.infura.io/v3/YOUR-PROJECT-ID"
MAINNET_URL="https://mainnet.infura.io/v3/YOUR-PROJECT-ID"
POLYGON_URL="https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID"
ARBITRUM_URL="https://arbitrum-mainnet.infura.io/v3/YOUR-PROJECT-ID"

# Deployment account
PRIVATE_KEY="your-private-key-here"

# Contract verification
ETHERSCAN_API_KEY="your-etherscan-api-key"
POLYGONSCAN_API_KEY="your-polygonscan-api-key"
ARBISCAN_API_KEY="your-arbiscan-api-key"

# Model deployment
MODEL_VAULT_ADDRESS="deployed-vault-contract-address"
```

### Post-Deployment Steps

1. **Verify contracts on block explorer**

   ```bash
   npm run verify:sepolia DEPLOYED_ADDRESS "constructor" "args"
   ```

2. **Configure platform settings**

   - Set platform fees (if desired)
   - Grant OPERATOR_ROLE to PaymentStream
   - Add supported payment tokens

3. **Register models**
   - Deploy ModelAccessToken for each AI model
   - Register models in ModelVault
   - Configure access thresholds and pricing

## 🔐 Security Considerations

### Implemented Security Measures

1. **Access Control**

   - OpenZeppelin's `AccessControl` for role management
   - Multi-signature support for sensitive operations
   - Time-locked administrative functions

2. **Reentrancy Protection**

   - `ReentrancyGuard` on all state-changing functions
   - Checks-Effects-Interactions pattern

3. **Pausable Operations**

   - Emergency pause functionality
   - Granular pause controls per contract

4. **Input Validation**
   - Comprehensive parameter validation
   - Custom error messages for clarity

### Security Audit Checklist

- [ ] **Smart Contract Audit** - Professional security review
- [ ] **Gas Optimization** - Efficient contract execution
- [ ] **Access Control Review** - Role and permission verification
- [ ] **Economic Model Analysis** - Tokenomics and incentive alignment
- [ ] **Integration Testing** - End-to-end workflow validation

## 📊 Gas Optimization

### Estimated Gas Costs

| Operation                   | Estimated Gas | Notes                   |
| --------------------------- | ------------- | ----------------------- |
| ModelAccessToken deployment | ~2,500,000    | One-time cost           |
| ModelVault deployment       | ~3,000,000    | One-time cost           |
| PaymentStream deployment    | ~3,500,000    | One-time cost           |
| Model registration          | ~150,000      | Per model               |
| Token minting               | ~50,000       | Per mint transaction    |
| Payment processing          | ~80,000       | Per inference payment   |
| Access check                | ~30,000       | Per access verification |

### Optimization Strategies

1. **Batch Operations** - Group multiple actions
2. **Storage Optimization** - Efficient data packing
3. **Layer 2 Deployment** - Use Polygon/Arbitrum for lower fees
4. **Meta-transactions** - Gasless user interactions

## 🤝 Integration Guide

### Frontend Integration

```javascript
// Web3 setup example
import { ethers } from "ethers";
import ModelVaultABI from "./abis/ModelVault.json";
import PaymentStreamABI from "./abis/PaymentStream.json";

// Contract instances
const modelVault = new ethers.Contract(VAULT_ADDRESS, ModelVaultABI, signer);
const paymentStream = new ethers.Contract(
  PAYMENT_ADDRESS,
  PaymentStreamABI,
  signer
);

// Check user access
const hasAccess = await modelVault.hasAccess(modelId, userAddress);

// Process payment
const tx = await paymentStream.processPayment(
  modelId,
  userAddress,
  modelOwner,
  amount,
  tokenAddress,
  inferenceId
);
```

### Backend Integration

```javascript
// Inference service integration
class InferenceService {
  async processRequest(modelId, userAddress, inputData) {
    // 1. Verify user access
    const hasAccess = await this.checkAccess(modelId, userAddress);
    if (!hasAccess) throw new Error("Insufficient access tokens");

    // 2. Process payment
    const paymentId = await this.processPayment(modelId, userAddress);

    // 3. Execute inference
    const result = await this.runInference(modelId, inputData);

    // 4. Return result
    return { result, paymentId };
  }
}
```

## 🔮 Roadmap

### Phase 1: Core Platform ✅

- [x] Smart contract development
- [x] Comprehensive testing suite
- [x] Deployment scripts
- [x] Security audit preparation

### Phase 2: Integration (In Progress)

- [ ] Lighthouse encryption integration
- [ ] Fluence VM inference engine
- [ ] Synapse cross-chain payments
- [ ] Frontend dApp development

### Phase 3: Advanced Features

- [ ] Governance token (DIV)
- [ ] DAO voting mechanisms
- [ ] Advanced analytics dashboard
- [ ] Multi-chain deployment

### Phase 4: Ecosystem Growth

- [ ] Developer SDK release
- [ ] Third-party integrations
- [ ] Model marketplace UI
- [ ] Community incentives

## 📚 Resources

### Documentation

- [Technical Architecture](../TECHNICAL_PRD_ARCHITECTURE.md)
- [API Reference](./docs/api-reference.md)
- [Integration Guide](./docs/integration-guide.md)
- [Security Guide](./docs/security-guide.md)

### External Dependencies

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Lighthouse Storage](https://docs.lighthouse.storage/)
- [Fluence Network](https://docs.fluence.network/)
- [Synapse Protocol](https://docs.synapseprotocol.com/)

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Write tests** for your changes
4. **Ensure all tests pass** (`npm test`)
5. **Submit a pull request**

### Development Guidelines

- Follow Solidity style guidelines
- Write comprehensive tests (aim for >90% coverage)
- Document all public functions with NatSpec
- Use custom errors for gas optimization
- Implement proper access controls

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## ⚠️ Disclaimer

These smart contracts are experimental software. Use at your own risk. The authors are not responsible for any loss of funds or other damages that may occur from using this software.

---

**Built with ❤️ by the DIV Platform Team**

For support, join our [Discord](https://discord.gg/div-platform) or create an issue on GitHub.
