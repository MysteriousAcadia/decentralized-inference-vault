// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {CommunityAccessDAO} from "./CommunityAccessDAO.sol";
import {IDataCoinFactory} from "./interfaces/IDataCoinFactory.sol";
import {IDataCoin} from "./interfaces/IDataCoin.sol";

/**
 * @title CommunityAccessDAOFactory
 * @notice Deploys CommunityAccessDAO instances and tracks ownership mappings for discovery.
 *         The msg.sender of createCommunityAccessDAO becomes the owner of the newly created DAO.
 */
contract CommunityAccessDAOFactory {
    // ============ Events ============
    event CommunityDAODeployed(
        address indexed owner,
        address daoAddress,
        address dataCoin,
        address paymentToken,
        uint256 secondsPerToken,
        uint256 rewardRate,
        address treasury,
        uint256 index
    );
    event TreasuryDefaultUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    // ============ Storage ============
    address[] public allDAOs; // list of all deployed DAO addresses
    mapping(address => address[]) public daosByOwner; // owner => DAO addresses
    mapping(address => address) public ownerOf; // dao => owner

    address public defaultTreasury; // optional default treasury fallback
    IDataCoinFactory public dataCoinFactory; // factory for creating DataCoins

    // ============ Constructor ============
    constructor(address _defaultTreasury, address _dataCoinFactory) {
        defaultTreasury = _defaultTreasury; // can be zero; if zero caller must provide explicit treasury
        dataCoinFactory = IDataCoinFactory(_dataCoinFactory);
    }

    // ============ External Functions ============

    /**
     * @notice Deploy a new CommunityAccessDAO.
     * @param paymentToken ERC20 token address used for payment (e.g., USDC)
     * @param secondsPerToken Seconds of access per 1 raw token unit (e.g., 3600 for 1 token = 1 hour)
     * @param treasury Treasury address; if set to address(0) and factory has defaultTreasury, that value is used.
     */
    struct DataCoinParams {
        string name;
        string symbol;
        string tokenURI;
        uint256 creatorAllocationBps;
        uint256 creatorVestingDuration;
        uint256 contributorsAllocationBps;
        uint256 liquidityAllocationBps;
        address lockToken;
        uint256 lockAmount;
        bytes32 salt;
    }

    struct AccessParams {
        address paymentToken;
        uint256 secondsPerToken;
        uint256 rewardRate;
        address treasury;
    }

    function createCommunityAccessDAO(
        DataCoinParams memory dc,
        AccessParams memory ap
    ) external returns (address daoAddress, address dataCoinAddr) {
        address _treasury = ap.treasury;
        if (_treasury == address(0)) {
            require(defaultTreasury != address(0), "TREASURY_REQUIRED");
            _treasury = defaultTreasury;
        }

        dataCoinAddr = _createDataCoin(dc);

        // Deploy DAO referencing that DataCoin
        CommunityAccessDAO dao = new CommunityAccessDAO(
            ap.paymentToken,
            dataCoinAddr,
            ap.secondsPerToken,
            ap.rewardRate,
            _treasury
        );
        daoAddress = address(dao);

        allDAOs.push(daoAddress);
        daosByOwner[msg.sender].push(daoAddress);
        ownerOf[daoAddress] = msg.sender;

        emit CommunityDAODeployed(
            msg.sender,
            daoAddress,
            dataCoinAddr,
            ap.paymentToken,
            ap.secondsPerToken,
            ap.rewardRate,
            _treasury,
            allDAOs.length - 1
        );
    }

    // Internal helper to isolate stack depth
    function _createDataCoin(
        DataCoinParams memory dc
    ) internal returns (address coinAddr) {
        (coinAddr, ) = dataCoinFactory.createDataCoin(
            dc.name,
            dc.symbol,
            dc.tokenURI,
            msg.sender,
            dc.creatorAllocationBps,
            dc.creatorVestingDuration,
            dc.contributorsAllocationBps,
            dc.liquidityAllocationBps,
            dc.lockToken,
            dc.lockAmount,
            dc.salt
        );
    }

    // ============ Admin-Lite (Factory Ownerless) ============

    function updateDefaultTreasury(address newTreasury) external {
        // Intentionally permissionless? If you want restriction, add an owner.
        address old = defaultTreasury;
        defaultTreasury = newTreasury;
        emit TreasuryDefaultUpdated(old, newTreasury);
    }

    // ============ View Helpers ============

    function getAllDAOs() external view returns (address[] memory) {
        return allDAOs;
    }

    function getDAOsByOwner(
        address owner_
    ) external view returns (address[] memory) {
        return daosByOwner[owner_];
    }
}
