import { ethers } from 'ethers';
/**
 * Middleware to verify wallet signature for authentication
 */
export const authenticateWallet = async (req, res, next) => {
    try {
        const { address, signature, message, timestamp } = req.body;
        // Check if all required fields are present
        if (!address || !signature || !message || !timestamp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required authentication fields: address, signature, message, timestamp'
            });
        }
        // Validate address format
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Ethereum address format'
            });
        }
        // Check timestamp to prevent replay attacks (5 minutes window)
        const currentTime = Date.now();
        const messageTime = parseInt(timestamp);
        const timeDifference = Math.abs(currentTime - messageTime);
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        if (timeDifference > FIVE_MINUTES_MS) {
            return res.status(401).json({
                success: false,
                message: 'Message timestamp is too old or invalid'
            });
        }
        // Verify the signature
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid signature - recovered address does not match provided address'
                });
            }
            // Add user info to request object
            req.user = {
                address: address.toLowerCase(),
                signature
            };
            next();
        }
        catch (signatureError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid signature format or verification failed'
            });
        }
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};
/**
 * Middleware to verify wallet signature for GET requests (using headers)
 */
export const authenticateWalletHeader = async (req, res, next) => {
    try {
        const address = req.headers['x-wallet-address'];
        const signature = req.headers['x-wallet-signature'];
        const message = req.headers['x-wallet-message'];
        const timestamp = req.headers['x-wallet-timestamp'];
        // Check if all required fields are present
        if (!address || !signature || !message || !timestamp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required authentication headers: x-wallet-address, x-wallet-signature, x-wallet-message, x-wallet-timestamp'
            });
        }
        // Validate address format
        if (!ethers.isAddress(address)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Ethereum address format'
            });
        }
        // Check timestamp to prevent replay attacks (5 minutes window)
        const currentTime = Date.now();
        const messageTime = parseInt(timestamp);
        const timeDifference = Math.abs(currentTime - messageTime);
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        if (timeDifference > FIVE_MINUTES_MS) {
            return res.status(401).json({
                success: false,
                message: 'Message timestamp is too old or invalid'
            });
        }
        // Verify the signature
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid signature - recovered address does not match provided address'
                });
            }
            // Add user info to request object
            req.user = {
                address: address.toLowerCase(),
                signature
            };
            next();
        }
        catch (signatureError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid signature format or verification failed'
            });
        }
    }
    catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};
/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const address = req.headers['x-wallet-address'];
        const signature = req.headers['x-wallet-signature'];
        const message = req.headers['x-wallet-message'];
        const timestamp = req.headers['x-wallet-timestamp'];
        // If no auth headers provided, continue without authentication
        if (!address || !signature || !message || !timestamp) {
            return next();
        }
        // If headers provided, validate them
        if (!ethers.isAddress(address)) {
            return next(); // Continue without auth if invalid format
        }
        // Check timestamp
        const currentTime = Date.now();
        const messageTime = parseInt(timestamp);
        const timeDifference = Math.abs(currentTime - messageTime);
        const FIVE_MINUTES_MS = 5 * 60 * 1000;
        if (timeDifference > FIVE_MINUTES_MS) {
            return next(); // Continue without auth if timestamp invalid
        }
        // Verify signature
        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);
            if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
                // Valid authentication - add user info
                req.user = {
                    address: address.toLowerCase(),
                    signature
                };
            }
        }
        catch (signatureError) {
            // Continue without auth if signature verification fails
        }
        next();
    }
    catch (error) {
        console.error('Optional auth middleware error:', error);
        next(); // Continue without auth on error
    }
};
/**
 * Generate a message for the user to sign
 */
export const generateAuthMessage = (address, timestamp) => {
    return `Sign this message to authenticate with DAO File Access Backend.\n\nAddress: ${address}\nTimestamp: ${timestamp}\n\nThis signature will be valid for 5 minutes.`;
};
/**
 * Utility function to create authentication headers for requests
 */
export const createAuthHeaders = (address, signature, message, timestamp) => {
    return {
        'x-wallet-address': address,
        'x-wallet-signature': signature,
        'x-wallet-message': message,
        'x-wallet-timestamp': timestamp.toString()
    };
};
//# sourceMappingURL=auth.js.map