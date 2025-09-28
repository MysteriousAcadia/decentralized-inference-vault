// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {MockDataCoin} from "../MockDataCoin.sol";
import {IDataCoinFactory} from "../interfaces/IDataCoinFactory.sol";

contract MockDataCoinFactory is IDataCoinFactory {
    address[] public coins;

    function createDataCoin(
        string memory name,
        string memory symbol,
        string memory tokenURI,
        address, // creator - unused in mock
        uint256, // creatorAllocationBps
        uint256, // creatorVestingDuration
        uint256, // contributorsAllocationBps
        uint256, // liquidityAllocationBps
        address, // lockToken
        uint256, // lockAmount
        bytes32 // salt
    ) external override returns (address coinAddr, address poolAddr) {
        MockDataCoin coin = new MockDataCoin(name, symbol, tokenURI);
        coinAddr = address(coin);
        poolAddr = address(0); // Mock pool address
    }

    // ============ View helpers (partial interface backward compatibility) ============
    function updateDataCoinCreator(
        address newCreator,
        address coinAddress
    ) external override {}

    function canWithdrawLPTokens(
        address
    ) external pure override returns (bool, uint256) {
        return (false, 0);
    }

    function dataCoinCreationFeeBPS() external pure override returns (uint256) {
        return 0;
    }

    function dataCoinInfo(
        address
    ) external pure override returns (DataCoinInfo memory) {
        return
            DataCoinInfo(
                address(0),
                address(0),
                address(0),
                address(0),
                0,
                0,
                false,
                0,
                false
            );
    }

    function getApprovedLockTokens()
        external
        pure
        override
        returns (address[] memory)
    {
        address[] memory empty;
        return empty;
    }

    function getLockableTokenConfig(
        address
    ) external pure override returns (AssetConfig memory) {
        return AssetConfig(false, 0, 0, 0, 0, 0);
    }

    function getMinLockAmount(
        address
    ) external pure override returns (uint256) {
        return 0;
    }
}
