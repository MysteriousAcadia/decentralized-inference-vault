// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./ModelAccessToken.sol";

/**
 * @title ModelVault
 * @dev Central registry for AI model metadata, pricing, and access management
 * @notice This contract manages the registration and lifecycle of AI models in the DIV platform
 */
contract ModelVault is AccessControl, ReentrancyGuard, Pausable {
    // Role definitions
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MODEL_OWNER_ROLE = keccak256("MODEL_OWNER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Model information structure
    struct ModelInfo {
        string cid; // IPFS CID of encrypted model
        address tokenContract; // Associated access token contract
        uint256 pricePerInference; // Cost per inference in wei
        address owner; // Model owner address
        bool active; // Model availability status
        uint256 totalInferences; // Total number of inferences performed
        uint256 createdAt; // Timestamp when model was registered
        uint256 updatedAt; // Last update timestamp
        string[] tags; // Model tags for categorization
        string version; // Model version
        uint256 minTokenBalance; // Minimum token balance required for access
    }

    // Model categories for organization
    enum ModelCategory {
        LANGUAGE_MODEL,
        IMAGE_GENERATION,
        IMAGE_CLASSIFICATION,
        AUDIO_PROCESSING,
        VIDEO_PROCESSING,
        MULTIMODAL,
        OTHER
    }

    // Storage
    mapping(bytes32 => ModelInfo) public models;
    mapping(address => bytes32[]) public ownerModels; // Models owned by each address
    mapping(ModelCategory => bytes32[]) public modelsByCategory;
    bytes32[] public allModelIds;

    // Statistics
    uint256 public totalModels;
    uint256 public totalInferences;
    uint256 public totalActiveModels;

    // Platform settings
    uint256 public platformFeePercentage; // Fee percentage (basis points, e.g., 100 = 1%)
    address public feeRecipient;
    uint256 public minPricePerInference;

    // Events
    event ModelRegistered(
        bytes32 indexed modelId,
        address indexed owner,
        address tokenContract,
        string cid,
        uint256 pricePerInference
    );

    event ModelUpdated(
        bytes32 indexed modelId,
        uint256 newPrice,
        bool active,
        uint256 timestamp
    );

    event ModelDeactivated(bytes32 indexed modelId, address indexed owner);
    event ModelReactivated(bytes32 indexed modelId, address indexed owner);

    event InferenceRecorded(
        bytes32 indexed modelId,
        address indexed user,
        uint256 cost,
        uint256 timestamp
    );

    event PriceUpdated(
        bytes32 indexed modelId,
        uint256 oldPrice,
        uint256 newPrice
    );

    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);

    /**
     * @dev Constructor sets up the contract with initial admin
     * @param _admin Initial admin address
     * @param _feeRecipient Address to receive platform fees
     */
    constructor(address _admin, address _feeRecipient) {
        require(_admin != address(0), "Invalid admin address");
        require(_feeRecipient != address(0), "Invalid fee recipient");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);

        feeRecipient = _feeRecipient;
        platformFeePercentage = 0; // Start with 0% platform fee (commission-free)
        minPricePerInference = 0.0001 ether; // Minimum 0.0001 ETH per inference
    }

    /**
     * @dev Register a new AI model
     * @param modelId Unique identifier for the model
     * @param cid IPFS CID of the encrypted model
     * @param tokenContract Address of the associated access token
     * @param pricePerInference Cost per inference in wei
     * @param category Model category
     * @param tags Array of tags for the model
     * @param version Model version string
     * @param minTokenBalance Minimum token balance required for access
     */
    function registerModel(
        bytes32 modelId,
        string memory cid,
        address tokenContract,
        uint256 pricePerInference,
        ModelCategory category,
        string[] memory tags,
        string memory version,
        uint256 minTokenBalance
    ) external nonReentrant whenNotPaused {
        require(modelId != bytes32(0), "Invalid model ID");
        require(bytes(cid).length > 0, "Invalid CID");
        require(tokenContract != address(0), "Invalid token contract");
        require(
            pricePerInference >= minPricePerInference,
            "Price below minimum"
        );
        require(models[modelId].owner == address(0), "Model already exists");

        // Verify the caller owns the token contract or has MODEL_OWNER_ROLE
        ModelAccessToken token = ModelAccessToken(tokenContract);
        require(
            token.modelOwner() == msg.sender ||
                hasRole(MODEL_OWNER_ROLE, msg.sender),
            "Not authorized to register this model"
        );

        // Create model info
        ModelInfo storage model = models[modelId];
        model.cid = cid;
        model.tokenContract = tokenContract;
        model.pricePerInference = pricePerInference;
        model.owner = msg.sender;
        model.active = true;
        model.totalInferences = 0;
        model.createdAt = block.timestamp;
        model.updatedAt = block.timestamp;
        model.tags = tags;
        model.version = version;
        model.minTokenBalance = minTokenBalance;

        // Update storage arrays
        allModelIds.push(modelId);
        ownerModels[msg.sender].push(modelId);
        modelsByCategory[category].push(modelId);

        // Update counters
        totalModels++;
        totalActiveModels++;

        emit ModelRegistered(
            modelId,
            msg.sender,
            tokenContract,
            cid,
            pricePerInference
        );
    }

    /**
     * @dev Update model pricing
     * @param modelId Model identifier
     * @param newPrice New price per inference
     */
    function updatePrice(
        bytes32 modelId,
        uint256 newPrice
    ) external onlyValidModel(modelId) onlyModelOwner(modelId) nonReentrant {
        require(newPrice >= minPricePerInference, "Price below minimum");

        uint256 oldPrice = models[modelId].pricePerInference;
        models[modelId].pricePerInference = newPrice;
        models[modelId].updatedAt = block.timestamp;

        emit PriceUpdated(modelId, oldPrice, newPrice);
        emit ModelUpdated(
            modelId,
            newPrice,
            models[modelId].active,
            block.timestamp
        );
    }

    /**
     * @dev Update model metadata
     * @param modelId Model identifier
     * @param cid New IPFS CID
     * @param tags New tags array
     * @param version New version string
     */
    function updateModelMetadata(
        bytes32 modelId,
        string memory cid,
        string[] memory tags,
        string memory version
    ) external onlyValidModel(modelId) onlyModelOwner(modelId) {
        models[modelId].cid = cid;
        models[modelId].tags = tags;
        models[modelId].version = version;
        models[modelId].updatedAt = block.timestamp;

        emit ModelUpdated(
            modelId,
            models[modelId].pricePerInference,
            models[modelId].active,
            block.timestamp
        );
    }

    /**
     * @dev Deactivate a model
     * @param modelId Model identifier
     */
    function deactivateModel(
        bytes32 modelId
    ) external onlyValidModel(modelId) onlyModelOwner(modelId) {
        require(models[modelId].active, "Model already inactive");

        models[modelId].active = false;
        models[modelId].updatedAt = block.timestamp;
        totalActiveModels--;

        emit ModelDeactivated(modelId, msg.sender);
        emit ModelUpdated(
            modelId,
            models[modelId].pricePerInference,
            false,
            block.timestamp
        );
    }

    /**
     * @dev Reactivate a model
     * @param modelId Model identifier
     */
    function reactivateModel(
        bytes32 modelId
    ) external onlyValidModel(modelId) onlyModelOwner(modelId) {
        require(!models[modelId].active, "Model already active");

        models[modelId].active = true;
        models[modelId].updatedAt = block.timestamp;
        totalActiveModels++;

        emit ModelReactivated(modelId, msg.sender);
        emit ModelUpdated(
            modelId,
            models[modelId].pricePerInference,
            true,
            block.timestamp
        );
    }

    /**
     * @dev Record an inference execution
     * @param modelId Model identifier
     * @param user User who requested the inference
     * @param cost Cost of the inference
     */
    function recordInference(
        bytes32 modelId,
        address user,
        uint256 cost
    ) external onlyValidModel(modelId) onlyRole(OPERATOR_ROLE) {
        require(models[modelId].active, "Model is not active");

        models[modelId].totalInferences++;
        totalInferences++;

        emit InferenceRecorded(modelId, user, cost, block.timestamp);
    }

    /**
     * @dev Get model information
     * @param modelId Model identifier
     * @return ModelInfo structure
     */
    function getModelInfo(
        bytes32 modelId
    ) external view onlyValidModel(modelId) returns (ModelInfo memory) {
        return models[modelId];
    }

    /**
     * @dev Get models by owner
     * @param owner Owner address
     * @return Array of model IDs
     */
    function getModelsByOwner(
        address owner
    ) external view returns (bytes32[] memory) {
        return ownerModels[owner];
    }

    /**
     * @dev Get models by category
     * @param category Model category
     * @return Array of model IDs
     */
    function getModelsByCategory(
        ModelCategory category
    ) external view returns (bytes32[] memory) {
        return modelsByCategory[category];
    }

    /**
     * @dev Get all model IDs (paginated)
     * @param offset Starting index
     * @param limit Maximum number of results
     * @return Array of model IDs
     */
    function getAllModels(
        uint256 offset,
        uint256 limit
    ) external view returns (bytes32[] memory) {
        require(offset < allModelIds.length, "Offset out of bounds");

        uint256 end = offset + limit;
        if (end > allModelIds.length) {
            end = allModelIds.length;
        }

        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = allModelIds[i];
        }

        return result;
    }

    /**
     * @dev Check if user has access to a model
     * @param modelId Model identifier
     * @param user User address
     * @return bool True if user has access
     */
    function hasAccess(
        bytes32 modelId,
        address user
    ) external view onlyValidModel(modelId) returns (bool) {
        ModelAccessToken token = ModelAccessToken(
            models[modelId].tokenContract
        );
        return token.hasAccess(user, models[modelId].minTokenBalance);
    }

    /**
     * @dev Set platform fee percentage (only admin)
     * @param feePercentage New fee percentage in basis points
     */
    function setPlatformFee(
        uint256 feePercentage
    ) external onlyRole(ADMIN_ROLE) {
        require(feePercentage <= 1000, "Fee too high"); // Max 10%

        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = feePercentage;

        emit PlatformFeeUpdated(oldFee, feePercentage);
    }

    /**
     * @dev Set minimum price per inference (only admin)
     * @param minPrice New minimum price
     */
    function setMinPricePerInference(
        uint256 minPrice
    ) external onlyRole(ADMIN_ROLE) {
        minPricePerInference = minPrice;
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
            uint256 _totalModels,
            uint256 _totalActiveModels,
            uint256 _totalInferences,
            uint256 _platformFeePercentage
        )
    {
        return (
            totalModels,
            totalActiveModels,
            totalInferences,
            platformFeePercentage
        );
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

    // Modifiers
    modifier onlyValidModel(bytes32 modelId) {
        require(models[modelId].owner != address(0), "Model does not exist");
        _;
    }

    modifier onlyModelOwner(bytes32 modelId) {
        require(
            models[modelId].owner == msg.sender ||
                hasRole(ADMIN_ROLE, msg.sender),
            "Not model owner or admin"
        );
        _;
    }

    /**
     * @dev Generate model ID from model parameters
     * @param owner Model owner address
     * @param name Model name
     * @param version Model version
     * @return bytes32 Generated model ID
     */
    function generateModelId(
        address owner,
        string memory name,
        string memory version
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner, name, version));
    }
}
