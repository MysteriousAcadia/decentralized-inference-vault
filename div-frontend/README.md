# DIV Frontend - Decentralized Inference Vault

A React/Next.js frontend for the Decentralized Inference Vault (DIV) platform - the first commission-free, token-gated Model-as-a-Service (MaaS) inference platform.

## 🚀 Features

- **Landing Page**: Comprehensive overview of DIV's capabilities and architecture
- **Model Marketplace**: Browse and purchase access to AI models through DAO tokens
- **Inference Interface**: Submit requests to AI models with real-time chat interface
- **Model Upload**: Deploy your own AI models with encryption and token-gating
- **Dashboard**: Monitor model performance, revenue, and token holders
- **Wallet Integration**: Seamless Web3 wallet connection via Rainbow Kit
- **Multi-chain Support**: Built for Polygon with cross-chain capabilities

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Web3 Integration**: Rainbow Kit + Wagmi + Viem
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **Blockchain**: Polygon (with Polygon Amoy testnet support)

## 🏗️ Architecture Overview

The frontend integrates with three key decentralized infrastructure components:

1. **Lighthouse**: Encrypted storage and token-gated access control
2. **Fluence Network**: Serverless compute for AI inference
3. **Synapse Protocol**: Cross-chain USDC payments

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A WalletConnect Project ID

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your WalletConnect Project ID:

   ```
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id-here
   ```

   Get your project ID from [WalletConnect Cloud](https://cloud.walletconnect.com)

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` (or the port shown in your terminal)

## 📱 Pages & Components

### Core Pages

- `/` - Landing page with platform overview
- `/marketplace` - AI model marketplace
- `/inference` - Chat interface for AI models
- `/upload` - Upload and deploy new models
- `/dashboard` - Model owner analytics

### Key Components

- `Navbar` - Navigation with wallet connection
- `Hero` - Landing page hero section
- `Features` - Platform capabilities overview
- `HowItWorks` - Step-by-step process explanation
- `Architecture` - Technical infrastructure details
- `Footer` - Site-wide footer with links

## 🔧 Configuration

### Wagmi Configuration

Located in `src/config/wagmi.ts`:

- Supports Polygon mainnet and Polygon Amoy testnet
- Configured with WalletConnect v2
- Ready for additional chains

### Supported Networks

- **Polygon Mainnet** (Chain ID: 137)
- **Polygon Amoy** (Chain ID: 80002)

## 🎨 Styling

- **Design System**: Clean, modern interface with indigo/purple accents
- **Responsive**: Mobile-first design with Tailwind CSS
- **Components**: Reusable UI components with consistent styling
- **Icons**: Lucide React icon library

## 🔮 Wallet Integration

### Supported Wallets

- MetaMask
- Coinbase Wallet
- WalletConnect compatible wallets
- Rainbow Wallet
- And many more via Rainbow Kit

### Features

- One-click wallet connection
- Network switching
- Transaction signing
- Account management

## 📊 Mock Data

The application includes comprehensive mock data for development:

- Sample AI models with pricing and statistics
- Mock inference history
- Simulated user dashboards
- Example DAO token information

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 🧪 Future Enhancements

- **Chart Integration**: Real-time revenue and usage analytics
- **Advanced Filtering**: Enhanced model discovery
- **Batch Operations**: Multiple model management
- **Mobile App**: React Native implementation
- **Additional Chains**: Ethereum, Arbitrum, Optimism support
- **Web3 Storage**: IPFS integration for frontend hosting

## 📝 Environment Variables

| Variable                               | Description                    | Required |
| -------------------------------------- | ------------------------------ | -------- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud project ID | Yes      |
| `NEXT_PUBLIC_APP_NAME`                 | Application name               | No       |
| `NEXT_PUBLIC_APP_URL`                  | Application URL                | No       |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for the decentralized AI ecosystem
