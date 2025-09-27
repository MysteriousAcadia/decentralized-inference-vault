// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ModelAccessToken
 * @dev ERC-20 token representing Data DAO membership for model access
 * @notice This token provides gated access to AI models based on balance thresholds
 */
contract ModelAccessToken is ERC20, AccessControl, ReentrancyGuard, Pausable {
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Access control thresholds
    uint256 public accessThreshold;
    uint256 public premiumThreshold;

    // Model metadata
    string public modelId;
    string public modelName;
    string public modelDescription;
    address public modelOwner;

    // Token economics
    uint256 public maxSupply;
    uint256 public mintPrice; // Price in wei per token
    bool public publicMintEnabled;

    // Events
    event AccessThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event PremiumThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PublicMintToggled(bool enabled);
    event TokensMinted(address indexed to, uint256 amount, uint256 cost);
    event TokensBurned(address indexed from, uint256 amount);

    /**
     * @dev Constructor sets up the token with initial parameters
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _modelId Unique identifier for the associated AI model
     * @param _modelName Human-readable model name
     * @param _modelOwner Address of the model owner
     * @param _maxSupply Maximum number of tokens that can be minted
     * @param _accessThreshold Minimum tokens required for basic access
     * @param _premiumThreshold Minimum tokens required for premium access
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _modelId,
        string memory _modelName,
        string memory _modelDescription,
        address _modelOwner,
        uint256 _maxSupply,
        uint256 _accessThreshold,
        uint256 _premiumThreshold
    ) ERC20(_name, _symbol) {
        require(_modelOwner != address(0), "Invalid model owner");
        require(_maxSupply > 0, "Max supply must be greater than 0");
        require(
            _accessThreshold > 0,
            "Access threshold must be greater than 0"
        );
        require(
            _premiumThreshold >= _accessThreshold,
            "Premium threshold must be >= access threshold"
        );

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _modelOwner);
        _grantRole(ADMIN_ROLE, _modelOwner);
        _grantRole(MINTER_ROLE, _modelOwner);
        _grantRole(PAUSER_ROLE, _modelOwner);

        // Initialize parameters
        modelId = _modelId;
        modelName = _modelName;
        modelDescription = _modelDescription;
        modelOwner = _modelOwner;
        maxSupply = _maxSupply;
        accessThreshold = _accessThreshold;
        premiumThreshold = _premiumThreshold;
        mintPrice = 0.001 ether; // Default mint price
        publicMintEnabled = false;
    }

    /**
     * @dev Mint tokens to a specific address
     * @param to Address to mint tokens to
     * @param amount Number of tokens to mint
     */
    function mint(
        address to,
        uint256 amount
    ) external onlyRole(MINTER_ROLE) nonReentrant whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount, 0);
    }

    /**
     * @dev Public mint function allowing users to purchase tokens directly
     * @param amount Number of tokens to mint
     */
    function publicMint(
        uint256 amount
    ) external payable nonReentrant whenNotPaused {
        require(publicMintEnabled, "Public minting is disabled");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");

        uint256 totalCost = amount * mintPrice;
        require(msg.value >= totalCost, "Insufficient payment");

        _mint(msg.sender, amount);

        // Transfer payment to model owner
        if (totalCost > 0) {
            payable(modelOwner).transfer(totalCost);
        }

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit TokensMinted(msg.sender, amount, totalCost);
    }

    /**
     * @dev Burn tokens from a specific address
     * @param from Address to burn tokens from
     * @param amount Number of tokens to burn
     */
    function burn(
        address from,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");

        _burn(from, amount);
        emit TokensBurned(from, amount);
    }

    /**
     * @dev Check if a user has basic access based on token balance
     * @param user Address to check
     * @return bool True if user has sufficient tokens for access
     */
    function hasAccess(address user) external view returns (bool) {
        return balanceOf(user) >= accessThreshold;
    }

    /**
     * @dev Check if a user has access based on custom minimum balance
     * @param user Address to check
     * @param minimumBalance Custom minimum balance requirement
     * @return bool True if user has sufficient tokens
     */
    function hasAccess(
        address user,
        uint256 minimumBalance
    ) external view returns (bool) {
        return balanceOf(user) >= minimumBalance;
    }

    /**
     * @dev Check if a user has premium access
     * @param user Address to check
     * @return bool True if user has sufficient tokens for premium access
     */
    function hasPremiumAccess(address user) external view returns (bool) {
        return balanceOf(user) >= premiumThreshold;
    }

    /**
     * @dev Set the access threshold (only admin)
     * @param threshold New access threshold
     */
    function setAccessThreshold(
        uint256 threshold
    ) external onlyRole(ADMIN_ROLE) {
        require(threshold > 0, "Threshold must be greater than 0");
        require(
            threshold <= premiumThreshold,
            "Access threshold cannot exceed premium threshold"
        );

        uint256 oldThreshold = accessThreshold;
        accessThreshold = threshold;
        emit AccessThresholdUpdated(oldThreshold, threshold);
    }

    /**
     * @dev Set the premium threshold (only admin)
     * @param threshold New premium threshold
     */
    function setPremiumThreshold(
        uint256 threshold
    ) external onlyRole(ADMIN_ROLE) {
        require(
            threshold >= accessThreshold,
            "Premium threshold must be >= access threshold"
        );

        uint256 oldThreshold = premiumThreshold;
        premiumThreshold = threshold;
        emit PremiumThresholdUpdated(oldThreshold, threshold);
    }

    /**
     * @dev Set the mint price (only admin)
     * @param price New mint price in wei
     */
    function setMintPrice(uint256 price) external onlyRole(ADMIN_ROLE) {
        uint256 oldPrice = mintPrice;
        mintPrice = price;
        emit MintPriceUpdated(oldPrice, price);
    }

    /**
     * @dev Toggle public minting (only admin)
     * @param enabled Whether public minting should be enabled
     */
    function setPublicMintEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        publicMintEnabled = enabled;
        emit PublicMintToggled(enabled);
    }

    /**
     * @dev Update model metadata (only admin)
     */
    function updateModelInfo(
        string memory _modelName,
        string memory _modelDescription
    ) external onlyRole(ADMIN_ROLE) {
        modelName = _modelName;
        modelDescription = _modelDescription;
    }

    /**
     * @dev Pause contract (only pauser)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (only pauser)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Withdraw contract balance to model owner (only admin)
     */
    function withdraw() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        payable(modelOwner).transfer(balance);
    }

    /**
     * @dev Get comprehensive token information
     */
    function getTokenInfo()
        external
        view
        returns (
            string memory _modelId,
            string memory _modelName,
            string memory _modelDescription,
            address _modelOwner,
            uint256 _totalSupply,
            uint256 _maxSupply,
            uint256 _accessThreshold,
            uint256 _premiumThreshold,
            uint256 _mintPrice,
            bool _publicMintEnabled
        )
    {
        return (
            modelId,
            modelName,
            modelDescription,
            modelOwner,
            totalSupply(),
            maxSupply,
            accessThreshold,
            premiumThreshold,
            mintPrice,
            publicMintEnabled
        );
    }

    /**
     * @dev Override transfer to add pause functionality
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Receive function to accept ether
     */
    receive() external payable {
        // Allow contract to receive ether
    }
}
