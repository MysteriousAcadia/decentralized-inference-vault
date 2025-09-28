import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        address: string;
        signature: string;
    };
}
/**
 * Middleware to verify wallet signature for authentication
 */
export declare const authenticateWallet: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to verify wallet signature for GET requests (using headers)
 */
export declare const authenticateWalletHeader: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Optional authentication middleware - doesn't fail if no auth provided
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Generate a message for the user to sign
 */
export declare const generateAuthMessage: (address: string, timestamp: number) => string;
/**
 * Utility function to create authentication headers for requests
 */
export declare const createAuthHeaders: (address: string, signature: string, message: string, timestamp: number) => {
    'x-wallet-address': string;
    'x-wallet-signature': string;
    'x-wallet-message': string;
    'x-wallet-timestamp': string;
};
