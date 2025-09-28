import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import lighthouse from '@lighthouse-web3/sdk';

dotenv.config();

export interface FileDecryptionResult {
  success: boolean;
  message: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface FileMetadata {
  cid: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
}

export class LighthouseService {
  private publicKey: string;
  private privateKey: string;
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private downloadDir: string;

  constructor() {
    this.publicKey = process.env.PUBLIC_KEY || '';
    this.privateKey = process.env.PRIVATE_KEY || '';

    if (!this.publicKey || !this.privateKey) {
      throw new Error('PUBLIC_KEY and PRIVATE_KEY environment variables are required');
    }

    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/demo';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(this.privateKey, this.provider);

    // Create downloads directory if it doesn't exist
    this.downloadDir = path.join(process.cwd(), 'downloads');
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  /**
   * Sign authentication message for Lighthouse
   */
  private async signAuthMessage(publicKey: string, privateKey: string): Promise<string> {
    try {
      const authResponse = await lighthouse.getAuthMessage(publicKey);
      const messageRequested = authResponse?.data?.message;
      
      if (!messageRequested) {
        throw new Error('No message received from Lighthouse');
      }
      
      const signedMessage = await this.signer.signMessage(messageRequested);
      return signedMessage;
    } catch (error) {
      throw new Error(`Failed to sign auth message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download and decrypt a file from Lighthouse
   */
  async downloadFile(cid: string, customFileName?: string): Promise<FileDecryptionResult> {
    try {
      if (!cid) {
        return {
          success: false,
          message: 'CID is required',
          error: 'MISSING_CID'
        };
      }

      // Get file encryption key
      const signedMessage = await this.signAuthMessage(this.publicKey, this.privateKey);
      
      let fileEncryptionKey;
      try {
        fileEncryptionKey = await lighthouse.fetchEncryptionKey(
          cid,
          this.publicKey,
          signedMessage
        );
      } catch (error) {
        return {
          success: false,
          message: 'Failed to fetch encryption key - you may not have access to this file',
          error: 'ACCESS_DENIED'
        };
      }

      if (!fileEncryptionKey?.data?.key) {
        return {
          success: false,
          message: 'No encryption key received - access denied',
          error: 'NO_ENCRYPTION_KEY'
        };
      }

      // Decrypt file
      let decryptedBuffer;
      try {
        const decrypted = await lighthouse.decryptFile(
          cid,
          fileEncryptionKey.data.key
        );
        decryptedBuffer = Buffer.from(decrypted);
      } catch (error) {
        return {
          success: false,
          message: 'Failed to decrypt file',
          error: 'DECRYPTION_FAILED'
        };
      }

      // Determine file name and path
      const fileName = customFileName || `file_${cid.substring(0, 8)}.bin`;
      const filePath = path.join(this.downloadDir, fileName);

      // Save file to disk
      try {
        fs.writeFileSync(filePath, decryptedBuffer);
      } catch (error) {
        return {
          success: false,
          message: 'Failed to save file to disk',
          error: 'SAVE_FAILED'
        };
      }

      return {
        success: true,
        message: 'File downloaded and decrypted successfully',
        filePath,
        fileName,
        fileSize: decryptedBuffer.length
      };

    } catch (error) {
      console.error('Error downloading file:', error);
      return {
        success: false,
        message: `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: 'GENERAL_ERROR'
      };
    }
  }

  /**
   * Get file info from Lighthouse (if available)
   */
  async getFileInfo(cid: string): Promise<FileMetadata | null> {
    try {
      // Note: Lighthouse doesn't provide a direct API to get file metadata by CID
      // This is a placeholder for potential future functionality
      // You might need to store metadata separately in your application
      
      return {
        cid,
        fileName: `file_${cid.substring(0, 8)}`,
        fileSize: undefined,
        mimeType: 'application/octet-stream',
        uploadedAt: undefined
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  /**
   * Check if we can access a file (without downloading it)
   */
  async canAccessFile(cid: string): Promise<boolean> {
    try {
      const signedMessage = await this.signAuthMessage(this.publicKey, this.privateKey);
      
      const fileEncryptionKey = await lighthouse.fetchEncryptionKey(
        cid,
        this.publicKey,
        signedMessage
      );

      return !!(fileEncryptionKey?.data?.key);
    } catch (error) {
      console.error('Error checking file access:', error);
      return false;
    }
  }

  /**
   * List files in the downloads directory
   */
  listDownloadedFiles(): string[] {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        return [];
      }
      return fs.readdirSync(this.downloadDir);
    } catch (error) {
      console.error('Error listing downloaded files:', error);
      return [];
    }
  }

  /**
   * Delete a downloaded file
   */
  deleteDownloadedFile(fileName: string): boolean {
    try {
      const filePath = path.join(this.downloadDir, fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Get the download directory path
   */
  getDownloadDir(): string {
    return this.downloadDir;
  }

  /**
   * Clean up old downloaded files (older than specified hours)
   */
  cleanupOldFiles(maxAgeHours: number = 24): number {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        return 0;
      }

      const files = fs.readdirSync(this.downloadDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      let deletedCount = 0;

      for (const fileName of files) {
        const filePath = path.join(this.downloadDir, fileName);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      return 0;
    }
  }
}

/**
 * Utility function to validate CID format
 */
export function isValidCID(cid: string): boolean {
  // Basic CID validation - you might want to use a proper CID library
  if (!cid || typeof cid !== 'string') {
    return false;
  }
  
  // Basic checks for common CID patterns
  const cidPattern = /^[Qm][1-9A-HJ-NP-Za-km-z]{44,}$|^ba[a-zA-Z0-9]{56,}$/;
  return cidPattern.test(cid);
}

/**
 * Utility function to get file extension from mime type
 */
export function getFileExtensionFromMime(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    'text/plain': '.txt',
    'text/html': '.html',
    'text/css': '.css',
    'text/javascript': '.js',
    'application/json': '.json',
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip'
  };

  return mimeMap[mimeType] || '.bin';
}