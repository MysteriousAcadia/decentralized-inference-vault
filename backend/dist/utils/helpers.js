import winston from 'winston';
// Create logger instance
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    defaultMeta: { service: 'dao-file-access-backend' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});
// If we're not in production then log to the console with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest })`
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
/**
 * Utility function to validate Ethereum address
 */
export function isValidEthereumAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}
/**
 * Utility function to format file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * Utility function to generate secure random string
 */
export function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
/**
 * Utility function to sanitize filename
 */
export function sanitizeFilename(filename) {
    // Remove or replace dangerous characters
    return filename
        .replace(/[^a-z0-9.-]/gi, '_') // Replace non-alphanumeric chars with underscore
        .replace(/_{2,}/g, '_') // Replace multiple underscores with single
        .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
        .toLowerCase();
}
/**
 * Utility function to check if a string is a valid JSON
 */
export function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch (e) {
        return false;
    }
}
/**
 * Utility function to sleep for a given number of milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Utility function to retry an async operation
 */
export async function retry(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            logger.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);
            if (attempt < maxRetries) {
                await sleep(delay * attempt); // Exponential backoff
            }
        }
    }
    throw lastError;
}
/**
 * Utility function to validate environment variables
 */
export function validateEnvironment() {
    const errors = [];
    const requiredEnvVars = [
        'PRIVATE_KEY',
        'PUBLIC_KEY',
        'ETHEREUM_RPC_URL'
    ];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            errors.push(`Missing required environment variable: ${envVar}`);
        }
    }
    // Validate Ethereum address format for PUBLIC_KEY
    if (process.env.PUBLIC_KEY && !isValidEthereumAddress(process.env.PUBLIC_KEY)) {
        errors.push('PUBLIC_KEY must be a valid Ethereum address');
    }
    // Validate private key format
    if (process.env.PRIVATE_KEY && !/^0x[a-fA-F0-9]{64}$/.test(process.env.PRIVATE_KEY)) {
        errors.push('PRIVATE_KEY must be a valid 64-character hex string starting with 0x');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * Utility function to format timestamp
 */
export function formatTimestamp(timestamp) {
    return new Date(timestamp).toISOString();
}
/**
 * Utility function to get current timestamp
 */
export function getCurrentTimestamp() {
    return Date.now();
}
/**
 * Utility function to check if timestamp is within valid range
 */
export function isTimestampValid(timestamp, maxAgeMs = 300000) {
    const now = getCurrentTimestamp();
    const diff = Math.abs(now - timestamp);
    return diff <= maxAgeMs;
}
//# sourceMappingURL=helpers.js.map