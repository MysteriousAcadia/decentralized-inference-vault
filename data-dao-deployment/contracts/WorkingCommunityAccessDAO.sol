// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IDataCoin.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICommunityAccessDAO {
    event AccessPurchased(address indexed user, uint256 amount, uint256 duration, uint256 newExpiry);
    event RewardMinted(address indexed user, uint256 amount);
    event SecondsPerTokenUpdated(uint256 old, uint256 newRate);
    event RewardRateUpdated(uint256 old, uint256 newRate);
    event TreasuryUpdated(address old, address newTreasury);
    event Withdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed prev, address indexed next);

    function setSecondsPerToken(uint256 newRate) external;
    function setRewardRate(uint256 newRate) external;
    function setTreasury(address newTreasury) external;
    function withdraw(uint256 amount, address to) external;
    function transferOwnership(address newOwner) external;
    function buyAccess(uint256 paymentAmount, address recipient) external;
    function hasAccess(address user) external view returns (bool);
    function paymentToken() external view returns (address);
    function rewardToken() external view returns (address);
    function secondsPerToken() external view returns (uint256);
    function rewardRate() external view returns (uint256);
    function treasury() external view returns (address);
    function owner() external view returns (address);
}

contract WorkingCommunityAccessDAO is ICommunityAccessDAO {
    using SafeERC20 for IERC20;

    IERC20 private _paymentToken;
    IDataCoin private _dataCoin;
    uint256 public override secondsPerToken;
    uint256 private _rewardRate;
    address public override treasury;
    address public override owner;

    mapping(address => uint256) private _expiry;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor(
        address paymentToken_,
        address dataCoin_,
        uint256 secondsPerToken_,
        uint256 rewardRate_,
        address treasury_,
        address owner_
    ) {
        require(paymentToken_ != address(0), "ZERO_PAYMENT");
        require(dataCoin_ != address(0), "ZERO_DATA");
        require(secondsPerToken_ > 0, "ZERO_RATE");
        require(rewardRate_ > 0, "ZERO_REWARD");
        require(treasury_ != address(0), "ZERO_TREASURY");
        require(owner_ != address(0), "ZERO_OWNER");

        _paymentToken = IERC20(paymentToken_);
        _dataCoin = IDataCoin(dataCoin_);
        secondsPerToken = secondsPerToken_;
        _rewardRate = rewardRate_;
        treasury = treasury_;
        owner = owner_;
    }

    function _normalize(uint256 amount) private pure returns (uint256) {
        // Normalize token amount to 18 decimals for consistent reward calculation
        // For simplicity, assuming 18 decimals
        return amount;
    }

    function buyAccess(uint256 paymentAmount, address recipient) external override {
        require(paymentAmount > 0, "ZERO_AMOUNT");
        require(recipient != address(0), "ZERO_RECIPIENT");

        // Pull funds
        _paymentToken.safeTransferFrom(msg.sender, address(this), paymentAmount);

        uint256 duration = paymentAmount * secondsPerToken;

        uint256 currentExpiry = _expiry[recipient];
        uint256 newExpiry;
        if (currentExpiry > block.timestamp) {
            newExpiry = currentExpiry + duration;
        } else {
            newExpiry = block.timestamp + duration;
        }
        _expiry[recipient] = newExpiry;

        // Reward mint: Use direct interface call instead of low-level call
        uint256 normalized = _normalize(paymentAmount);
        uint256 reward = normalized * _rewardRate / (10**18); // Proper scaling
        if (reward > 0) {
            try _dataCoin.mint(recipient, reward) {
                emit RewardMinted(recipient, reward);
            } catch {
                // If minting fails, we don't revert the whole transaction
                // This allows the access purchase to succeed even if rewards fail
                emit RewardMinted(recipient, 0); // Log that reward minting failed
            }
        }

        emit AccessPurchased(recipient, paymentAmount, duration, newExpiry);
    }

    function setSecondsPerToken(uint256 newRate) external override onlyOwner {
        require(newRate > 0, "ZERO_RATE");
        uint256 old = secondsPerToken;
        secondsPerToken = newRate;
        emit SecondsPerTokenUpdated(old, newRate);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "ZERO_TREASURY");
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(old, newTreasury);
    }

    function withdraw(uint256 amount, address to) external override onlyOwner {
        require(to != address(0), "ZERO_TO");
        uint256 balance = _paymentToken.balanceOf(address(this));
        require(amount <= balance, "INSUFFICIENT_BAL");
        _paymentToken.safeTransfer(to, amount);
        emit Withdraw(to, amount);
    }

    function transferOwnership(address newOwner) external override onlyOwner {
        require(newOwner != address(0), "ZERO_OWNER");
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "ZERO_REWARD_RATE");
        uint256 old = _rewardRate;
        _rewardRate = newRate;
        emit RewardRateUpdated(old, newRate);
    }

    function ownerMint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "ZERO_TO");
        require(amount > 0, "ZERO_AMOUNT");
        try _dataCoin.mint(to, amount) {
            emit RewardMinted(to, amount);
        } catch {
            revert("OWNER_MINT_FAIL");
        }
    }

    // View Functions
    function hasAccess(address user) external view override returns (bool) {
        return _expiry[user] >= block.timestamp;
    }

    function paymentToken() external view override returns (address) {
        return address(_paymentToken);
    }

    function rewardToken() external view override returns (address) {
        return address(_dataCoin);
    }

    function rewardRate() external view override returns (uint256) {
        return _rewardRate;
    }

    function expiry(address user) external view returns (uint256) {
        return _expiry[user];
    }
}