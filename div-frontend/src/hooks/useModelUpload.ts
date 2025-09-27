"use client";

import { useState, useCallback, useReducer, useMemo } from "react";
import {
  useAccount,
  useSignMessage,
  useChainId,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useLighthouse } from "./useLighthouse";
import { useFileUpload } from "./useFileUpload";
import { useCommunityDAOFactory } from "./useCommunityDAOFactory";
import {
  ModelUploadState,
  INITIAL_UPLOAD_STATE,
  validateMetadata,
  validateAccessConfig,
  validateDeploymentConfig,
  validateDataCoinEconomics,
  validateAccessMonetization,
  ModelMetadata,
  AccessConfiguration,
  DataCoinEconomics,
  AccessMonetization,
  DeploymentConfiguration,
  getFactoryAddress,
} from "@/lib/upload-types";

type UploadAction =
  | { type: "SET_STEP"; step: 1 | 2 | 3 }
  | { type: "SET_FILE"; file: File }
  | { type: "UPDATE_METADATA"; metadata: Partial<ModelMetadata> }
  | { type: "UPDATE_ACCESS_CONFIG"; config: Partial<AccessConfiguration> }
  | { type: "UPDATE_DATACOIN_ECONOMICS"; economics: Partial<DataCoinEconomics> }
  | {
      type: "UPDATE_ACCESS_MONETIZATION";
      monetization: Partial<AccessMonetization>;
    }
  | {
      type: "UPDATE_DEPLOYMENT_CONFIG";
      config: Partial<DeploymentConfiguration>;
    }
  | { type: "SET_STATUS"; status: ModelUploadState["status"] }
  | { type: "SET_PROGRESS"; progress: number }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "SET_FILE_CID"; cid: string }
  | { type: "SET_DAO_ADDRESS"; address: string }
  | { type: "SET_DATACOIN_ADDRESS"; address: string }
  | { type: "SET_VAULT_TX"; tx: string }
  | { type: "RESET" };

function uploadReducer(
  state: ModelUploadState,
  action: UploadAction
): ModelUploadState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: action.step };

    case "SET_FILE":
      return {
        ...state,
        selectedFile: action.file,
        fileSize: action.file.size,
        // Auto-fill model name if empty
        metadata: {
          ...state.metadata,
          name:
            state.metadata.name || action.file.name.replace(/\.[^/.]+$/, ""),
        },
      };

    case "UPDATE_METADATA":
      return {
        ...state,
        metadata: { ...state.metadata, ...action.metadata },
      };

    case "UPDATE_ACCESS_CONFIG":
      return {
        ...state,
        accessConfig: { ...state.accessConfig, ...action.config },
      };

    case "UPDATE_DATACOIN_ECONOMICS":
      return {
        ...state,
        dataCoinEconomics: { ...state.dataCoinEconomics, ...action.economics },
      };

    case "UPDATE_ACCESS_MONETIZATION":
      return {
        ...state,
        accessMonetization: {
          ...state.accessMonetization,
          ...action.monetization,
        },
      };

    case "UPDATE_DEPLOYMENT_CONFIG":
      return {
        ...state,
        deploymentConfig: { ...state.deploymentConfig, ...action.config },
      };

    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
        isUploading:
          action.status !== "idle" &&
          action.status !== "completed" &&
          action.status !== "error",
      };

    case "SET_PROGRESS":
      return { ...state, uploadProgress: action.progress };

    case "SET_ERRORS":
      return { ...state, errors: action.errors };

    case "SET_FILE_CID":
      return { ...state, fileCid: action.cid };

    case "SET_DAO_ADDRESS":
      return { ...state, daoAddress: action.address };

    case "SET_DATACOIN_ADDRESS":
      return { ...state, dataCoinAddress: action.address };

    case "SET_VAULT_TX":
      return { ...state, vaultRegistrationTx: action.tx };

    case "RESET":
      return { ...INITIAL_UPLOAD_STATE };

    default:
      return state;
  }
}

export function useModelUpload() {
  const [state, dispatch] = useReducer(uploadReducer, INITIAL_UPLOAD_STATE);
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const chainId = useChainId();

  // Get factory address for current chain and network
  const factoryAddress = getFactoryAddress(
    state.deploymentConfig.chain,
    state.deploymentConfig.network
  );

  // Initialize factory hook
  const daoFactory = useCommunityDAOFactory({
    chainId: chainId || 137, // Default to Polygon
    factoryAddress,
  });

  // Initialize hooks
  const lighthouse = useLighthouse();
  const fileUpload = useFileUpload({
    multiple: false,
    onFileSelect: (files) => {
      if (files.length > 0) {
        dispatch({ type: "SET_FILE", file: files[0] });
      }
    },
  });

  // Memoize validation results to prevent infinite re-renders
  const metadataErrors = useMemo(() => {
    return validateMetadata(state.metadata);
  }, [state.metadata]);

  const accessConfigErrors = useMemo(() => {
    return validateAccessConfig(state.accessConfig);
  }, [state.accessConfig]);

  const dataCoinEconomicsErrors = useMemo(() => {
    return validateDataCoinEconomics(state.dataCoinEconomics);
  }, [state.dataCoinEconomics]);

  const accessMonetizationErrors = useMemo(() => {
    return validateAccessMonetization(state.accessMonetization);
  }, [state.accessMonetization]);

  const deploymentConfigErrors = useMemo(() => {
    return validateDeploymentConfig(state.deploymentConfig);
  }, [state.deploymentConfig]);

  // Navigation functions
  const goToStep = useCallback((step: 1 | 2 | 3) => {
    dispatch({ type: "SET_STEP", step });
  }, []);

  const nextStep = () => {
    if (state.currentStep < 3) {
      dispatch({
        type: "SET_STEP",
        step: (state.currentStep + 1) as 1 | 2 | 3,
      });
    }
  };

  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({
        type: "SET_STEP",
        step: (state.currentStep - 1) as 1 | 2 | 3,
      });
    }
  }, [state.currentStep]);

  // Update functions
  const updateMetadata = useCallback((metadata: Partial<ModelMetadata>) => {
    dispatch({ type: "UPDATE_METADATA", metadata });
  }, []);

  const updateAccessConfig = useCallback(
    (config: Partial<AccessConfiguration>) => {
      dispatch({ type: "UPDATE_ACCESS_CONFIG", config });
    },
    []
  );

  const updateDataCoinEconomics = useCallback(
    (economics: Partial<DataCoinEconomics>) => {
      dispatch({ type: "UPDATE_DATACOIN_ECONOMICS", economics });
    },
    []
  );

  const updateAccessMonetization = useCallback(
    (monetization: Partial<AccessMonetization>) => {
      dispatch({ type: "UPDATE_ACCESS_MONETIZATION", monetization });
    },
    []
  );

  const updateDeploymentConfig = useCallback(
    (config: Partial<DeploymentConfiguration>) => {
      dispatch({ type: "UPDATE_DEPLOYMENT_CONFIG", config });
    },
    []
  );

  // Validation functions
  const validateCurrentStep = useCallback((): boolean => {
    let errors: Record<string, string> = {};

    switch (state.currentStep) {
      case 1:
        if (!state.selectedFile) {
          errors.file = "Please select a model file";
        }
        errors = { ...errors, ...metadataErrors };
        break;

      case 2:
        errors = {
          ...accessConfigErrors,
          ...dataCoinEconomicsErrors,
          ...accessMonetizationErrors,
        };
        break;

      case 3:
        errors = deploymentConfigErrors;
        break;
    }

    dispatch({ type: "SET_ERRORS", errors });
    return Object.keys(errors).length === 0;
  }, [
    state.currentStep,
    state.selectedFile,
    metadataErrors,
    accessConfigErrors,
    dataCoinEconomicsErrors,
    accessMonetizationErrors,
    deploymentConfigErrors,
  ]);

  // Main upload function
  const startUpload = useCallback(async () => {
    if (!address) {
      throw new Error("Please connect your wallet first");
    }

    if (!state.selectedFile) {
      throw new Error("Please select a file to upload");
    }

    // Validate all steps using memoized results
    const allErrors = {
      ...metadataErrors,
      ...accessConfigErrors,
      ...dataCoinEconomicsErrors,
      ...accessMonetizationErrors,
      ...deploymentConfigErrors,
    };
    if (Object.keys(allErrors).length > 0) {
      dispatch({ type: "SET_ERRORS", errors: allErrors });
      throw new Error("Please fix validation errors before uploading");
    }

    try {
      dispatch({ type: "SET_STATUS", status: "uploading" });
      dispatch({ type: "SET_PROGRESS", progress: 10 });

      // Step 1: Initialize Lighthouse
      await lighthouse.initialize(state.deploymentConfig.lighthouseApiKey);

      if (state.deploymentConfig.enableEncryption) {
        // Step 2: Upload encrypted model
        dispatch({ type: "SET_STATUS", status: "encrypting" });
        dispatch({ type: "SET_PROGRESS", progress: 30 });
        const { message } = (
          await lighthouse.lighthouse.getAuthMessage(address)
        ).data;
        // Get user signature for encryption
        const signedMessage = await signMessageAsync({ message });

        // Create access conditions (placeholder - will be updated after token deployment)
        const accessConditions = lighthouse.createTokenGateConditions(
          "0x0000000000000000000000000000000000000000", // Placeholder
          state.deploymentConfig.chain === "polygon" ? "polygon" : "ethereum",
          state.accessConfig.minimumTokensForAccess
        );
        debugger;
        // Upload encrypted file
        const uploadResult = await lighthouse.uploadEncrypted(
          state.selectedFile,
          state.deploymentConfig.lighthouseApiKey,
          address, // public key
          signedMessage
        );

        dispatch({ type: "SET_FILE_CID", cid: uploadResult.cid });
      } else {
        // Upload regular file
        const uploadResult = await lighthouse.uploadFile(
          state.selectedFile,
          state.deploymentConfig.lighthouseApiKey,
          (progress) => {
            dispatch({ type: "SET_PROGRESS", progress: 30 + progress * 0.4 });
          }
        );

        dispatch({ type: "SET_FILE_CID", cid: uploadResult.cid });
      }

      // Step 3: Deploy DAO and DataCoin contracts
      dispatch({ type: "SET_STATUS", status: "deploying-dao" });
      dispatch({ type: "SET_PROGRESS", progress: 70 });

      if (!factoryAddress) {
        throw new Error(
          `Factory not deployed on ${state.deploymentConfig.chain} ${state.deploymentConfig.network}. Please contact support.`
        );
      }

      // Deploy using the factory
      const txHash = await daoFactory.deployDAO(
        state.dataCoinEconomics,
        state.accessConfig,
        state.accessMonetization,
        state.deploymentConfig.chain,
        state.fileCid // Use file CID as tokenURI for now
      );

      // Wait for transaction confirmation
      dispatch({ type: "SET_PROGRESS", progress: 100 });

      // Complete
      dispatch({ type: "SET_STATUS", status: "completed" });
      dispatch({ type: "SET_PROGRESS", progress: 100 });
    } catch (error) {
      dispatch({ type: "SET_STATUS", status: "error" });
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      dispatch({ type: "SET_ERRORS", errors: { upload: errorMessage } });
      throw error;
    }
  }, [
    address,
    signMessageAsync,
    state.selectedFile,
    state.metadata,
    state.accessConfig,
    state.dataCoinEconomics,
    state.accessMonetization,
    state.deploymentConfig,
    factoryAddress,
    lighthouse,
    daoFactory,
    metadataErrors,
    accessConfigErrors,
    dataCoinEconomicsErrors,
    accessMonetizationErrors,
    deploymentConfigErrors,
  ]);

  // Reset upload state
  const resetUpload = useCallback(() => {
    dispatch({ type: "RESET" });
    fileUpload.clearFiles();
    lighthouse.resetProgress();
  }, [fileUpload, lighthouse]);

  // Calculate progress for current step using memoized validation results
  const getStepProgress = useCallback(
    (step: number): number => {
      if (step < state.currentStep) return 100;
      if (step > state.currentStep) return 0;

      // Current step progress based on validation
      switch (step) {
        case 1:
          return state.selectedFile && Object.keys(metadataErrors).length === 0
            ? 100
            : 50;
        case 2:
          return Object.keys(accessConfigErrors).length === 0 &&
            Object.keys(dataCoinEconomicsErrors).length === 0 &&
            Object.keys(accessMonetizationErrors).length === 0
            ? 100
            : 50;
        case 3:
          return state.status === "completed" ? 100 : state.uploadProgress;
        default:
          return 0;
      }
    },
    [
      state.currentStep,
      state.selectedFile,
      state.status,
      state.uploadProgress,
      metadataErrors,
      accessConfigErrors,
      dataCoinEconomicsErrors,
      accessMonetizationErrors,
    ]
  );

  return {
    // State
    ...state,

    // File upload integration
    fileUpload,
    lighthouse,

    // Navigation
    goToStep,
    nextStep,
    prevStep,
    canProceed: validateCurrentStep,
    getStepProgress,

    // Actions
    updateMetadata,
    updateAccessConfig,
    updateDataCoinEconomics,
    updateAccessMonetization,
    updateDeploymentConfig,
    startUpload,
    resetUpload,

    // Validation
    validateCurrentStep,

    // Computed values
    isConnected: !!address,
    userAddress: address,
  };
}
