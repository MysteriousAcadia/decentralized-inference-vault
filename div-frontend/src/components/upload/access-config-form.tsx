"use client";

import React from "react";
import {
  AlertCircle,
  Info,
  Shield,
  Lock,
  Settings,
  DollarSign,
} from "lucide-react";
import {
  AccessConfiguration,
  DataCoinEconomics,
  AccessMonetization,
  CHAIN_CONFIG,
} from "@/lib/upload-types";

interface AccessConfigFormProps {
  config: AccessConfiguration;
  dataCoinEconomics: DataCoinEconomics;
  accessMonetization: AccessMonetization;
  onChange: (config: Partial<AccessConfiguration>) => void;
  onEconomicsChange: (economics: Partial<DataCoinEconomics>) => void;
  onMonetizationChange: (monetization: Partial<AccessMonetization>) => void;
  errors: Record<string, string>;
  disabled?: boolean;
  selectedChain?: string;
}

export function AccessConfigForm({
  config,
  dataCoinEconomics,
  accessMonetization,
  onChange,
  onEconomicsChange,
  onMonetizationChange,
  errors,
  disabled = false,
  selectedChain = "polygon",
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

  const handleEconomicsChange = React.useCallback(
    (field: keyof DataCoinEconomics) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onEconomicsChange({ [field]: value });
      },
    [onEconomicsChange]
  );

  const handleMonetizationChange = React.useCallback(
    (field: keyof AccessMonetization) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = e.target.value;
        onMonetizationChange({ [field]: value });
      },
    [onMonetizationChange]
  );

  // Calculate total allocation percentage
  const totalAllocation = React.useMemo(() => {
    const creator = parseFloat(dataCoinEconomics.creatorAllocationPct) || 0;
    const contributors =
      parseFloat(dataCoinEconomics.contributorsAllocationPct) || 0;
    const liquidity = parseFloat(dataCoinEconomics.liquidityAllocationPct) || 0;
    return creator + contributors + liquidity;
  }, [dataCoinEconomics]);

  // Get payment token address for selected chain
  const paymentTokenAddress = React.useMemo(() => {
    const chainConfig =
      CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG];
    return chainConfig?.usdc || "";
  }, [selectedChain]);

  // Auto-set payment token when chain changes
  React.useEffect(() => {
    if (paymentTokenAddress && !accessMonetization.paymentToken) {
      onMonetizationChange({ paymentToken: paymentTokenAddress });
    }
  }, [
    paymentTokenAddress,
    accessMonetization.paymentToken,
    onMonetizationChange,
  ]);

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

      {/* DataCoin Economics */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Settings className="h-4 w-4 text-purple-600" />
          DataCoin Economics & Token Allocation
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creator Allocation (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={dataCoinEconomics.creatorAllocationPct}
              onChange={handleEconomicsChange("creatorAllocationPct")}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.creatorAllocationPct
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.creatorAllocationPct && (
              <p className="mt-1 text-xs text-red-600">
                {errors.creatorAllocationPct}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contributors Allocation (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={dataCoinEconomics.contributorsAllocationPct}
              onChange={handleEconomicsChange("contributorsAllocationPct")}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.contributorsAllocationPct
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.contributorsAllocationPct && (
              <p className="mt-1 text-xs text-red-600">
                {errors.contributorsAllocationPct}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liquidity Allocation (%) *
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={dataCoinEconomics.liquidityAllocationPct}
              onChange={handleEconomicsChange("liquidityAllocationPct")}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.liquidityAllocationPct
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.liquidityAllocationPct && (
              <p className="mt-1 text-xs text-red-600">
                {errors.liquidityAllocationPct}
              </p>
            )}
          </div>
        </div>

        {/* Total allocation warning */}
        <div
          className={`mb-4 p-2 rounded ${
            totalAllocation > 100
              ? "bg-red-50 border border-red-200"
              : totalAllocation === 100
              ? "bg-green-50 border border-green-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}
        >
          <p
            className={`text-sm ${
              totalAllocation > 100
                ? "text-red-700"
                : totalAllocation === 100
                ? "text-green-700"
                : "text-yellow-700"
            }`}
          >
            Total allocation: {totalAllocation.toFixed(1)}%
            {totalAllocation > 100 && " (exceeds 100%)"}
            {totalAllocation < 100 &&
              ` (${(100 - totalAllocation).toFixed(1)}% unallocated)`}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creator Vesting Period (Days) *
            </label>
            <input
              type="number"
              min="0"
              value={dataCoinEconomics.creatorVestingDays}
              onChange={handleEconomicsChange("creatorVestingDays")}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.creatorVestingDays ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of days before creator tokens are fully vested
            </p>
            {errors.creatorVestingDays && (
              <p className="mt-1 text-xs text-red-600">
                {errors.creatorVestingDays}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lock Token Address (Optional)
            </label>
            <input
              type="text"
              value={dataCoinEconomics.lockToken || ""}
              onChange={handleEconomicsChange("lockToken")}
              placeholder="0x..."
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.lockToken ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Token to lock during DataCoin creation
            </p>
            {errors.lockToken && (
              <p className="mt-1 text-xs text-red-600">{errors.lockToken}</p>
            )}
          </div>

          {dataCoinEconomics.lockToken && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lock Amount *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={dataCoinEconomics.lockAmount || ""}
                onChange={handleEconomicsChange("lockAmount")}
                disabled={disabled}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.lockAmount ? "border-red-500" : "border-gray-300"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Amount of tokens to lock (in token units)
              </p>
              {errors.lockAmount && (
                <p className="mt-1 text-xs text-red-600">{errors.lockAmount}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Access Monetization */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          Access Monetization & Rewards
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Token *
            </label>
            <input
              type="text"
              value={accessMonetization.paymentToken}
              onChange={handleMonetizationChange("paymentToken")}
              placeholder="0x... (USDC address)"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.paymentToken ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Token used for payments (default: USDC for {selectedChain})
            </p>
            {errors.paymentToken && (
              <p className="mt-1 text-xs text-red-600">{errors.paymentToken}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seconds per Payment Token *
            </label>
            <input
              type="number"
              min="1"
              value={accessMonetization.secondsPerToken}
              onChange={handleMonetizationChange("secondsPerToken")}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.secondsPerToken ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Access duration per 1 payment token (3600 = 1 hour)
            </p>
            {errors.secondsPerToken && (
              <p className="mt-1 text-xs text-red-600">
                {errors.secondsPerToken}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DataCoin Reward Rate *
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={accessMonetization.rewardRate}
              onChange={handleMonetizationChange("rewardRate")}
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.rewardRate ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              DataCoin minted per payment token (1.0 = 1:1 ratio)
            </p>
            {errors.rewardRate && (
              <p className="mt-1 text-xs text-red-600">{errors.rewardRate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Treasury Address (Optional)
            </label>
            <input
              type="text"
              value={accessMonetization.treasury || ""}
              onChange={handleMonetizationChange("treasury")}
              placeholder="0x... (defaults to your address)"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.treasury ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Address to receive payment tokens (defaults to your wallet)
            </p>
            {errors.treasury && (
              <p className="mt-1 text-xs text-red-600">{errors.treasury}</p>
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
