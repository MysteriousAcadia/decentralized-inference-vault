"use client";

import React from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { ModelUploadState } from "@/lib/upload-types";

interface UploadProgressProps {
  state: ModelUploadState;
  onRetry?: () => void;
}

interface StepStatus {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "error";
  progress?: number;
  txHash?: string;
  cid?: string;
  error?: string;
}

export function UploadProgress({ state, onRetry }: UploadProgressProps) {
  const steps: StepStatus[] = React.useMemo(() => {
    const baseSteps: StepStatus[] = [
      {
        id: "upload",
        title: state.deploymentConfig.enableEncryption
          ? "Encrypt & Upload Model"
          : "Upload Model",
        description: state.deploymentConfig.enableEncryption
          ? "Encrypting model with Kavach SDK and uploading to Lighthouse"
          : "Uploading model file to Lighthouse storage",
        status: "pending",
        progress: 0,
      },
      {
        id: "deploy-token",
        title: "Deploy DAO Token Contract",
        description: `Creating ERC-20 token contract on ${state.deploymentConfig.chain}`,
        status: "pending",
      },
      {
        id: "register-vault",
        title: "Register in Model Vault",
        description: "Linking model CID with token contract and pricing",
        status: "pending",
      },
    ];

    if (state.deploymentConfig.enableEncryption) {
      baseSteps.push({
        id: "update-access",
        title: "Update Access Conditions",
        description: "Configuring token-gated access on Lighthouse",
        status: "pending",
      });
    }

    // Update step statuses based on current state
    switch (state.status) {
      case "idle":
        break;

      case "uploading":
      case "encrypting":
        baseSteps[0].status = "in-progress";
        baseSteps[0].progress = state.uploadProgress;
        break;

      case "deploying-token":
        baseSteps[0].status = "completed";
        baseSteps[0].cid = state.fileCid;
        baseSteps[1].status = "in-progress";
        break;

      case "registering-vault":
        baseSteps[0].status = "completed";
        baseSteps[0].cid = state.fileCid;
        baseSteps[1].status = "completed";
        if (state.tokenContractAddress) {
          baseSteps[1].txHash = state.tokenContractAddress;
        }
        baseSteps[2].status = "in-progress";
        break;

      case "completed":
        baseSteps.forEach((step, index) => {
          step.status = "completed";
          if (index === 0 && state.fileCid) step.cid = state.fileCid;
          if (index === 1 && state.tokenContractAddress)
            step.txHash = state.tokenContractAddress;
          if (index === 2 && state.vaultRegistrationTx)
            step.txHash = state.vaultRegistrationTx;
        });
        break;

      case "error":
        const errorStep =
          baseSteps.find((step) => step.status === "in-progress") ||
          baseSteps[0];
        errorStep.status = "error";
        errorStep.error = state.errors.upload || "An error occurred";
        break;
    }

    return baseSteps;
  }, [state]);

  const overallProgress = React.useMemo(() => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed"
    ).length;
    const inProgressStep = steps.find((step) => step.status === "in-progress");

    let progress = (completedSteps / steps.length) * 100;

    if (inProgressStep && inProgressStep.progress !== undefined) {
      progress += (inProgressStep.progress / 100) * (100 / steps.length);
    }

    return Math.round(progress);
  }, [steps]);

  const getStepIcon = (step: StepStatus) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in-progress":
        return <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: StepStatus) => {
    switch (step.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "in-progress":
        return "border-indigo-200 bg-indigo-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Deployment Progress
          </h3>
          <span className="text-sm text-gray-600">{overallProgress}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {state.status === "completed" ? (
            <span className="text-green-600 font-medium">
              ✓ Deployment completed successfully!
            </span>
          ) : state.status === "error" ? (
            <span className="text-red-600 font-medium">
              ✗ Deployment failed
            </span>
          ) : (
            <span>
              Deploying your AI model to the decentralized marketplace...
            </span>
          )}
        </div>
      </div>

      {/* Step-by-step Progress */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg p-4 ${getStepColor(step)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  {step.status === "in-progress" &&
                    step.progress !== undefined && (
                      <span className="text-sm text-gray-600">
                        {step.progress}%
                      </span>
                    )}
                </div>

                <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                {/* Progress bar for in-progress steps */}
                {step.status === "in-progress" &&
                  step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                {/* Success details */}
                {step.status === "completed" && (step.cid || step.txHash) && (
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    {step.cid && (
                      <div className="flex items-center gap-1">
                        <span>CID: {step.cid}</span>
                        <a
                          href={`https://gateway.lighthouse.storage/ipfs/${step.cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {step.txHash && !step.cid && (
                      <div className="flex items-center gap-1">
                        <span>Contract: {step.txHash}</span>
                        <a
                          href={`https://${
                            state.deploymentConfig.network === "testnet"
                              ? "mumbai."
                              : ""
                          }polygonscan.com/address/${step.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Error details */}
                {step.status === "error" && step.error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-100 rounded p-2">
                    {step.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Summary */}
      {state.status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">
                Model Successfully Deployed!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your AI model is now live on the decentralized marketplace.
                Users with
                {state.accessConfig.minimumTokensForAccess} or more{" "}
                {state.accessConfig.tokenSymbol} tokens can access your model
                for ${state.accessConfig.pricePerInference} USDC per inference.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <a
              href="/marketplace"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              View in Marketplace
            </a>
            <a
              href="/dashboard"
              className="border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
            >
              Manage Model
            </a>
          </div>
        </div>
      )}

      {/* Error Actions */}
      {state.status === "error" && onRetry && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-medium text-red-800">Deployment Failed</h3>
                <p className="text-sm text-red-700">
                  Don't worry, you can retry the deployment. No charges were
                  made.
                </p>
              </div>
            </div>

            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry Deployment
            </button>
          </div>
        </div>
      )}

      {/* Time Estimate */}
      {state.isUploading && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Estimated time remaining: 3-8 minutes</span>
        </div>
      )}
    </div>
  );
}
