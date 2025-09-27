"use client";

import React from "react";
import {
  AlertCircle,
  ExternalLink,
  Info,
  DollarSign,
  Shield,
  Database,
  Activity,
} from "lucide-react";
import {
  DeploymentConfiguration,
  SUPPORTED_CHAINS,
  estimateDeploymentCosts,
  formatFileSize,
} from "@/lib/upload-types";

interface DeploymentConfigFormProps {
  config: DeploymentConfiguration;
  onChange: (config: Partial<DeploymentConfiguration>) => void;
  errors: Record<string, string>;
  fileSize?: number;
  disabled?: boolean;
}

export function DeploymentConfigForm({
  config,
  onChange,
  errors,
  fileSize = 0,
  disabled = false,
}: DeploymentConfigFormProps) {
  const handleChange = React.useCallback(
    (field: keyof DeploymentConfiguration) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;
        onChange({ [field]: value });
      },
    [onChange]
  );

  // Calculate estimated costs
  const costs = React.useMemo(() => {
    return estimateDeploymentCosts(config.chain, fileSize);
  }, [config.chain, fileSize]);

  return (
    <div className="space-y-6">
      {/* Blockchain Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          Blockchain Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chain Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blockchain Network *
            </label>
            <select
              value={config.chain}
              onChange={handleChange("chain")}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {SUPPORTED_CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose the blockchain for smart contract deployment
            </p>
          </div>

          {/* Network Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Network Type *
            </label>
            <select
              value={config.network}
              onChange={handleChange("network")}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="mainnet">Mainnet (Production)</option>
              <option value="testnet">Testnet (Development)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {config.network === "mainnet"
                ? "Real transactions with actual costs"
                : "Test transactions with free tokens"}
            </p>
          </div>
        </div>
      </div>

      {/* Lighthouse Configuration */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-green-600" />
          Lighthouse Storage Configuration
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lighthouse API Key *
          </label>
          <input
            type="password"
            value={config.lighthouseApiKey}
            onChange={handleChange("lighthouseApiKey")}
            placeholder="Enter your Lighthouse API key"
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
              errors.lighthouseApiKey ? "border-red-500" : "border-gray-300"
            }`}
          />
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {errors.lighthouseApiKey ? (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lighthouseApiKey}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Get your API key from Lighthouse
                </p>
              )}
            </div>
            <a
              href="https://files.lighthouse.storage/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Get API Key <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Storage Options */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center">
            <input
              id="enableEncryption"
              type="checkbox"
              checked={config.enableEncryption}
              onChange={handleChange("enableEncryption")}
              disabled={disabled}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:cursor-not-allowed"
            />
            <label
              htmlFor="enableEncryption"
              className="ml-2 block text-sm text-gray-900"
            >
              Enable model encryption (Recommended)
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="backupToFilecoin"
              type="checkbox"
              checked={config.backupToFilecoin}
              onChange={handleChange("backupToFilecoin")}
              disabled={disabled}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:cursor-not-allowed"
            />
            <label
              htmlFor="backupToFilecoin"
              className="ml-2 block text-sm text-gray-900"
            >
              Backup to Filecoin for permanent storage
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="enableMonitoring"
              type="checkbox"
              checked={config.enableMonitoring}
              onChange={handleChange("enableMonitoring")}
              disabled={disabled}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:cursor-not-allowed"
            />
            <label
              htmlFor="enableMonitoring"
              className="ml-2 block text-sm text-gray-900"
            >
              Enable usage monitoring and analytics
            </label>
          </div>
        </div>
      </div>

      {/* Cost Estimation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-800 mb-3">
              Estimated Deployment Costs
            </h3>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex justify-between">
                <span>Token Contract Deployment:</span>
                <span className="font-medium">${costs.tokenDeployment}</span>
              </div>
              <div className="flex justify-between">
                <span>Model Vault Registration:</span>
                <span className="font-medium">${costs.vaultRegistration}</span>
              </div>
              <div className="flex justify-between">
                <span>Lighthouse Storage ({formatFileSize(fileSize)}):</span>
                <span className="font-medium">${costs.storage}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-blue-200 pt-2 mt-2">
                <span>Total Estimated Cost:</span>
                <span>${costs.total}</span>
              </div>
            </div>

            {config.network === "testnet" && (
              <p className="text-xs text-blue-600 mt-2 italic">
                * Testnet deployment uses free test tokens
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Deployment Steps Preview */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-600" />
          Deployment Process
        </h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                1
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  {config.enableEncryption
                    ? "Encrypt & Upload Model"
                    : "Upload Model"}
                </span>
                <p className="text-xs text-gray-600">
                  {config.enableEncryption
                    ? "Encrypt model with Kavach SDK and upload to Lighthouse"
                    : "Upload model file to Lighthouse storage"}
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">~2-5 min</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                2
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  Deploy DAO Token Contract
                </span>
                <p className="text-xs text-gray-600">
                  Create ERC-20 token for access control on {config.chain}
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">~1-2 min</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                3
              </div>
              <div>
                <span className="font-medium text-gray-900">
                  Register in Model Vault
                </span>
                <p className="text-xs text-gray-600">
                  Link model CID with token contract and pricing
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500">~30 sec</span>
          </div>

          {config.enableEncryption && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  4
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    Update Access Conditions
                  </span>
                  <p className="text-xs text-gray-600">
                    Configure token-gated access on Lighthouse
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">~30 sec</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">
              Security & Decentralization
            </h3>
            <p className="text-sm text-green-700 mt-1">
              Your model will be stored on IPFS/Filecoin through Lighthouse,
              ensuring permanent, decentralized storage. Smart contracts on{" "}
              {config.chain} will handle access control and payments without any
              platform commissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
