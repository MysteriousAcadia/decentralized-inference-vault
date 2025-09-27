import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy } from 'wagmi/chains';

// Get a project ID from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id';

export const config = getDefaultConfig({
  appName: 'DIV - Decentralized Inference Vault',
  projectId,
  chains: [polygon, polygonAmoy],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export const SUPPORTED_CHAINS = {
  polygon: polygon.id,
  polygonAmoy: polygonAmoy.id,
} as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[keyof typeof SUPPORTED_CHAINS];