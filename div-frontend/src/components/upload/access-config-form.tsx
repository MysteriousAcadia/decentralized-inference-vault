"use client";

import React from "react";
import { AlertCircle, Info, Shield, Lock } from "lucide-react";
import { AccessConfiguration } from "@/lib/upload-types";

interface AccessConfigFormProps {
  config: AccessConfiguration;
  onChange: (config: Partial<AccessConfiguration>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function AccessConfigForm({
  config,
  onChange,
  errors,
  disabled = false,
}: AccessConfigFormProps) {
  const handleChange = React.useCallback(
    (field: keyof AccessConfiguration) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value =
          e.target.type === "checkbox" ? e.target.checked : e.target.value;
        onChange({ [field]: value });
      },
    [onChange]
  );

  // Calculate estimated token price based on inference price and minimum tokens
  const estimatedTokenPrice = React.useMemo(() => {
    const inferencePrice = parseFloat(config.pricePerInference) || 0;
    const minTokens = parseInt(config.minimumTokensForAccess) || 1;
    return (inferencePrice * minTokens * 100).toFixed(4); // Rough estimate
  }, [config.pricePerInference, config.minimumTokensForAccess]);

  return (
    <div className="space-y-6">
      {/* DAO Token Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-indigo-600" />
          DAO Token Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Token Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DAO Token Name *
            </label>
            <input
              type="text"
              value={config.tokenName}
              onChange={handleChange("tokenName")}
              placeholder="e.g., GPT4Alt Access Token"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.tokenName ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.tokenName && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tokenName}
              </p>
            )}
          </div>

          {/* Token Symbol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token Symbol *
            </label>
            <input
              type="text"
              value={config.tokenSymbol}
              onChange={handleChange("tokenSymbol")}
              placeholder="e.g., GPT4A"
              maxLength={11}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.tokenSymbol ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Max 11 characters. Used as the token ticker.
            </p>
            {errors.tokenSymbol && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tokenSymbol}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Configuration */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-green-600" />
          Access & Pricing
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price per Inference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price per Inference (USDC) *
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              max="1000"
              value={config.pricePerInference}
              onChange={handleChange("pricePerInference")}
              placeholder="0.01"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.pricePerInference ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.pricePerInference && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.pricePerInference}
              </p>
            )}
          </div>

          {/* Minimum Tokens for Access */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Tokens for Access *
            </label>
            <input
              type="number"
              min="0"
              value={config.minimumTokensForAccess}
              onChange={handleChange("minimumTokensForAccess")}
              placeholder="1"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.minimumTokensForAccess
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Tokens required to access the model
            </p>
            {errors.minimumTokensForAccess && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.minimumTokensForAccess}
              </p>
            )}
          </div>

          {/* Initial Token Supply */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Token Supply *
            </label>
            <input
              type="number"
              min="1"
              value={config.initialTokenSupply}
              onChange={handleChange("initialTokenSupply")}
              placeholder="1000000"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.initialTokenSupply ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.initialTokenSupply && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.initialTokenSupply}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Token Settings */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Advanced Token Settings
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Supply (Optional)
            </label>
            <input
              type="number"
              min="1"
              value={config.maxSupply || ""}
              onChange={handleChange("maxSupply")}
              placeholder="Leave empty for unlimited"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Maximum tokens that can ever exist
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                id="mintable"
                type="checkbox"
                checked={config.mintable}
                onChange={handleChange("mintable")}
                disabled={disabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <label
                htmlFor="mintable"
                className="ml-2 block text-sm text-gray-900"
              >
                Allow minting new tokens
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="burnable"
                type="checkbox"
                checked={config.burnable}
                onChange={handleChange("burnable")}
                disabled={disabled}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:cursor-not-allowed"
              />
              <label
                htmlFor="burnable"
                className="ml-2 block text-sm text-gray-900"
              >
                Allow burning tokens
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Pricing Summary</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div className="flex justify-between">
                <span>Price per inference:</span>
                <span className="font-medium">
                  ${config.pricePerInference} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span>Minimum tokens required:</span>
                <span className="font-medium">
                  {config.minimumTokensForAccess} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span>Est. token purchase price:</span>
                <span className="font-medium">${estimatedTokenPrice} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Initial supply:</span>
                <span className="font-medium">
                  {parseInt(config.initialTokenSupply).toLocaleString()} tokens
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Encryption Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">
              Encryption & Access Control
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Your model will be encrypted using Lighthouse's Kavach SDK before
              upload. Only users with the required DAO tokens will be able to
              decrypt and access your model. This ensures your intellectual
              property is protected while enabling controlled access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
