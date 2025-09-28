"use client";

import { useState, useCallback } from "react";
import { useAccount, useSignMessage, useReadContract } from "wagmi";
import { formatEther } from "viem";

// ERC20 ABI for token balance checking
const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export interface AIModel {
  model_id: string;
  name: string;
  description?: string;
  owner: string;
  access_token_address: string;
  cost_per_inference: string;
  is_active: boolean;
  created_at?: string;
}

export interface InferenceRequest {
  model_id: string;
  user_address: string;
  input_data: {
    text: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
  };
  user_signature: string;
}

export interface InferenceResponse {
  inference_id: string;
  model_id: string;
  output: string;
  cost: string;
  processing_time: number;
  timestamp: string;
}

export interface InferenceHistory {
  inference_id: string;
  model_id: string;
  model_name: string;
  input_text: string;
  output: string;
  cost: string;
  processing_time: number;
  timestamp: string;
}

export function useAIInference() {
  const { address: userAddress } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const AI_BACKEND_URL =
    process.env.NEXT_PUBLIC_AI_BACKEND_URL || "http://localhost:8000";

  // Get token balance for a specific DataCoin/access token
  const useTokenBalance = (tokenAddress?: string) => {
    return useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`],
      query: {
        enabled: !!(tokenAddress && userAddress),
      },
    });
  };

  // Get token info (name, symbol, decimals)
  const useTokenInfo = (tokenAddress?: string) => {
    const { data: name } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "name",
      query: { enabled: !!tokenAddress },
    });

    const { data: symbol } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "symbol",
      query: { enabled: !!tokenAddress },
    });

    const { data: decimals } = useReadContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "decimals",
      query: { enabled: !!tokenAddress },
    });

    return { name, symbol, decimals };
  };

  // Fetch available AI models
  const fetchModels = useCallback(async (): Promise<AIModel[]> => {
    try {
      const response = await fetch(`${AI_BACKEND_URL}/api/v1/models`);
      if (!response.ok) {
        // throw new Error('Failed to fetch models');
      }
      const data = await response.json();
      return [
        {
          model_id: "gpt-4-clone",
          name: "Qwen greeting bot",
          description: "Advanced language model for general tasks",
          owner: "0x742d35Cc6634C0532925a3b8D75C0B08D4603c0C",
          access_token_address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE",
          cost_per_inference: "0.01",
          is_active: true,
        },
        {
          model_id: "codellama-pro",
          name: "CodeLlama Pro",
          description: "Specialized coding assistant",
          owner: "0x742d35Cc6634C0532925a3b8D75C0B08D4603c0C",
          access_token_address: "0x2EA104BCdF3A448409F2dc626e606FdCf969a5aE",
          cost_per_inference: "0.02",
          is_active: false,
        },
      ];
      // reutrn data.
    } catch (err) {
      console.error("Error fetching models:", err);
      // throw err;
    }
  }, [AI_BACKEND_URL]);

  // Check if user has access to a model (has tokens)
  const checkModelAccess = useCallback(
    async (model: AIModel) => {
      if (!userAddress || !model.access_token_address) {
        return {
          hasAccess: false,
          balance: "0",
          reason: "Wallet not connected",
        };
      }

      try {
        // Check token balance
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
          }/api/access/check/${userAddress}`
        );

        if (!response.ok) {
          throw new Error("Failed to check access");
        }

        const accessData = await response.json();

        return {
          hasAccess: accessData.data.hasAccess,
          balance: "0", // Will be populated by useTokenBalance hook
          reason: accessData.data.message,
        };
      } catch (err) {
        console.error("Error checking model access:", err);
        return {
          hasAccess: true,
          balance: "0",
          // reason: "Error checking access",
        };
      }
    },
    [userAddress]
  );

  // Submit inference request
  const submitInference = useCallback(
    async (
      modelId: string,
      inputData: {
        text: string;
        max_tokens?: number;
        temperature?: number;
        top_p?: number;
      }
    ): Promise<InferenceResponse> => {
      if (!userAddress) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create message to sign
        const timestamp = Date.now();
        const message = `AI Inference Request\nModel: ${modelId}\nUser: ${userAddress}\nTimestamp: ${timestamp}`;

        // Sign the message
        const signature = await signMessageAsync({ message });

        // Prepare request
        const inferenceRequest: InferenceRequest = {
          model_id: modelId,
          user_address: userAddress,
          input_data: inputData,
          user_signature: signature,
        };

        // Submit to AI backend
        const response = await fetch(`${AI_BACKEND_URL}/api/v1/inference`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inferenceRequest),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Inference request failed");
        }
        debugger;
        const result = await response.json();
        return result.result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress, signMessageAsync, AI_BACKEND_URL]
  );

  // Fetch inference history
  const fetchInferenceHistory = useCallback(async (): Promise<
    InferenceHistory[]
  > => {
    if (!userAddress) {
      return [];
    }

    try {
      const response = await fetch(
        `${AI_BACKEND_URL}/api/v1/inference/history/${userAddress}`
      );

      if (!response.ok) {
        // throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      return data.history || [];
    } catch (err) {
      console.error("Error fetching inference history:", err);
      return [];
    }
  }, [userAddress, AI_BACKEND_URL]);

  // Format token balance for display
  const formatTokenBalance = useCallback(
    (balance: bigint | undefined, decimals: number = 18): string => {
      if (!balance) return "0";
      return parseFloat(formatEther(balance)).toFixed(2);
    },
    []
  );

  // Calculate inference cost in USD (mock calculation)
  const calculateInferenceCost = useCallback(
    (model: AIModel, inputLength: number): string => {
      const baseCost = parseFloat(model.cost_per_inference);
      const lengthMultiplier = Math.max(1, inputLength / 1000); // Scale with input length
      return (baseCost * lengthMultiplier).toFixed(4);
    },
    []
  );

  return {
    // Data
    userAddress,
    isLoading,
    error,

    // Functions
    fetchModels,
    checkModelAccess,
    submitInference,
    fetchInferenceHistory,
    formatTokenBalance,
    calculateInferenceCost,

    // Hooks
    useTokenBalance,
    useTokenInfo,

    // Utils
    setError,
  };
}
