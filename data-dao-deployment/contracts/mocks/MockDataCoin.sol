// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IDataCoin} from "../interfaces/IDataCoin.sol";

contract MockDataCoin is IDataCoin {
    string private _name;
    string private _symbol;
    string private _tokenURI;
    uint8 public constant decimals = 18;

    address public creatorAddress;
    address public poolAddress_; // unused for mock

    uint256 public constant MAX_SUPPLY = type(uint256).max; // unconstrained for mock

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Roles (simplified)
    bytes32 private constant _DEFAULT_ADMIN_ROLE = keccak256("DEFAULT_ADMIN_ROLE");
    bytes32 private constant _MINTER_ROLE = keccak256("MINTER_ROLE");
    mapping(bytes32 => mapping(address => bool)) private _roles;

    constructor(string memory name_, string memory symbol_, string memory tokenURI_, address creator_) {
        _name = name_;
        _symbol = symbol_;
        _tokenURI = tokenURI_;
        creatorAddress = creator_;
        _roles[_DEFAULT_ADMIN_ROLE][creator_] = true;
    }

    // Basic ERC20-like
    function approve(address spender, uint256 amount) external override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external override returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        require(allowed >= amount, "ALLOW");
        _allowances[from][msg.sender] = allowed - amount;
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    function claimVesting() external pure override returns (uint256) { return 0; }

    function mint(address to, uint256 amount) external override {
        require(hasRole(_MINTER_ROLE, msg.sender), "NO_MINTER");
        _balances[to] += amount;
    }

    function updateCreator(address newCreator) external override { creatorAddress = newCreator; }
    function pauseMinting() external override {}
    function unpauseMinting() external override {}
    function grantRole(bytes32 role, address account) external override { require(hasRole(_DEFAULT_ADMIN_ROLE, msg.sender), "NO_ADMIN"); _roles[role][account] = true; }
    function revokeRole(bytes32 role, address account) external override { require(hasRole(_DEFAULT_ADMIN_ROLE, msg.sender), "NO_ADMIN"); _roles[role][account] = false; }
    function renounceRole(bytes32 role, address account) external override { require(account == msg.sender, "NOT_SELF"); _roles[role][account] = false; }
    function markInitialLiquidityAdded() external override {}

    function DEFAULT_ADMIN_ROLE() external pure override returns (bytes32) { return keccak256("DEFAULT_ADMIN_ROLE"); }
    function MINTER_ROLE() external pure override returns (bytes32) { return keccak256("MINTER_ROLE"); }
    function allowance(address owner_, address spender) external view override returns (uint256) { return _allowances[owner_][spender]; }
    function balanceOf(address account) external view override returns (uint256) { return _balances[account]; }
    function creator() external view override returns (address) { return creatorAddress; }
    function name() external view override returns (string memory) { return _name; }
    function symbol() external view override returns (string memory) { return _symbol; }
    function tokenURI() external view override returns (string memory) { return _tokenURI; }
    function getClaimableAmount() external pure override returns (uint256) { return 0; }
    function getVestingInfo() external pure override returns (VestingConfig memory) { return VestingConfig(0,0,0,0,address(0)); }
    function poolAddress() external view override returns (address) { return poolAddress_; }
    function getRemainingContributorsalloc() external pure override returns (uint256) { return 0; }
    function getLiquidityAlloc() external pure override returns (uint256) { return 0; }
    function confirmFactory() external override {}

    function hasRole(bytes32 role, address account) internal view returns (bool) { return _roles[role][account]; }
}
