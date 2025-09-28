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
export declare class LighthouseService {
    private publicKey;
    private privateKey;
    private provider;
    private signer;
    private downloadDir;
    constructor();
    /**
     * Sign authentication message for Lighthouse
     */
    private signAuthMessage;
    /**
     * Download and decrypt a file from Lighthouse
     */
    downloadFile(cid: string, customFileName?: string): Promise<FileDecryptionResult>;
    /**
     * Get file info from Lighthouse (if available)
     */
    getFileInfo(cid: string): Promise<FileMetadata | null>;
    /**
     * Check if we can access a file (without downloading it)
     */
    canAccessFile(cid: string): Promise<boolean>;
    /**
     * List files in the downloads directory
     */
    listDownloadedFiles(): string[];
    /**
     * Delete a downloaded file
     */
    deleteDownloadedFile(fileName: string): boolean;
    /**
     * Get the download directory path
     */
    getDownloadDir(): string;
    /**
     * Clean up old downloaded files (older than specified hours)
     */
    cleanupOldFiles(maxAgeHours?: number): number;
}
/**
 * Utility function to validate CID format
 */
export declare function isValidCID(cid: string): boolean;
/**
 * Utility function to get file extension from mime type
 */
export declare function getFileExtensionFromMime(mimeType: string): string;
