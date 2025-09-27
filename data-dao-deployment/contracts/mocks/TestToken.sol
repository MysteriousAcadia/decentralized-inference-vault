// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestToken
 * @notice A simple ERC20 token for testing purposes that allows anyone to mint unlimited tokens
 * @dev This contract is intended for testing only - DO NOT use in production!
 * 
 * Features:
 * - Anyone can mint unlimited tokens to any address
 * - Standard ERC20 functionality (transfer, approve, etc.)
 * - 18 decimal places (standard)
 * - No access control or restrictions
 */
contract TestToken is ERC20 {
    
    /**
     * @notice Constructor to initialize the token with name and symbol
     * @param name_ The name of the token (e.g., "Test USDC")
     * @param symbol_ The symbol of the token (e.g., "TUSDC")
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        // Mint initial supply to deployer for convenience (1 million tokens)
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @notice Mint tokens to any address - completely permissionless
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (in wei, considering 18 decimals)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Convenience function to mint tokens with human-readable amounts
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint (will be multiplied by 10^18)
     */
    function mintTokens(address to, uint256 amount) external {
        _mint(to, amount * 10**decimals());
    }

    /**
     * @notice Mint tokens to the caller's address
     * @param amount The amount of tokens to mint (in wei, considering 18 decimals)
     */
    function mintToSelf(uint256 amount) external {
        _mint(msg.sender, amount);
    }

    /**
     * @notice Convenience function to mint tokens to caller with human-readable amounts
     * @param amount The amount of tokens to mint (will be multiplied by 10^18)
     */
    function mintTokensToSelf(uint256 amount) external {
        _mint(msg.sender, amount * 10**decimals());
    }

    /**
     * @notice Batch mint to multiple addresses with the same amount
     * @param recipients Array of addresses to mint tokens to
     * @param amount Amount of tokens to mint to each address (in wei)
     */
    function batchMint(address[] calldata recipients, uint256 amount) external {
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amount);
        }
    }

    /**
     * @notice Batch mint to multiple addresses with different amounts
     * @param recipients Array of addresses to mint tokens to
     * @param amounts Array of amounts corresponding to each recipient (in wei)
     */
    function batchMintDifferentAmounts(
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
        }
    }

    /**
     * @notice Airdrop function - mint same amount to multiple addresses
     * @param recipients Array of addresses to airdrop to
     * @param amountPerRecipient Amount to mint to each recipient (will be multiplied by 10^18)
     */
    function airdrop(address[] calldata recipients, uint256 amountPerRecipient) external {
        uint256 amount = amountPerRecipient * 10**decimals();
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amount);
        }
    }

    /**
     * @notice Emergency function to mint a large amount for testing
     * @param to Address to mint to
     */
    function mintMillion(address to) external {
        _mint(to, 1_000_000 * 10**decimals());
    }

    /**
     * @notice Burn tokens from any address (useful for testing scenarios)
     * @param from Address to burn tokens from
     * @param amount Amount to burn (in wei)
     */
    function burnFrom(address from, uint256 amount) external {
        _burn(from, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount to burn (in wei)
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Get token info in a single call
     * @return name_ Token name
     * @return symbol_ Token symbol
     * @return decimals_ Token decimals
     * @return totalSupply_ Total supply
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_, 
        uint8 decimals_, 
        uint256 totalSupply_
    ) {
        return (name(), symbol(), decimals(), totalSupply());
    }

    /**
     * @notice Get balance in human-readable format (divided by 10^18)
     * @param account Address to check balance for
     * @return Human-readable balance
     */
    function balanceOfTokens(address account) external view returns (uint256) {
        return balanceOf(account) / 10**decimals();
    }
}