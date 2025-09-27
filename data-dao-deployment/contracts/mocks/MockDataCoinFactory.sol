// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {MockDataCoin} from "./MockDataCoin.sol";
import {IDataCoinFactory} from "../interfaces/IDataCoinFactory.sol";

contract MockDataCoinFactory is IDataCoinFactory {
    address[] public coins;

    function createDataCoin(
        string memory name,
        string memory symbol,
        string memory tokenURI,
        address creator,
        uint256,
        uint256,
        uint256,
        uint256,
        address,
        uint256,
        bytes32
    ) external override returns (address coinAddress, address poolAddress) {
        // ignore economic params in mock
        MockDataCoin coin = new MockDataCoin(name, symbol, tokenURI, creator);
        coinAddress = address(coin);
        poolAddress = address(0);
        coins.push(coinAddress);
    }

    // ============ View helpers (partial interface backward compatibility) ============
    function updateDataCoinCreator(address newCreator, address coinAddress) external override {}
    function canWithdrawLPTokens(address) external pure override returns (bool, uint256) { return (false, 0); }
    function dataCoinCreationFeeBPS() external pure override returns (uint256) { return 0; }
    function dataCoinInfo(address) external pure override returns (DataCoinInfo memory) { return DataCoinInfo(address(0),address(0),address(0),address(0),0,0,false,0,false); }
    function getApprovedLockTokens() external pure override returns (address[] memory) { address[] memory empty; return empty; }
    function getLockableTokenConfig(address) external pure override returns (AssetConfig memory) { return AssetConfig(false,0,0,0,0,0); }
    function getMinLockAmount(address) external pure override returns (uint256) { return 0; }
}
