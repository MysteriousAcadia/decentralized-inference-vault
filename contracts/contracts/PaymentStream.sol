// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ModelVault.sol";

/**
 * @title PaymentStream
 * @dev Commission-free P2P payment settlement system for AI inference services
 * @notice This contract handles direct payments between users and model owners
 */
contract PaymentStream is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");

    // Payment information structure
    struct Payment {
        bytes32 modelId;
        address user;
        address modelOwner;
        uint256 amount;
        address token; // ERC20 token used for payment (address(0) for ETH)
        uint256 timestamp;
        bool processed;
        string inferenceId; // Optional inference identifier
    }

    // Supported payment tokens
    struct SupportedToken {
        bool active;
        uint256 minAmount;
        uint256 maxAmount;
        string symbol;
        uint8 decimals;
    }

    // Storage
    ModelVault public immutable modelVault;
    mapping(address => uint256) public userBalances; // ETH balances
    mapping(address => mapping(address => uint256)) public tokenBalances; // ERC20 token balances
    mapping(bytes32 => Payment) public payments;
    mapping(address => SupportedToken) public supportedTokens;
    mapping(address => uint256) public totalEarnings; // Total earnings per model owner
    mapping(address => mapping(address => uint256)) public tokenEarnings; // Token earnings per model owner

    // Payment tracking
    bytes32[] public allPayments;
    mapping(address => bytes32[]) public userPayments;
    mapping(address => bytes32[]) public modelOwnerPayments;

    // Platform settings
    uint256 public platformFeePercentage; // Fee in basis points (e.g., 100 = 1%)
    address public feeRecipient;
    uint256 public minPaymentAmount;

    // Statistics
    uint256 public totalPayments;
    uint256 public totalVolume;
    mapping(address => uint256) public totalTokenVolume;

    // Events
    event Deposit(address indexed user, uint256 amount, address token);
    event Withdrawal(address indexed user, uint256 amount, address token);

    event PaymentProcessed(
        bytes32 indexed paymentId,
        bytes32 indexed modelId,
        address indexed user,
        address modelOwner,
        uint256 amount,
        address token,
        string inferenceId
    );

    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed user,
        uint256 amount,
        address token,
        string reason
    );

    event TokenAdded(address indexed token, string symbol, uint8 decimals);
    event TokenRemoved(address indexed token);
    event TokenConfigured(
        address indexed token,
        uint256 minAmount,
        uint256 maxAmount
    );

    /**
     * @dev Constructor sets up the payment system
     * @param _modelVault Address of the ModelVault contract
     * @param _admin Initial admin address
     * @param _feeRecipient Address to receive platform fees
     */
    constructor(address _modelVault, address _admin, address _feeRecipient) {
        require(_modelVault != address(0), "Invalid model vault address");
        require(_admin != address(0), "Invalid admin address");
        require(_feeRecipient != address(0), "Invalid fee recipient");

        modelVault = ModelVault(_modelVault);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(TREASURY_ROLE, _admin);

        feeRecipient = _feeRecipient;
        platformFeePercentage = 0; // Start commission-free
        minPaymentAmount = 0.0001 ether;

        // Add ETH as default supported "token" (address(0))
        supportedTokens[address(0)] = SupportedToken({
            active: true,
            minAmount: 0.0001 ether,
            maxAmount: 100 ether,
            symbol: "ETH",
            decimals: 18
        });
    }

    /**
     * @dev Deposit ETH to user balance
     */
    function deposit() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(
            msg.value >= supportedTokens[address(0)].minAmount,
            "Amount below minimum"
        );
        require(
            msg.value <= supportedTokens[address(0)].maxAmount,
            "Amount above maximum"
        );

        userBalances[msg.sender] += msg.value;

        emit Deposit(msg.sender, msg.value, address(0));
    }

    /**
     * @dev Deposit ERC20 tokens to user balance
     * @param token Token contract address
     * @param amount Amount to deposit
     */
    function depositToken(
        address token,
        uint256 amount
    ) external nonReentrant whenNotPaused {
        require(supportedTokens[token].active, "Token not supported");
        require(amount > 0, "Deposit amount must be greater than 0");
        require(
            amount >= supportedTokens[token].minAmount,
            "Amount below minimum"
        );
        require(
            amount <= supportedTokens[token].maxAmount,
            "Amount above maximum"
        );

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        tokenBalances[msg.sender][token] += amount;

        emit Deposit(msg.sender, amount, token);
    }

    /**
     * @dev Withdraw ETH from user balance
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(userBalances[msg.sender] >= amount, "Insufficient balance");

        userBalances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);

        emit Withdrawal(msg.sender, amount, address(0));
    }

    /**
     * @dev Withdraw ERC20 tokens from user balance
     * @param token Token contract address
     * @param amount Amount to withdraw
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(
            tokenBalances[msg.sender][token] >= amount,
            "Insufficient token balance"
        );

        tokenBalances[msg.sender][token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit Withdrawal(msg.sender, amount, token);
    }

    /**
     * @dev Process a payment for model inference
     * @param modelId Model identifier
     * @param user User making the payment
     * @param modelOwner Model owner receiving the payment
     * @param amount Payment amount
     * @param token Token address (address(0) for ETH)
     * @param inferenceId Optional inference identifier
     */
    function processPayment(
        bytes32 modelId,
        address user,
        address modelOwner,
        uint256 amount,
        address token,
        string memory inferenceId
    )
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
        returns (bytes32)
    {
        require(amount > 0, "Payment amount must be greater than 0");
        require(user != address(0), "Invalid user address");
        require(modelOwner != address(0), "Invalid model owner address");
        require(supportedTokens[token].active, "Token not supported");

        // Verify model exists and is active
        ModelVault.ModelInfo memory modelInfo = modelVault.getModelInfo(
            modelId
        );
        require(modelInfo.active, "Model is not active");
        require(modelInfo.owner == modelOwner, "Model owner mismatch");

        // Check user has sufficient balance
        if (token == address(0)) {
            require(userBalances[user] >= amount, "Insufficient ETH balance");
        } else {
            require(
                tokenBalances[user][token] >= amount,
                "Insufficient token balance"
            );
        }

        // Generate payment ID
        bytes32 paymentId = keccak256(
            abi.encodePacked(
                modelId,
                user,
                modelOwner,
                amount,
                token,
                block.timestamp,
                allPayments.length
            )
        );

        // Calculate platform fee
        uint256 platformFee = (amount * platformFeePercentage) / 10000;
        uint256 netAmount = amount - platformFee;

        // Deduct from user balance
        if (token == address(0)) {
            userBalances[user] -= amount;

            // Transfer to model owner and fee recipient
            if (netAmount > 0) {
                payable(modelOwner).transfer(netAmount);
                totalEarnings[modelOwner] += netAmount;
            }
            if (platformFee > 0) {
                payable(feeRecipient).transfer(platformFee);
            }

            totalVolume += amount;
        } else {
            tokenBalances[user][token] -= amount;

            // Transfer tokens to model owner and fee recipient
            if (netAmount > 0) {
                IERC20(token).safeTransfer(modelOwner, netAmount);
                tokenEarnings[modelOwner][token] += netAmount;
            }
            if (platformFee > 0) {
                IERC20(token).safeTransfer(feeRecipient, platformFee);
            }

            totalTokenVolume[token] += amount;
        }

        // Store payment record
        payments[paymentId] = Payment({
            modelId: modelId,
            user: user,
            modelOwner: modelOwner,
            amount: amount,
            token: token,
            timestamp: block.timestamp,
            processed: true,
            inferenceId: inferenceId
        });

        // Update tracking arrays
        allPayments.push(paymentId);
        userPayments[user].push(paymentId);
        modelOwnerPayments[modelOwner].push(paymentId);

        totalPayments++;

        // Record inference in ModelVault
        modelVault.recordInference(modelId, user, amount);

        emit PaymentProcessed(
            paymentId,
            modelId,
            user,
            modelOwner,
            amount,
            token,
            inferenceId
        );

        return paymentId;
    }

    /**
     * @dev Get user balance for ETH
     * @param user User address
     * @return uint256 User's ETH balance
     */
    function getBalance(address user) external view returns (uint256) {
        return userBalances[user];
    }

    /**
     * @dev Get user balance for specific token
     * @param user User address
     * @param token Token address
     * @return uint256 User's token balance
     */
    function getTokenBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return tokenBalances[user][token];
    }

    /**
     * @dev Get user's payment history
     * @param user User address
     * @return bytes32[] Array of payment IDs
     */
    function getUserPayments(
        address user
    ) external view returns (bytes32[] memory) {
        return userPayments[user];
    }

    /**
     * @dev Get model owner's payment history
     * @param modelOwner Model owner address
     * @return bytes32[] Array of payment IDs
     */
    function getModelOwnerPayments(
        address modelOwner
    ) external view returns (bytes32[] memory) {
        return modelOwnerPayments[modelOwner];
    }

    /**
     * @dev Add supported payment token
     * @param token Token contract address
     * @param symbol Token symbol
     * @param decimals Token decimals
     * @param minAmount Minimum payment amount
     * @param maxAmount Maximum payment amount
     */
    function addSupportedToken(
        address token,
        string memory symbol,
        uint8 decimals,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyRole(ADMIN_ROLE) {
        require(token != address(0), "Cannot add ETH as token");
        require(!supportedTokens[token].active, "Token already supported");
        require(minAmount > 0, "Minimum amount must be greater than 0");
        require(
            maxAmount > minAmount,
            "Maximum amount must be greater than minimum"
        );

        supportedTokens[token] = SupportedToken({
            active: true,
            minAmount: minAmount,
            maxAmount: maxAmount,
            symbol: symbol,
            decimals: decimals
        });

        emit TokenAdded(token, symbol, decimals);
    }

    /**
     * @dev Remove supported payment token
     * @param token Token contract address
     */
    function removeSupportedToken(address token) external onlyRole(ADMIN_ROLE) {
        require(token != address(0), "Cannot remove ETH");
        require(supportedTokens[token].active, "Token not supported");

        supportedTokens[token].active = false;

        emit TokenRemoved(token);
    }

    /**
     * @dev Configure token limits
     * @param token Token contract address
     * @param minAmount New minimum amount
     * @param maxAmount New maximum amount
     */
    function configureToken(
        address token,
        uint256 minAmount,
        uint256 maxAmount
    ) external onlyRole(ADMIN_ROLE) {
        require(supportedTokens[token].active, "Token not supported");
        require(minAmount > 0, "Minimum amount must be greater than 0");
        require(
            maxAmount > minAmount,
            "Maximum amount must be greater than minimum"
        );

        supportedTokens[token].minAmount = minAmount;
        supportedTokens[token].maxAmount = maxAmount;

        emit TokenConfigured(token, minAmount, maxAmount);
    }

    /**
     * @dev Set platform fee percentage (only admin)
     * @param feePercentage New fee percentage in basis points
     */
    function setPlatformFee(
        uint256 feePercentage
    ) external onlyRole(ADMIN_ROLE) {
        require(feePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = feePercentage;
    }

    /**
     * @dev Set fee recipient (only admin)
     * @param newRecipient New fee recipient address
     */
    function setFeeRecipient(
        address newRecipient
    ) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
    }

    /**
     * @dev Get platform statistics
     */
    function getPlatformStats()
        external
        view
        returns (
            uint256 _totalPayments,
            uint256 _totalVolume,
            uint256 _platformFeePercentage,
            address _feeRecipient
        )
    {
        return (
            totalPayments,
            totalVolume,
            platformFeePercentage,
            feeRecipient
        );
    }

    /**
     * @dev Emergency withdrawal (only treasury role)
     * @param token Token address (address(0) for ETH)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(TREASURY_ROLE) nonReentrant {
        if (token == address(0)) {
            require(
                address(this).balance >= amount,
                "Insufficient contract balance"
            );
            payable(msg.sender).transfer(amount);
        } else {
            IERC20 tokenContract = IERC20(token);
            require(
                tokenContract.balanceOf(address(this)) >= amount,
                "Insufficient token balance"
            );
            tokenContract.safeTransfer(msg.sender, amount);
        }
    }

    /**
     * @dev Pause contract (only admin)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (only admin)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Receive function to accept ether deposits
     */
    receive() external payable {
        if (msg.value > 0) {
            userBalances[msg.sender] += msg.value;
            emit Deposit(msg.sender, msg.value, address(0));
        }
    }
}
