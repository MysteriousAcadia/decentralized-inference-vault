// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Errors
 * @dev Library containing all custom error definitions for the DIV platform
 */
library Errors {
    // ModelAccessToken errors
    error InvalidModelOwner();
    error InvalidMaxSupply();
    error InvalidAccessThreshold();
    error InvalidPremiumThreshold();
    error ExceedsMaxSupply();
    error InsufficientBalance();
    error PublicMintingDisabled();
    error InsufficientPayment();
    error InvalidAmount();
    error InvalidAddress();

    // ModelVault errors
    error ModelAlreadyExists();
    error ModelNotFound();
    error InvalidModelId();
    error InvalidCID();
    error InvalidTokenContract();
    error PriceBelowMinimum();
    error NotAuthorizedToRegister();
    error NotModelOwner();
    error ModelNotActive();
    error ModelAlreadyActive();
    error ModelAlreadyInactive();
    error FeeTooHigh();
    error InvalidRecipient();

    // PaymentStream errors
    error TokenNotSupported();
    error InsufficientTokenBalance();
    error TokenAlreadySupported();
    error CannotRemoveETH();
    error AmountBelowMinimum();
    error AmountAboveMaximum();
    error ModelOwnerMismatch();
    error NoFundsToWithdraw();
    error InvalidMinimumAmount();
    error InvalidMaximumAmount();

    // General errors
    error Unauthorized();
    error Paused();
    error AlreadyInitialized();
    error InvalidConfiguration();
}

/**
 * @title Events
 * @dev Library containing all event definitions for the DIV platform
 */
library Events {
    // ModelAccessToken events
    event ModelTokenDeployed(
        address indexed tokenContract,
        string indexed modelId,
        address indexed modelOwner,
        uint256 maxSupply
    );

    event AccessThresholdUpdated(
        address indexed tokenContract,
        uint256 oldThreshold,
        uint256 newThreshold
    );

    event PremiumThresholdUpdated(
        address indexed tokenContract,
        uint256 oldThreshold,
        uint256 newThreshold
    );

    // ModelVault events
    event ModelCategoryAdded(uint8 indexed categoryId, string name);
    event ModelTagAdded(string tag);
    event ModelVersionUpdated(
        bytes32 indexed modelId,
        string oldVersion,
        string newVersion
    );

    // PaymentStream events
    event PaymentMethodAdded(address indexed token, string symbol);
    event PaymentMethodRemoved(address indexed token);
    event UserBalanceUpdated(
        address indexed user,
        address indexed token,
        uint256 newBalance
    );
    event EarningsWithdrawn(
        address indexed modelOwner,
        address indexed token,
        uint256 amount
    );

    // Platform events
    event PlatformConfigUpdated(
        string parameter,
        uint256 oldValue,
        uint256 newValue
    );
    event EmergencyAction(address indexed executor, string action, bytes data);
}
