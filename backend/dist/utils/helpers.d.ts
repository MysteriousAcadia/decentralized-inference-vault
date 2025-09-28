import winston from 'winston';
export declare const logger: winston.Logger;
/**
 * Utility function to validate Ethereum address
 */
export declare function isValidEthereumAddress(address: string): boolean;
/**
 * Utility function to format file size
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Utility function to generate secure random string
 */
export declare function generateRandomString(length: number): string;
/**
 * Utility function to sanitize filename
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Utility function to check if a string is a valid JSON
 */
export declare function isValidJSON(str: string): boolean;
/**
 * Utility function to sleep for a given number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Utility function to retry an async operation
 */
export declare function retry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
/**
 * Utility function to validate environment variables
 */
export declare function validateEnvironment(): {
    isValid: boolean;
    errors: string[];
};
/**
 * Utility function to format timestamp
 */
export declare function formatTimestamp(timestamp: number): string;
/**
 * Utility function to get current timestamp
 */
export declare function getCurrentTimestamp(): number;
/**
 * Utility function to check if timestamp is within valid range
 */
export declare function isTimestampValid(timestamp: number, maxAgeMs?: number): boolean;
