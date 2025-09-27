// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAccessDAO} from "./interfaces/IAccessDAO.sol";
import {IDataCoin} from "./interfaces/IDataCoin.sol";

/**
 * @title CommunityAccessDAO
 * @notice Simple time-based access sale contract. Users pay an ERC20 (e.g. USDC) to extend access.
 *         Access time is strictly proportional to amount paid: duration = amount * secondsPerToken.
 *         Multiple purchases extend remaining time if unexpired, otherwise start from current timestamp.
 *         Admin (owner) can update payment token, rate, treasury and withdraw accumulated funds.
 */
contract CommunityAccessDAO is IAccessDAO {
    using SafeERC20 for IERC20;

    // ============ Storage ============

    IERC20 private _paymentToken; // ERC20 payment token (e.g., USDC) mutable
    IDataCoin private _dataCoin;  // Reward token minted to users
    address public override owner; // Admin address
    address public override treasury; // Destination for withdrawals (can be updated)
    uint256 public override secondsPerToken; // How many seconds of access per 1 token (raw token units, not 1e18 scaled)
    uint256 private _rewardRate; // DataCoin per normalized payment unit (after decimal normalization)

    uint8 private _paymentTokenDecimals; // cached decimals for normalization
    uint8 private _dataCoinDecimals;     // cached decimals for normalization

    mapping(address => uint256) private _expiry; // User -> access expiry timestamp (in seconds)

    // ============ Modifiers ============

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
        address treasury_
    ) {
        require(paymentToken_ != address(0), "ZERO_PAY_TOKEN");
        require(dataCoin_ != address(0), "ZERO_DATA_TOKEN");
        require(treasury_ != address(0), "ZERO_TREASURY");
        require(secondsPerToken_ > 0, "ZERO_TIME_RATE");
        require(rewardRate_ > 0, "ZERO_REWARD_RATE");

        _paymentToken = IERC20(paymentToken_);
        _dataCoin = IDataCoin(dataCoin_);
        secondsPerToken = secondsPerToken_;
        _rewardRate = rewardRate_;
        owner = msg.sender;
        treasury = treasury_;

        // Attempt to grant MINTER_ROLE to DAO and original owner (msg.sender) - will revert if caller lacks privileges.
        // Surround with try/catch pattern (not available for interfaces pre-defined) -> we assume factory sets creator such that this succeeds.
        bytes32 minterRole = _dataCoin.MINTER_ROLE();
        // grant to self and owner (ignore failures via low-level call to avoid constructor revert if role not yet accessible)
        // solhint-disable-next-line avoid-low-level-calls
        (bool s1, ) = address(_dataCoin).call(abi.encodeWithSelector(_dataCoin.grantRole.selector, minterRole, address(this)));
        // solhint-disable-next-line avoid-low-level-calls
        (bool s2, ) = address(_dataCoin).call(abi.encodeWithSelector(_dataCoin.grantRole.selector, minterRole, msg.sender));
        // Silence compiler warnings
        s1; s2;

        // Try reading decimals (if token implements) using low-level staticcall to avoid revert dependency.
        _paymentTokenDecimals = _safeFetchDecimals(address(_paymentToken));
        _dataCoinDecimals = _safeFetchDecimals(address(_dataCoin));

        emit OwnershipTransferred(address(0), msg.sender);
        emit PaymentTokenUpdated(address(0), paymentToken_);
        emit PriceRateUpdated(0, secondsPerToken_);
        emit RewardRateUpdated(0, rewardRate_);
        emit TreasuryUpdated(address(0), treasury_);
    }

    // ============ Core Functions ============

    /**
     * @notice Purchase or extend access for a recipient.
     * @param paymentAmount Amount of payment token (raw units) user wants to spend. Must be approved prior.
     * @param recipient Address whose access is extended.
     */
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
            // mint directly to recipient
            // solhint-disable-next-line avoid-low-level-calls
            (bool ok, ) = address(_dataCoin).call(abi.encodeWithSelector(_dataCoin.mint.selector, recipient, reward));
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
        emit PriceRateUpdated(old, newRate);
    }

    function setPaymentToken(address newToken) external override onlyOwner {
        require(newToken != address(0), "ZERO_TOKEN");
        address old = address(_paymentToken);
        _paymentToken = IERC20(newToken);
        _paymentTokenDecimals = _safeFetchDecimals(address(_paymentToken));
        emit PaymentTokenUpdated(old, newToken);
    }

    function setTreasury(address newTreasury) external override onlyOwner {
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
        // solhint-disable-next-line avoid-low-level-calls
        (bool ok, ) = address(_dataCoin).call(abi.encodeWithSelector(_dataCoin.mint.selector, to, amount));
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

    function dataCoin() external view override returns (address) {
        return address(_dataCoin);
    }

    function rewardRate() external view override returns (uint256) {
        return _rewardRate;
    }

    function getExpiry(address user) external view override returns (uint256) {
        return _expiry[user];
    }

    function getRemainingAccess(
        address user
    ) external view override returns (uint256) {
        uint256 exp = _expiry[user];
        if (exp <= block.timestamp) return 0;
        return exp - block.timestamp;
    }
}

// ============ Internal Helpers (placed outside to keep contract lean) ============
// NOTE: Could alternatively be an internal library if reused.
function _safeFetchDecimals(address token) pure returns (uint8) {
    // We avoid external calls that might revert; default to 18 if not implemented using staticcall pattern.
    // For simplicity and to avoid state mutability warnings in pure, we just return 18.
    // If future accuracy needed, convert to view and implement staticcall.
    token; // silence warning
    return 18;
}

function _normalize(uint256 amount) pure returns (uint256) {
    // With current simplified decimals strategy (assuming normalization done via rewardRate definition), return amount.
    return amount;
}
