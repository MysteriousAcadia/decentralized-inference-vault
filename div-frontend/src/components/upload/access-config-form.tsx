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
  validateDataCoinEconomics,
} from "@/lib/upload-types";
import { useCommunityDAOFactory } from "@/hooks/useCommunityDAOFactory";

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
  selectedChain = "ethereum", // Default to ethereum for Sepolia
}: AccessConfigFormProps) {
  // Get factory configuration for fetching minimum lock amounts
  const chainConfig = CHAIN_CONFIG[selectedChain as keyof typeof CHAIN_CONFIG];
  const factoryAddress = chainConfig?.factoryAddress;
  const chainId = selectedChain === "ethereum" ? 11155111 : 137; // Sepolia or Polygon

  const { getMinLockAmountForToken } = useCommunityDAOFactory({
    chainId,
    factoryAddress,
  });

  // Fetch minimum lock amount for LSDC token
  const { minLockAmount, isLoading: isLoadingMinLock } =
    getMinLockAmountForToken(dataCoinEconomics.lockToken || "");
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

  // Auto-set minimum lock amount when it's fetched
  React.useEffect(() => {
    if (minLockAmount && !dataCoinEconomics.lockAmount) {
      onEconomicsChange({ lockAmount: minLockAmount });
    }
  }, [minLockAmount, dataCoinEconomics.lockAmount, onEconomicsChange]);

  // Enhanced error computation with minimum lock amount validation
  const enhancedErrors = React.useMemo(() => {
    const baseErrors = { ...errors };
    const economicsErrors = validateDataCoinEconomics(
      dataCoinEconomics,
      minLockAmount
    );

    // Override lock amount error if we have minimum amount validation
    if (economicsErrors.lockAmount && minLockAmount) {
      baseErrors.lockAmount = economicsErrors.lockAmount;
    }

    return baseErrors;
  }, [errors, dataCoinEconomics, minLockAmount]);

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
              placeholder="My AI Model Token"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                enhancedErrors.tokenName ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Name for your model token
            </p>
            {enhancedErrors.tokenName && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {enhancedErrors.tokenName}
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
              placeholder="MAIT"
              disabled={disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                enhancedErrors.tokenSymbol
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Short symbol for your token (e.g., BTC, ETH)
            </p>
            {enhancedErrors.tokenSymbol && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {enhancedErrors.tokenSymbol}
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
                enhancedErrors.pricePerInference
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {enhancedErrors.pricePerInference && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {enhancedErrors.pricePerInference}
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
                enhancedErrors.minimumTokensForAccess
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Tokens required to access the model
            </p>
            {enhancedErrors.minimumTokensForAccess && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {enhancedErrors.minimumTokensForAccess}
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
                enhancedErrors.initialTokenSupply
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {enhancedErrors.initialTokenSupply && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {enhancedErrors.initialTokenSupply}
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
                enhancedErrors.creatorAllocationPct
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {enhancedErrors.creatorAllocationPct && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.creatorAllocationPct}
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
                enhancedErrors.contributorsAllocationPct
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {enhancedErrors.contributorsAllocationPct && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.contributorsAllocationPct}
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
                enhancedErrors.liquidityAllocationPct
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {enhancedErrors.liquidityAllocationPct && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.liquidityAllocationPct}
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
                enhancedErrors.creatorVestingDays
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of days before creator tokens are fully vested
            </p>
            {enhancedErrors.creatorVestingDays && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.creatorVestingDays}
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
                enhancedErrors.lockToken ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Token to lock during DataCoin creation
            </p>
            {enhancedErrors.lockToken && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.lockToken}
              </p>
            )}
          </div>

          {dataCoinEconomics.lockToken && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lock Amount *
                {isLoadingMinLock && (
                  <span className="ml-2 text-xs text-blue-600">
                    Loading minimum amount...
                  </span>
                )}
              </label>
              <input
                type="number"
                min={minLockAmount || "0"}
                step="any"
                value={dataCoinEconomics.lockAmount || ""}
                onChange={handleEconomicsChange("lockAmount")}
                disabled={disabled || isLoadingMinLock}
                placeholder={
                  minLockAmount ? `Minimum: ${minLockAmount}` : "Loading..."
                }
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  enhancedErrors.lockAmount
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Amount of tokens to lock (in token units)
                {minLockAmount && (
                  <span className="block text-xs text-blue-600 mt-1">
                    Minimum required: {minLockAmount} tokens
                  </span>
                )}
              </p>
              {enhancedErrors.lockAmount && (
                <p className="mt-1 text-xs text-red-600">
                  {enhancedErrors.lockAmount}
                </p>
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
                enhancedErrors.paymentToken
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Token used for payments (default: USDC for {selectedChain})
            </p>
            {enhancedErrors.paymentToken && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.paymentToken}
              </p>
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
                enhancedErrors.secondsPerToken
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Access duration per 1 payment token (3600 = 1 hour)
            </p>
            {enhancedErrors.secondsPerToken && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.secondsPerToken}
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
                enhancedErrors.rewardRate ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              DataCoin minted per payment token (1.0 = 1:1 ratio)
            </p>
            {enhancedErrors.rewardRate && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.rewardRate}
              </p>
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
                enhancedErrors.treasury ? "border-red-500" : "border-gray-300"
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Address to receive payment tokens (defaults to your wallet)
            </p>
            {enhancedErrors.treasury && (
              <p className="mt-1 text-xs text-red-600">
                {enhancedErrors.treasury}
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
