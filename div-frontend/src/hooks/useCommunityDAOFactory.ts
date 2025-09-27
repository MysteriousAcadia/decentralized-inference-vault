"use client";

import { useWriteContract, useAccount } from "wagmi";
import { encodePacked, keccak256, parseEther } from "viem";
import factoryABI from "@/abi/CommunityAccessDAOFactory.json";
import {
  DataCoinEconomics,
  AccessMonetization,
  AccessConfiguration,
  CHAIN_CONFIG,
} from "@/lib/upload-types";

interface UseCommunityDAOFactoryParams {
  chainId: number;
  factoryAddress?: string;
}

export function useCommunityDAOFactory({
  chainId,
  factoryAddress,
}: UseCommunityDAOFactoryParams) {
  const { address: userAddress } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const getChainConfig = (chainName: string) => {
    const config = CHAIN_CONFIG[chainName as keyof typeof CHAIN_CONFIG];
    if (!config) {
      throw new Error(`Unsupported chain: ${chainName}`);
    }
    return config;
  };

  const generateSalt = (name: string, symbol: string): string => {
    const timestamp = Date.now().toString();
    const saltString = `${name}_${symbol}_${timestamp}`;
    return keccak256(encodePacked(["string"], [saltString]));
  };

  const convertToDataCoinParams = (
    economics: DataCoinEconomics,
    accessConfig: AccessConfiguration,
    tokenURI?: string
  ) => {
    // Convert percentages to basis points (multiply by 100)
    const creatorAllocationBps = Math.floor(
      parseFloat(economics.creatorAllocationPct) * 100
    );
    const contributorsAllocationBps = Math.floor(
      parseFloat(economics.contributorsAllocationPct) * 100
    );
    const liquidityAllocationBps = Math.floor(
      parseFloat(economics.liquidityAllocationPct) * 100
    );

    // Convert vesting days to seconds
    const creatorVestingDuration =
      parseInt(economics.creatorVestingDays) * 24 * 60 * 60;

    // Generate salt if not provided
    const salt =
      economics.salt ||
      generateSalt(accessConfig.tokenName, accessConfig.tokenSymbol);

    // Convert lock amount if provided (assume 18 decimals for now)
    const lockAmount = economics.lockAmount
      ? parseEther(economics.lockAmount)
      : 0n;

    return {
      name: accessConfig.tokenName,
      symbol: accessConfig.tokenSymbol,
      tokenURI: tokenURI || economics.tokenURI || "",
      creatorAllocationBps: BigInt(creatorAllocationBps),
      creatorVestingDuration: BigInt(creatorVestingDuration),
      contributorsAllocationBps: BigInt(contributorsAllocationBps),
      liquidityAllocationBps: BigInt(liquidityAllocationBps),
      lockToken:
        economics.lockToken && economics.lockToken !== ""
          ? (economics.lockToken as `0x${string}`)
          : ("0x0000000000000000000000000000000000000000" as `0x${string}`),
      lockAmount,
      salt: salt as `0x${string}`,
    };
  };

  const convertToAccessParams = (
    monetization: AccessMonetization,
    chainName: string
  ) => {
    const chainConfig = getChainConfig(chainName);

    return {
      paymentToken: (monetization.paymentToken ||
        chainConfig.usdc) as `0x${string}`,
      secondsPerToken: BigInt(parseInt(monetization.secondsPerToken)),
      rewardRate: BigInt(
        Math.floor(parseFloat(monetization.rewardRate) * 1e18)
      ), // Convert to 18 decimals
      treasury: (monetization.treasury || userAddress) as `0x${string}`,
    };
  };

  const validateParameters = (
    economics: DataCoinEconomics,
    accessConfig: AccessConfiguration,
    monetization: AccessMonetization
  ): string[] => {
    const errors: string[] = [];

    // Validate allocations sum to <= 100%
    const totalAllocation =
      parseFloat(economics.creatorAllocationPct) +
      parseFloat(economics.contributorsAllocationPct) +
      parseFloat(economics.liquidityAllocationPct);

    if (totalAllocation > 100) {
      errors.push("Total allocations cannot exceed 100%");
    }

    // Validate required fields
    if (!accessConfig.tokenName.trim()) {
      errors.push("Token name is required");
    }

    if (!accessConfig.tokenSymbol.trim()) {
      errors.push("Token symbol is required");
    }

    if (
      !monetization.secondsPerToken ||
      parseInt(monetization.secondsPerToken) <= 0
    ) {
      errors.push("Seconds per token must be greater than 0");
    }

    if (!monetization.rewardRate || parseFloat(monetization.rewardRate) <= 0) {
      errors.push("Reward rate must be greater than 0");
    }

    // Validate lock token if provided
    if (economics.lockToken && economics.lockToken !== "") {
      if (!economics.lockToken.match(/^0x[a-fA-F0-9]{40}$/)) {
        errors.push("Invalid lock token address");
      }

      if (!economics.lockAmount || parseFloat(economics.lockAmount) <= 0) {
        errors.push("Lock amount is required when lock token is specified");
      }
    }

    return errors;
  };

  const deployDAO = async (
    economics: DataCoinEconomics,
    accessConfig: AccessConfiguration,
    monetization: AccessMonetization,
    chainName: string,
    tokenURI?: string
  ) => {
    if (!factoryAddress) {
      throw new Error("Factory address not configured for this chain");
    }

    if (!userAddress) {
      throw new Error("Wallet not connected");
    }

    // Validate parameters
    const validationErrors = validateParameters(
      economics,
      accessConfig,
      monetization
    );
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
    }

    try {
      // Convert parameters to contract format
      const datacoinParams = convertToDataCoinParams(
        economics,
        accessConfig,
        tokenURI
      );
      const accessParams = convertToAccessParams(monetization, chainName);

      // Call contract
      return writeContract({
        address: factoryAddress as `0x${string}`,
        abi: factoryABI,
        functionName: "createCommunityAccessDAO",
        args: [datacoinParams, accessParams],
      });
    } catch (error) {
      console.error("Failed to deploy DAO:", error);
      throw error;
    }
  };

  const estimateGas = async (
    economics: DataCoinEconomics,
    accessConfig: AccessConfiguration,
    monetization: AccessMonetization,
    chainName: string,
    tokenURI?: string
  ) => {
    // This would use simulateContract to estimate gas
    // For now, return a rough estimate
    return {
      gasLimit: 2000000n, // Rough estimate
      maxFeePerGas: parseEther("0.00002"), // 20 gwei
    };
  };

  return {
    deployDAO,
    estimateGas,
    hash,
    isPending,
    error,
    generateSalt,
    validateParameters,
    getChainConfig,
  };
}
