import { ethers } from "ethers";

export interface ModelMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author: string;
  license: string;
  modelType: "language" | "image" | "code" | "audio" | "video" | "other";
  framework: "pytorch" | "tensorflow" | "onnx" | "huggingface" | "other";
  inputFormat: string;
  outputFormat: string;
  maxInputLength?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

export interface AccessConfiguration {
  tokenName: string;
  tokenSymbol: string;
  pricePerInference: string; // In USDC
  minimumTokensForAccess: string;
  initialTokenSupply: string;
  maxSupply?: string;
  mintable: boolean;
  burnable: boolean;
}

export interface DataCoinEconomics {
  creatorAllocationPct: string; // Percentage (0-100)
  creatorVestingDays: string; // Vesting period in days
  contributorsAllocationPct: string; // Percentage (0-100)
  liquidityAllocationPct: string; // Percentage (0-100)
  lockToken?: string; // Address of token to lock (optional)
  lockAmount?: string; // Amount of tokens to lock
  tokenURI?: string; // Metadata URI for DataCoin (optional)
  salt?: string; // Deterministic salt for deployment (auto-generated)
}

export interface AccessMonetization {
  paymentToken: string; // Address of payment token (e.g., USDC)
  secondsPerToken: string; // Seconds of access per 1 payment token
  rewardRate: string; // DataCoin per payment token unit
  treasury?: string; // Treasury address (defaults to user address)
}

export interface DeploymentConfiguration {
  chain: "polygon" | "ethereum" | "arbitrum" | "optimism";
  network: "mainnet" | "testnet";
  lighthouseApiKey: string;
  enableEncryption: boolean;
  backupToFilecoin: boolean;
  enableMonitoring: boolean;
}

export interface ModelUploadState {
  // Upload progress
  currentStep: 1 | 2 | 3;
  isUploading: boolean;
  uploadProgress: number;

  // File information
  selectedFile: File | null;
  fileCid?: string;
  fileSize?: number;

  // Model metadata
  metadata: ModelMetadata;

  // Access control
  accessConfig: AccessConfiguration;

  // DataCoin economics
  dataCoinEconomics: DataCoinEconomics;

  // Access monetization
  accessMonetization: AccessMonetization;

  // Deployment settings
  deploymentConfig: DeploymentConfiguration;

  // Smart contract information
  daoAddress?: string;
  dataCoinAddress?: string;
  vaultRegistrationTx?: string;

  // Error handling
  errors: Record<string, string>;

  // Status
  status:
    | "idle"
    | "uploading"
    | "encrypting"
    | "deploying-token"
    | "deploying-dao"
    | "registering-vault"
    | "completed"
    | "error";
}

export const DEFAULT_MODEL_METADATA: ModelMetadata = {
  name: "",
  description: "",
  category: "Language Model",
  tags: [],
  version: "1.0.0",
  author: "",
  license: "MIT",
  modelType: "language",
  framework: "pytorch",
  inputFormat: "text",
  outputFormat: "text",
};

export const DEFAULT_ACCESS_CONFIG: AccessConfiguration = {
  tokenName: "",
  tokenSymbol: "",
  pricePerInference: "0.01",
  minimumTokensForAccess: "1",
  initialTokenSupply: "1000000",
  mintable: true,
  burnable: false,
};

export const DEFAULT_DATACOIN_ECONOMICS: DataCoinEconomics = {
  creatorAllocationPct: "10", // 10% to creator (1000 bps)
  creatorVestingDays: "365", // 1 year vesting
  contributorsAllocationPct: "60", // 60% to contributors (6000 bps)
  liquidityAllocationPct: "30", // 30% for liquidity (3000 bps)
  lockToken: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE", // LSDC on Sepolia
  lockAmount: "", // Will be fetched from factory's getMinLockAmount
  tokenURI: "", // Will be auto-generated
  salt: "", // Will be auto-generated
};

export const DEFAULT_ACCESS_MONETIZATION: AccessMonetization = {
  paymentToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia USDC
  secondsPerToken: "3600", // 1 hour per token
  rewardRate: "1", // 1:1 ratio as starting point
  treasury: "", // Will default to user address
};

export const DEFAULT_DEPLOYMENT_CONFIG: DeploymentConfiguration = {
  chain: "ethereum",
  network: "testnet",
  lighthouseApiKey: "",
  enableEncryption: true,
  backupToFilecoin: true,
  enableMonitoring: true,
};

export const INITIAL_UPLOAD_STATE: ModelUploadState = {
  currentStep: 1,
  isUploading: false,
  uploadProgress: 0,
  selectedFile: null,
  metadata: { ...DEFAULT_MODEL_METADATA },
  accessConfig: { ...DEFAULT_ACCESS_CONFIG },
  dataCoinEconomics: { ...DEFAULT_DATACOIN_ECONOMICS },
  accessMonetization: { ...DEFAULT_ACCESS_MONETIZATION },
  deploymentConfig: { ...DEFAULT_DEPLOYMENT_CONFIG },
  errors: {},
  status: "idle",
};

// Validation functions
export const validateMetadata = (
  metadata: ModelMetadata
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!metadata.name.trim()) {
    errors.name = "Model name is required";
  }

  if (!metadata.description.trim()) {
    errors.description = "Model description is required";
  }

  if (!metadata.author.trim()) {
    errors.author = "Author name is required";
  }

  //   if (!ethers.utils?.isValidName(metadata.name)) {
  //     errors.name = "Model name contains invalid characters";
  //   }

  return errors;
};

export const validateAccessConfig = (
  config: AccessConfiguration
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!config.tokenName.trim()) {
    errors.tokenName = "Token name is required";
  }

  if (!config.tokenSymbol.trim()) {
    errors.tokenSymbol = "Token symbol is required";
  }

  if (config.tokenSymbol.length > 11) {
    errors.tokenSymbol = "Token symbol must be 11 characters or less";
  }

  try {
    const price = parseFloat(config.pricePerInference);
    if (price < 0 || price > 1000) {
      errors.pricePerInference = "Price must be between 0 and 1000 USDC";
    }
  } catch {
    errors.pricePerInference = "Invalid price format";
  }

  try {
    const minTokens = parseInt(config.minimumTokensForAccess);
    if (minTokens < 0) {
      errors.minimumTokensForAccess = "Minimum tokens must be non-negative";
    }
  } catch {
    errors.minimumTokensForAccess = "Invalid token amount";
  }

  try {
    const supply = parseInt(config.initialTokenSupply);
    if (supply < 1) {
      errors.initialTokenSupply = "Initial supply must be at least 1";
    }
  } catch {
    errors.initialTokenSupply = "Invalid supply amount";
  }

  return errors;
};

export const validateDeploymentConfig = (
  config: DeploymentConfiguration
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!config.lighthouseApiKey.trim()) {
    errors.lighthouseApiKey = "Lighthouse API key is required";
  }

  //   // Validate API key format (basic check)
  //   if (
  //     config.lighthouseApiKey &&
  //     !config.lighthouseApiKey.match(/^[a-f0-9-]{36}$/)
  //   ) {
  //     errors.lighthouseApiKey = "Invalid API key format";
  //   }

  return errors;
};

export const validateDataCoinEconomics = (
  economics: DataCoinEconomics,
  minLockAmount?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  try {
    const creatorPct = parseFloat(economics.creatorAllocationPct);
    if (creatorPct < 0 || creatorPct > 100) {
      errors.creatorAllocationPct = "Creator allocation must be between 0-100%";
    }

    const contributorsPct = parseFloat(economics.contributorsAllocationPct);
    if (contributorsPct < 0 || contributorsPct > 100) {
      errors.contributorsAllocationPct =
        "Contributors allocation must be between 0-100%";
    }

    const liquidityPct = parseFloat(economics.liquidityAllocationPct);
    if (liquidityPct < 0 || liquidityPct > 100) {
      errors.liquidityAllocationPct =
        "Liquidity allocation must be between 0-100%";
    }

    // Check total allocations don't exceed 100%
    const total = creatorPct + contributorsPct + liquidityPct;
    if (total > 100) {
      errors.totalAllocation = "Total allocations cannot exceed 100%";
    }
  } catch {
    errors.allocations = "Invalid percentage values";
  }

  try {
    const vestingDays = parseInt(economics.creatorVestingDays);
    if (vestingDays < 0) {
      errors.creatorVestingDays = "Vesting period cannot be negative";
    }
  } catch {
    errors.creatorVestingDays = "Invalid vesting period";
  }

  if (economics.lockToken && economics.lockToken !== "") {
    if (!economics.lockToken.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.lockToken = "Invalid lock token address";
    }

    try {
      const lockAmount = parseFloat(economics.lockAmount || "0");
      if (lockAmount <= 0) {
        errors.lockAmount =
          "Lock amount must be greater than 0 when lock token is specified";
      } else if (minLockAmount) {
        const minAmount = parseFloat(minLockAmount);
        if (lockAmount < minAmount) {
          errors.lockAmount = `Lock amount must be at least ${minLockAmount} tokens`;
        }
      }
    } catch {
      errors.lockAmount = "Invalid lock amount";
    }
  }

  return errors;
};

export const validateAccessMonetization = (
  monetization: AccessMonetization
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!monetization.paymentToken) {
    errors.paymentToken = "Payment token is required";
  } else if (!monetization.paymentToken.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.paymentToken = "Invalid payment token address";
  }

  try {
    const secondsPerToken = parseInt(monetization.secondsPerToken);
    if (secondsPerToken <= 0) {
      errors.secondsPerToken = "Seconds per token must be greater than 0";
    }
  } catch {
    errors.secondsPerToken = "Invalid seconds per token";
  }

  try {
    const rewardRate = parseFloat(monetization.rewardRate);
    if (rewardRate <= 0) {
      errors.rewardRate = "Reward rate must be greater than 0";
    }
  } catch {
    errors.rewardRate = "Invalid reward rate";
  }

  if (
    monetization.treasury &&
    !monetization.treasury.match(/^0x[a-fA-F0-9]{40}$/)
  ) {
    errors.treasury = "Invalid treasury address";
  }

  return errors;
};

// Utility functions for model categories and frameworks
export const MODEL_CATEGORIES = [
  "Language Model",
  "Image Generation",
  "Code Generation",
  "Audio Processing",
  "Video Analysis",
  "Computer Vision",
  "Natural Language Processing",
  "Speech Recognition",
  "Text-to-Speech",
  "Translation",
  "Summarization",
  "Question Answering",
  "Classification",
  "Sentiment Analysis",
  "Other",
] as const;

export const MODEL_FRAMEWORKS = [
  "pytorch",
  "tensorflow",
  "onnx",
  "huggingface",
  "jax",
  "mxnet",
  "paddlepaddle",
  "other",
] as const;

export const SUPPORTED_CHAINS = [
  { id: "ethereum", name: "Ethereum", testnet: "sepolia" },
] as const;

// Chain-specific contract addresses
export const CHAIN_CONFIG = {
  ethereum: {
    usdc: "0xA0b86991c431e1c8c84C5fC124D2280ca8e2B94f", // Ethereum mainnet USDC
    factoryAddress: "",
    dataCoinFactory: "",
  },
  sepolia: {
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia testnet USDC
    factoryAddress: "0xEB37A065E20D0BB04b161B1d2985065Fb242866a", // Your deployed factory
    dataCoinFactory: "", // DataCoinFactory address
  },
} as const;

// Helper function to get factory address for deployment
export const getFactoryAddress = (
  chain: string,
  network: "mainnet" | "testnet"
): string => {
  const chainKey =
    network === "testnet" && chain === "ethereum" ? "sepolia" : chain;
  const config = CHAIN_CONFIG[chainKey as keyof typeof CHAIN_CONFIG];
  return config?.factoryAddress || "";
};

// Format file size helper
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Estimate deployment costs
export const estimateDeploymentCosts = (
  chain: string,
  fileSize: number
): {
  tokenDeployment: number;
  vaultRegistration: number;
  storage: number;
  total: number;
} => {
  // Base costs in USD (approximate)
  const baseCosts = {
    polygon: { tokenDeployment: 5, vaultRegistration: 1 },
    ethereum: { tokenDeployment: 50, vaultRegistration: 10 },
    arbitrum: { tokenDeployment: 10, vaultRegistration: 2 },
    optimism: { tokenDeployment: 8, vaultRegistration: 2 },
  };

  const costs = baseCosts[chain as keyof typeof baseCosts] || baseCosts.polygon;

  // Storage cost based on file size (rough estimate)
  const storageCost = Math.max(2, (fileSize / (1024 * 1024 * 1024)) * 5); // $5 per GB

  return {
    tokenDeployment: costs.tokenDeployment,
    vaultRegistration: costs.vaultRegistration,
    storage: storageCost,
    total: costs.tokenDeployment + costs.vaultRegistration + storageCost,
  };
};
