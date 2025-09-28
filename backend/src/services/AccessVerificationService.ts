import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import lighthouse from '@lighthouse-web3/sdk';

dotenv.config();

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

// ABI for CommunityAccessDAO contract
const COMMUNITY_ACCESS_DAO_ABI = [
  "function hasAccess(address user) external view returns (bool)",
  "function paymentToken() external view returns (address)", 
  "function treasury() external view returns (address)",
  "function secondsPerToken() external view returns (uint256)",
  "function rewardRate() external view returns (uint256)",
  "function dataCoin() external view returns (address)",
  "function getAccessExpiry(address user) external view returns (uint256)"
];

// ABI for CommunityAccessDAOFactory contract (truncated - only what we need)
const FACTORY_ABI = [
  "function getAllDAOs() external view returns (address[])",
  "function getDAOsByOwner(address owner) external view returns (address[])", 
  "function ownerOf(address dao) external view returns (address)"
];

export class AccessVerificationService {
  private provider: ethers.JsonRpcProvider;
  private factoryContract: ethers.Contract;
  private factoryAddress: string;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    if (!rpcUrl) {
      throw new Error('ETHEREUM_RPC_URL environment variable is required');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.factoryAddress = process.env.COMMUNITY_ACCESS_DAO_FACTORY_ADDRESS || '0xEB37A065E20D0BB04b161B1d2985065Fb242866a';
    this.factoryContract = new ethers.Contract(this.factoryAddress, FACTORY_ABI, this.provider);
  }

  /**
   * Check if a user has access to any DAO they own or have purchased access to
   */
  async checkUserAccess(userAddress: string): Promise<AccessCheckResult> {
    try {
      // Validate address format
      if (!ethers.isAddress(userAddress)) {
        return {
          hasAccess: false,
          message: 'Invalid Ethereum address format',
          userAddress
        };
      }

      // Check DAOs owned by the user
      const ownedDAOs = await this.factoryContract.getDAOsByOwner(userAddress);
      
      if (ownedDAOs && ownedDAOs.length > 0) {
        // User owns DAOs, so they have access to files they uploaded
        return {
          hasAccess: true,
          message: `User owns ${ownedDAOs.length} DAO(s)`,
          userAddress,
          daoAddress: ownedDAOs[0] // Return first DAO as example
        };
      }

      // Check if user has purchased access to any DAO
      const allDAOs = await this.factoryContract.getAllDAOs();
      
      for (const daoAddress of allDAOs) {
        const hasAccess = await this.checkDAOAccess(daoAddress, userAddress);
        if (hasAccess.hasAccess) {
          return hasAccess;
        }
      }

      return {
        hasAccess: false,
        message: 'User has no access to any DAO',
        userAddress
      };

    } catch (error) {
      console.error('Error checking user access:', error);
      return {
        hasAccess: false,
        message: `Error verifying access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userAddress
      };
    }
  }

  /**
   * Check if a user has access to a specific DAO
   */
  async checkDAOAccess(daoAddress: string, userAddress: string): Promise<AccessCheckResult> {
    try {
      if (!ethers.isAddress(daoAddress) || !ethers.isAddress(userAddress)) {
        return {
          hasAccess: false,
          message: 'Invalid address format',
          userAddress
        };
      }

      const daoContract = new ethers.Contract(daoAddress, COMMUNITY_ACCESS_DAO_ABI, this.provider);

      // Check if user is the owner of the DAO
      const owner = await this.factoryContract.ownerOf(daoAddress);
      if (owner.toLowerCase() === userAddress.toLowerCase()) {
        return {
          hasAccess: true,
          message: 'User is the owner of this DAO',
          userAddress,
          daoAddress
        };
      }

      // Check if user has purchased access
      const hasAccess = await daoContract.hasAccess(userAddress);
      
      if (hasAccess) {
        // Get access expiry to provide more info
        const expiry = await daoContract.getAccessExpiry(userAddress);
        const expiryDate = new Date(Number(expiry) * 1000);
        const isExpired = Date.now() > Number(expiry) * 1000;

        if (isExpired) {
          return {
            hasAccess: false,
            message: `Access expired on ${expiryDate.toISOString()}`,
            userAddress,
            daoAddress
          };
        }

        return {
          hasAccess: true,
          message: `User has valid access until ${expiryDate.toISOString()}`,
          userAddress,
          daoAddress
        };
      }

      return {
        hasAccess: false,
        message: 'User has not purchased access to this DAO',
        userAddress,
        daoAddress
      };

    } catch (error) {
      console.error('Error checking DAO access:', error);
      return {
        hasAccess: false,
        message: `Error verifying DAO access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        userAddress,
        daoAddress
      };
    }
  }

  /**
   * Get information about a specific DAO
   */
  async getDAOInfo(daoAddress: string): Promise<DAOInfo | null> {
    try {
      if (!ethers.isAddress(daoAddress)) {
        throw new Error('Invalid DAO address format');
      }

      const daoContract = new ethers.Contract(daoAddress, COMMUNITY_ACCESS_DAO_ABI, this.provider);

      const [paymentToken, treasury, secondsPerToken, rewardRate, dataCoinAddress] = await Promise.all([
        daoContract.paymentToken(),
        daoContract.treasury(),
        daoContract.secondsPerToken(),
        daoContract.rewardRate(),
        daoContract.dataCoin()
      ]);

      return {
        address: daoAddress,
        dataCoinAddress,
        paymentToken,
        secondsPerToken: Number(secondsPerToken),
        rewardRate: rewardRate.toString(),
        treasury
      };

    } catch (error) {
      console.error('Error getting DAO info:', error);
      return null;
    }
  }

  /**
   * Get all DAOs owned by a user
   */
  async getUserDAOs(userAddress: string): Promise<string[]> {
    try {
      if (!ethers.isAddress(userAddress)) {
        throw new Error('Invalid user address format');
      }

      return await this.factoryContract.getDAOsByOwner(userAddress);
    } catch (error) {
      console.error('Error getting user DAOs:', error);
      return [];
    }
  }

  /**
   * Get all DAOs in the system
   */
  async getAllDAOs(): Promise<string[]> {
    try {
      return await this.factoryContract.getAllDAOs();
    } catch (error) {
      console.error('Error getting all DAOs:', error);
      return [];
    }
  }
}