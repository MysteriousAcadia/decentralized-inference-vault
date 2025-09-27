// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IAccessDAO {
    event AccessPurchased(
        address indexed user,
        uint256 amountPaid,
        uint256 durationGranted,
        uint256 newExpiry
    );
    event PriceRateUpdated(uint256 oldRate, uint256 newRate); // seconds per token
    event PaymentTokenUpdated(
        address indexed oldToken,
        address indexed newToken
    );
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    event Withdraw(address indexed to, uint256 amount);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event RewardRateUpdated(uint256 oldRate, uint256 newRate); // DataCoin per normalized payment unit
    event RewardMinted(address indexed recipient, uint256 rewardAmount);

    function buyAccess(uint256 paymentAmount, address recipient) external;

    function hasAccess(address user) external view returns (bool);

    function getExpiry(address user) external view returns (uint256);

    function getRemainingAccess(address user) external view returns (uint256);

    function owner() external view returns (address);

    function paymentToken() external view returns (address);

    function treasury() external view returns (address);

    function secondsPerToken() external view returns (uint256);
    function dataCoin() external view returns (address);
    function rewardRate() external view returns (uint256);

    function setSecondsPerToken(uint256 newRate) external;

    function setPaymentToken(address newToken) external;

    function setTreasury(address newTreasury) external;

    function withdraw(uint256 amount, address to) external;

    function transferOwnership(address newOwner) external;
    function setRewardRate(uint256 newRate) external;
    function ownerMint(address to, uint256 amount) external;
}
