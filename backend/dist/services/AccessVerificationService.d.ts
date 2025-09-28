export interface AccessCheckResult {
    hasAccess: boolean;
    message: string;
    userAddress: string;
    daoAddress?: string;
    dataCoinAddress?: string;
}
export interface DAOInfo {
    address: string;
    dataCoinAddress: string;
    paymentToken: string;
    secondsPerToken: number;
    rewardRate: string;
    treasury: string;
}
export declare class AccessVerificationService {
    private provider;
    private factoryContract;
    private factoryAddress;
    constructor();
    /**
     * Check if a user has access to any DAO they own or have purchased access to
     */
    checkUserAccess(userAddress: string): Promise<AccessCheckResult>;
    /**
     * Check if a user has access to a specific DAO
     */
    checkDAOAccess(daoAddress: string, userAddress: string): Promise<AccessCheckResult>;
    /**
     * Get information about a specific DAO
     */
    getDAOInfo(daoAddress: string): Promise<DAOInfo | null>;
    /**
     * Get all DAOs owned by a user
     */
    getUserDAOs(userAddress: string): Promise<string[]>;
    /**
     * Get all DAOs in the system
     */
    getAllDAOs(): Promise<string[]>;
}
