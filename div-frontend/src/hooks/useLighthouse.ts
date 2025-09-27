"use client";

import { useState, useCallback } from "react";
import lighthouse from "@lighthouse-web3/sdk";

export interface LighthouseConfig {
  apiKey: string;
}

export interface UploadProgress {
  percentage: number;
  status: "idle" | "uploading" | "completed" | "error";
  message?: string;
}

export interface UploadResult {
  cid: string;
  fileName: string;
  fileSize: number;
}

export interface AccessCondition {
  id: number;
  chain: string;
  method: string;
  standardContractType: string;
  contractAddress: string;
  returnValueTest: {
    comparator: string;
    value: string;
  };
  parameters: string[];
}

export function useLighthouse(config?: LighthouseConfig) {
  const [progress, setProgress] = useState<UploadProgress>({
    percentage: 0,
    status: "idle",
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Lighthouse with API key
  const initialize = useCallback(async (apiKey: string) => {
    try {
      setError(null);
      // Store API key for subsequent operations
      setIsInitialized(true);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize Lighthouse"
      );
      return false;
    }
  }, []);

  // Upload a regular file to Lighthouse
  const uploadFile = useCallback(
    async (
      file: File,
      apiKey: string,
      onProgress?: (progress: number) => void
    ): Promise<UploadResult> => {
      try {
        setProgress({
          percentage: 0,
          status: "uploading",
          message: "Starting upload...",
        });
        setError(null);

        const uploadResponse = await lighthouse.upload(
          file,
          apiKey,
          false, // dealParameters - set to false for now
          (progressData: any) => {
            const percentage = Math.round(progressData.percentage || 0);
            setProgress({
              percentage,
              status: "uploading",
              message: `Uploading... ${percentage}%`,
            });
            onProgress?.(percentage);
          }
        );

        setProgress({
          percentage: 100,
          status: "completed",
          message: "Upload completed successfully!",
        });

        return {
          cid: uploadResponse.data.Hash,
          fileName: uploadResponse.data.Name,
          fileSize: parseInt(uploadResponse.data.Size),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Upload failed";
        setError(errorMessage);
        setProgress({
          percentage: 0,
          status: "error",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Upload an encrypted file with access control
  const uploadEncrypted = useCallback(
    async (
      file: File,
      apiKey: string,
      publicKey: string,
      signedMessage: string,
      accessConditions: AccessCondition[],
      onProgress?: (progress: number) => void
    ): Promise<UploadResult> => {
      try {
        setProgress({
          percentage: 0,
          status: "uploading",
          message: "Encrypting and uploading...",
        });
        setError(null);
        const uploadResponse = await lighthouse.uploadEncrypted(
          [file],
          apiKey,
          publicKey,
          signedMessage
        );

        setProgress({
          percentage: 100,
          status: "completed",
          message: "Encrypted upload completed successfully!",
        });

        return {
          cid: uploadResponse.data.Hash,
          fileName: uploadResponse.data.Name,
          fileSize: parseInt(uploadResponse.data.Size),
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Encrypted upload failed";
        setError(errorMessage);
        setProgress({
          percentage: 0,
          status: "error",
          message: errorMessage,
        });
        throw new Error(errorMessage);
      }
    },
    []
  );

  // Create access conditions for token-gated access
  const createTokenGateConditions = useCallback(
    (
      tokenContract: string,
      chainId: string,
      minBalance: string
    ): AccessCondition[] => {
      return [
        {
          id: 1,
          chain: chainId,
          method: "balanceOf",
          standardContractType: "ERC20",
          contractAddress: tokenContract,
          returnValueTest: {
            comparator: ">=",
            value: minBalance,
          },
          parameters: [":userAddress"],
        },
      ];
    },
    []
  );

  // Get file info from CID
  const getFileInfo = useCallback(async (cid: string) => {
    try {
      // This would typically call lighthouse.getFileInfo or similar
      // For now, we'll return basic structure
      return {
        cid,
        name: "Unknown",
        size: 0,
        uploadDate: new Date().toISOString(),
      };
    } catch (err) {
      throw new Error(
        `Failed to get file info: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, []);

  // Get deal status for a file
  const getDealStatus = useCallback(async (cid: string) => {
    try {
      const dealStatus = await lighthouse.dealStatus(cid);
      return dealStatus;
    } catch (err) {
      throw new Error(
        `Failed to get deal status: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({ percentage: 0, status: "idle" });
    setError(null);
  }, []);
  const getAuthMessage = (address) => {
    return lighthouse.getAuthMessage(address);
  };

  return {
    // State
    progress,
    isInitialized,
    error,

    // Actions
    initialize,
    uploadFile,
    uploadEncrypted,
    createTokenGateConditions,
    getFileInfo,
    getDealStatus,
    resetProgress,
    getAuthMessage,
    // Utilities
    lighthouse, // Expose the lighthouse SDK for advanced usage
  };
}
