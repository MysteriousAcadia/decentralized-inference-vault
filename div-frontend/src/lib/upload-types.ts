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

  // Deployment settings
  deploymentConfig: DeploymentConfiguration;

  // Smart contract information
  tokenContractAddress?: string;
  vaultRegistrationTx?: string;

  // Error handling
  errors: Record<string, string>;

  // Status
  status:
    | "idle"
    | "uploading"
    | "encrypting"
    | "deploying-token"
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

export const DEFAULT_DEPLOYMENT_CONFIG: DeploymentConfiguration = {
  chain: "polygon",
  network: "mainnet",
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
  { id: "polygon", name: "Polygon", testnet: "mumbai" },
  { id: "ethereum", name: "Ethereum", testnet: "goerli" },
  { id: "arbitrum", name: "Arbitrum", testnet: "arbitrum-goerli" },
  { id: "optimism", name: "Optimism", testnet: "optimism-goerli" },
] as const;

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
