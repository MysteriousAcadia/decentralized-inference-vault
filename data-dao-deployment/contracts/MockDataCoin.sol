// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/IDataCoin.sol";

/**
 * @title MockDataCoin
 * @notice A mock implementation of IDataCoin for testing purposes
 */
contract MockDataCoin is ERC20, IDataCoin {
    
    address public override creator;
    string private _tokenURI;
    address public override poolAddress;
    
    bytes32 public constant override DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant override MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant override MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    
    mapping(address => bool) public minters;
    mapping(address => bool) public admins;
    
    bool public mintingPaused = false;
    bool public initialLiquidityAdded = false;
    
    VestingConfig private _vestingConfig;
    
    // Override ERC20 functions to satisfy IDataCoin interface
    function name() public view override(ERC20, IDataCoin) returns (string memory) {
        return super.name();
    }
    
    function symbol() public view override(ERC20, IDataCoin) returns (string memory) {
        return super.symbol();
    }
    
    function balanceOf(address account) public view override(ERC20, IDataCoin) returns (uint256) {
        return super.balanceOf(account);
    }
    
    function allowance(address owner, address spender) public view override(ERC20, IDataCoin) returns (uint256) {
        return super.allowance(owner, spender);
    }
    
    function approve(address spender, uint256 amount) public override(ERC20, IDataCoin) returns (bool) {
        return super.approve(spender, amount);
    }
    
    function transfer(address to, uint256 amount) public override(ERC20, IDataCoin) returns (bool) {
        return super.transfer(to, amount);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override(ERC20, IDataCoin) returns (bool) {
        return super.transferFrom(from, to, amount);
    }
    
    constructor(string memory name_, string memory symbol_, string memory tokenURI_) 
        ERC20(name_, symbol_) 
    {
        creator = msg.sender;
        _tokenURI = tokenURI_;
        admins[msg.sender] = true;
        minters[msg.sender] = true;
    }
    
    // ============ MINTER ROLE FUNCTIONS ============
    function mint(address to, uint256 amount) external override {
        require(minters[msg.sender], "NOT_MINTER");
        require(!mintingPaused, "MINTING_PAUSED");
        require(totalSupply() + amount <= MAX_SUPPLY, "EXCEEDS_MAX_SUPPLY");
        _mint(to, amount);
    }
    
    // ============ ADMIN FUNCTIONS ============
    function updateCreator(address newCreator) external override {
        require(admins[msg.sender], "NOT_ADMIN");
        creator = newCreator;
    }
    
    function pauseMinting() external override {
        require(admins[msg.sender], "NOT_ADMIN");
        mintingPaused = true;
    }
    
    function unpauseMinting() external override {
        require(admins[msg.sender], "NOT_ADMIN");
        mintingPaused = false;
    }
    
    function grantRole(bytes32 role, address account) external override {
        require(admins[msg.sender], "NOT_ADMIN");
        if (role == MINTER_ROLE) {
            minters[account] = true;
        } else if (role == DEFAULT_ADMIN_ROLE) {
            admins[account] = true;
        }
    }
    
    function revokeRole(bytes32 role, address account) external override {
        require(admins[msg.sender], "NOT_ADMIN");
        if (role == MINTER_ROLE) {
            minters[account] = false;
        } else if (role == DEFAULT_ADMIN_ROLE) {
            admins[account] = false;
        }
    }
    
    function renounceRole(bytes32 role, address account) external override {
        require(msg.sender == account, "CAN_ONLY_RENOUNCE_SELF");
        if (role == MINTER_ROLE) {
            minters[account] = false;
        } else if (role == DEFAULT_ADMIN_ROLE) {
            admins[account] = false;
        }
    }
    
    // ============ FACTORY ROLE FUNCTIONS ============
    function markInitialLiquidityAdded() external override {
        initialLiquidityAdded = true;
    }
    
    function confirmFactory() external override {
        // Mock implementation - does nothing
    }
    
    // ============ VESTING FUNCTIONS ============
    function claimVesting() external pure override returns (uint256) {
        // Mock implementation - no vesting for simplicity
        return 0;
    }
    
    // ============ VIEW FUNCTIONS ============
    function tokenURI() external view override returns (string memory) {
        return _tokenURI;
    }
    
    function getClaimableAmount() external pure override returns (uint256) {
        return 0;
    }
    
    function getVestingInfo() external view override returns (VestingConfig memory) {
        return _vestingConfig;
    }
    
    function getRemainingContributorsalloc() external pure override returns (uint256) {
        return 0;
    }
    
    function getLiquidityAlloc() external pure override returns (uint256) {
        return 0;
    }
    
    // ============ CONVENIENCE FUNCTIONS ============
    function mintTokens(address to, uint256 amount) external {
        require(minters[msg.sender], "NOT_MINTER");
        require(!mintingPaused, "MINTING_PAUSED");
        require(totalSupply() + amount <= MAX_SUPPLY, "EXCEEDS_MAX_SUPPLY");
        _mint(to, amount);
    }
    
    // Allow anyone to become a minter for testing purposes
    function becomeMinter() external {
        minters[msg.sender] = true;
    }
}