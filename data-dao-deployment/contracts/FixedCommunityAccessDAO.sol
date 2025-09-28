// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./interfaces/IDataCoin.sol";
import "./interfaces/IDataCoinFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICommunityAccessDAO {
    // Events
    event AccessPurchased(
        address indexed user,
        uint256 amount,
        uint256 duration,
        uint256 newExpiry
    );
    event RewardMinted(address indexed user, uint256 amount);
    event SecondsPerTokenUpdated(uint256 old, uint256 newRate);
    event RewardRateUpdated(uint256 old, uint256 newRate);
    event TreasuryUpdated(address old, address newTreasury);
    event Withdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed prev, address indexed next);

    // Admin Functions
    function setSecondsPerToken(uint256 newRate) external;
    function setRewardRate(uint256 newRate) external;
    function setTreasury(address newTreasury) external;
    function withdraw(uint256 amount, address to) external;
    function transferOwnership(address newOwner) external;

    // Core Functions
    function buyAccess(uint256 paymentAmount, address recipient) external;
    function hasAccess(address user) external view returns (bool);

    // View Functions
    function paymentToken() external view returns (address);
    function rewardToken() external view returns (address);
    function secondsPerToken() external view returns (uint256);
    function rewardRate() external view returns (uint256);
    function treasury() external view returns (address);
    function owner() external view returns (address);
}

contract FixedCommunityAccessDAO is ICommunityAccessDAO {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    IERC20 private _paymentToken;
    IDataCoin private _dataCoin;
    uint256 public override secondsPerToken; // 1 ether = 1 token
    uint256 private _rewardRate; // rewards per normalized unit (18 decimals)
    address public override treasury;
    address public override owner;

    mapping(address => uint256) private _expiry;

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    // ============ Constructor ============
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

    // ============ Internal Utils ============
    function _normalize(uint256 amount) private pure returns (uint256) {
        // Normalize token amount to 18 decimals for consistent reward calculation
        uint8 tokenDecimals = 18; // Assuming 18 decimals for simplicity
        if (tokenDecimals == 18) {
            return amount;
        } else if (tokenDecimals < 18) {
            return amount * (10 ** (18 - tokenDecimals));
        } else {
            return amount / (10 ** (tokenDecimals - 18));
        }
    }

    // ============ Core Functions ============
    function buyAccess(
        uint256 paymentAmount,
        address recipient
    ) external override {
        require(paymentAmount > 0, "ZERO_AMOUNT");
        require(recipient != address(0), "ZERO_RECIPIENT");

        // Pull funds
        _paymentToken.safeTransferFrom(
            msg.sender,
            address(this),
            paymentAmount
        );

        uint256 duration = paymentAmount * secondsPerToken; // access time

        uint256 currentExpiry = _expiry[recipient];
        uint256 newExpiry;
        if (currentExpiry > block.timestamp) {
            // Extend remaining time
            newExpiry = currentExpiry + duration;
        } else {
            // Start fresh from now
            newExpiry = block.timestamp + duration;
        }
        _expiry[recipient] = newExpiry;

        // Reward mint: normalize payment amount to 18-dec like domain across token decimals
        uint256 normalized = _normalize(paymentAmount);
        uint256 reward = normalized * _rewardRate; // rewardRate already accounts for DataCoin units per normalized unit
        if (reward > 0) {
            // FIXED: Use the correct function selector directly
            // solhint-disable-next-line avoid-low-level-calls
            (bool ok, ) = address(_dataCoin).call(
                abi.encodeWithSignature("mint(address,uint256)", recipient, reward)
            );
            require(ok, "MINT_FAIL");
            emit RewardMinted(recipient, reward);
        }

        emit AccessPurchased(recipient, paymentAmount, duration, newExpiry);
    }

    // ============ Admin Functions ============

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
        // FIXED: Use the correct function selector directly
        // solhint-disable-next-line avoid-low-level-calls
        (bool ok, ) = address(_dataCoin).call(
            abi.encodeWithSignature("mint(address,uint256)", to, amount)
        );
        require(ok, "MINT_FAIL");
        emit RewardMinted(to, amount);
    }

    // ============ View Functions ============

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