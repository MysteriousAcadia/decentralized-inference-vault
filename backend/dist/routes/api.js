import { Router } from 'express';
import { AccessVerificationService } from '../services/AccessVerificationService.js';
import { LighthouseService, isValidCID } from '../services/LighthouseService.js';
import { authenticateWallet, authenticateWalletHeader, optionalAuth, generateAuthMessage } from '../middleware/auth.js';
import { body, param, query, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';
const router = Router();
const accessService = new AccessVerificationService();
const lighthouseService = new LighthouseService();
// Validation middleware
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};
/**
 * GET /api/auth/message - Generate authentication message for wallet signing
 */
router.get('/auth/message', [
    query('address').isEthereumAddress().withMessage('Valid Ethereum address is required')
], handleValidationErrors, (req, res) => {
    try {
        const { address } = req.query;
        const timestamp = Date.now();
        const message = generateAuthMessage(address, timestamp);
        res.json({
            success: true,
            message: 'Authentication message generated',
            data: {
                message,
                timestamp,
                address
            }
        });
    }
    catch (error) {
        console.error('Error generating auth message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate authentication message'
        });
    }
});
/**
 * POST /api/access/check - Check if user has access to any DAO
 */
router.post('/access/check', authenticateWallet, async (req, res) => {
    try {
        const userAddress = req.user.address;
        const result = await accessService.checkUserAccess(userAddress);
        res.json({
            success: true,
            message: 'Access check completed',
            data: result
        });
    }
    catch (error) {
        console.error('Error checking access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check user access'
        });
    }
});
/**
 * GET /api/access/check/:address - Check access for specific address (optional auth)
 */
router.get('/access/check/:address', [
    param('address').isEthereumAddress().withMessage('Valid Ethereum address is required')
], handleValidationErrors, optionalAuth, async (req, res) => {
    try {
        const { address } = req.params;
        // If authenticated and checking own address, or if no auth required for public check
        const result = await accessService.checkUserAccess(address);
        res.json({
            success: true,
            message: 'Access check completed',
            data: result
        });
    }
    catch (error) {
        console.error('Error checking access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check user access'
        });
    }
});
/**
 * POST /api/access/dao/:daoAddress - Check access to specific DAO
 */
router.post('/access/dao/:daoAddress', [
    param('daoAddress').isEthereumAddress().withMessage('Valid DAO address is required')
], handleValidationErrors, authenticateWallet, async (req, res) => {
    try {
        const { daoAddress } = req.params;
        const userAddress = req.user.address;
        const result = await accessService.checkDAOAccess(daoAddress, userAddress);
        res.json({
            success: true,
            message: 'DAO access check completed',
            data: result
        });
    }
    catch (error) {
        console.error('Error checking DAO access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check DAO access'
        });
    }
});
/**
 * GET /api/dao/:daoAddress/info - Get DAO information
 */
router.get('/dao/:daoAddress/info', [
    param('daoAddress').isEthereumAddress().withMessage('Valid DAO address is required')
], handleValidationErrors, async (req, res) => {
    try {
        const { daoAddress } = req.params;
        const daoInfo = await accessService.getDAOInfo(daoAddress);
        if (!daoInfo) {
            return res.status(404).json({
                success: false,
                message: 'DAO not found or error retrieving DAO information'
            });
        }
        res.json({
            success: true,
            message: 'DAO information retrieved',
            data: daoInfo
        });
    }
    catch (error) {
        console.error('Error getting DAO info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve DAO information'
        });
    }
});
/**
 * GET /api/daos - Get all DAOs
 */
router.get('/daos', async (req, res) => {
    try {
        const allDAOs = await accessService.getAllDAOs();
        res.json({
            success: true,
            message: 'All DAOs retrieved',
            data: {
                daos: allDAOs,
                count: allDAOs.length
            }
        });
    }
    catch (error) {
        console.error('Error getting all DAOs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve DAOs'
        });
    }
});
/**
 * POST /api/user/daos - Get DAOs owned by user
 */
router.post('/user/daos', authenticateWallet, async (req, res) => {
    try {
        const userAddress = req.user.address;
        const userDAOs = await accessService.getUserDAOs(userAddress);
        res.json({
            success: true,
            message: 'User DAOs retrieved',
            data: {
                daos: userDAOs,
                count: userDAOs.length,
                owner: userAddress
            }
        });
    }
    catch (error) {
        console.error('Error getting user DAOs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user DAOs'
        });
    }
});
/**
 * POST /api/file/access/:cid - Check if user can access specific file
 */
router.post('/file/access/:cid', [
    param('cid').custom((value) => {
        if (!isValidCID(value)) {
            throw new Error('Invalid CID format');
        }
        return true;
    })
], handleValidationErrors, authenticateWallet, async (req, res) => {
    try {
        const { cid } = req.params;
        const userAddress = req.user.address;
        // First check if user has access to any DAO
        const accessResult = await accessService.checkUserAccess(userAddress);
        if (!accessResult.hasAccess) {
            return res.json({
                success: false,
                message: 'User has no access to any DAO',
                data: {
                    cid,
                    hasAccess: false,
                    canDownload: false
                }
            });
        }
        // Check if file can be accessed via Lighthouse
        const canAccess = await lighthouseService.canAccessFile(cid);
        res.json({
            success: true,
            message: 'File access check completed',
            data: {
                cid,
                hasAccess: accessResult.hasAccess && canAccess,
                canDownload: canAccess,
                userAccess: accessResult
            }
        });
    }
    catch (error) {
        console.error('Error checking file access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check file access'
        });
    }
});
/**
 * POST /api/file/download/:cid - Download and decrypt file
 */
router.post('/file/download/:cid', [
    param('cid').custom((value) => {
        if (!isValidCID(value)) {
            throw new Error('Invalid CID format');
        }
        return true;
    }),
    body('fileName').optional().isString().withMessage('File name must be a string')
], handleValidationErrors, authenticateWallet, async (req, res) => {
    try {
        const { cid } = req.params;
        const { fileName } = req.body;
        const userAddress = req.user.address;
        // First check if user has access to any DAO
        const accessResult = await accessService.checkUserAccess(userAddress);
        if (!accessResult.hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'User has no access to any DAO'
            });
        }
        // Download and decrypt the file
        const downloadResult = await lighthouseService.downloadFile(cid, fileName);
        if (!downloadResult.success) {
            return res.status(400).json({
                success: false,
                message: downloadResult.message,
                error: downloadResult.error
            });
        }
        res.json({
            success: true,
            message: 'File downloaded successfully',
            data: {
                cid,
                fileName: downloadResult.fileName,
                filePath: downloadResult.filePath,
                fileSize: downloadResult.fileSize
            }
        });
    }
    catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download file'
        });
    }
});
/**
 * GET /api/file/serve/:fileName - Serve downloaded file
 */
router.get('/file/serve/:fileName', authenticateWalletHeader, async (req, res) => {
    try {
        const { fileName } = req.params;
        const userAddress = req.user.address;
        // Check if user has access
        const accessResult = await accessService.checkUserAccess(userAddress);
        if (!accessResult.hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'User has no access to any DAO'
            });
        }
        const filePath = path.join(lighthouseService.getDownloadDir(), fileName);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        // Send file
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error serving file:', err);
                res.status(500).json({
                    success: false,
                    message: 'Error serving file'
                });
            }
        });
    }
    catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to serve file'
        });
    }
});
/**
 * GET /api/files/downloaded - List downloaded files
 */
router.get('/files/downloaded', authenticateWalletHeader, async (req, res) => {
    try {
        const userAddress = req.user.address;
        // Check if user has access
        const accessResult = await accessService.checkUserAccess(userAddress);
        if (!accessResult.hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'User has no access to any DAO'
            });
        }
        const files = lighthouseService.listDownloadedFiles();
        res.json({
            success: true,
            message: 'Downloaded files listed',
            data: {
                files,
                count: files.length
            }
        });
    }
    catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list downloaded files'
        });
    }
});
/**
 * DELETE /api/file/:fileName - Delete downloaded file
 */
router.delete('/file/:fileName', authenticateWallet, async (req, res) => {
    try {
        const { fileName } = req.params;
        const userAddress = req.user.address;
        // Check if user has access
        const accessResult = await accessService.checkUserAccess(userAddress);
        if (!accessResult.hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'User has no access to any DAO'
            });
        }
        const deleted = lighthouseService.deleteDownloadedFile(fileName);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'File not found or could not be deleted'
            });
        }
        res.json({
            success: true,
            message: 'File deleted successfully',
            data: {
                fileName,
                deleted: true
            }
        });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file'
        });
    }
});
export default router;
//# sourceMappingURL=api.js.map