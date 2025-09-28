import { ethers } from 'ethers';
import fetch from 'node-fetch';

/**
 * Example script showing how to interact with the DAO File Access Backend
 * This demonstrates the complete flow: authentication, access check, and file download
 */

const API_BASE_URL = 'http://localhost:3001/api';

// Example configuration - replace with your actual values
const USER_PRIVATE_KEY = '0x...'; // Your private key
const USER_ADDRESS = '0x...';     // Your address
const FILE_CID = 'Qm...';         // CID of file you want to access

class BackendClient {
  constructor(privateKey, userAddress) {
    this.privateKey = privateKey;
    this.userAddress = userAddress;
    this.signer = new ethers.Wallet(privateKey);
  }

  /**
   * Get authentication message from backend
   */
  async getAuthMessage() {
    const response = await fetch(`${API_BASE_URL}/auth/message?address=${this.userAddress}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Failed to get auth message: ${data.message}`);
    }
    
    return data.data;
  }

  /**
   * Sign message and create auth headers
   */
  async createAuthHeaders() {
    const { message, timestamp } = await this.getAuthMessage();
    const signature = await this.signer.signMessage(message);

    return {
      'Content-Type': 'application/json',
      'x-wallet-address': this.userAddress,
      'x-wallet-signature': signature,
      'x-wallet-message': message,
      'x-wallet-timestamp': timestamp.toString()
    };
  }

  /**
   * Check user's access to any DAO
   */
  async checkAccess() {
    const headers = await this.createAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/access/check`, {
      method: 'POST',
      headers
    });
    
    const data = await response.json();
    console.log('Access Check Result:', JSON.stringify(data, null, 2));
    
    return data;
  }

  /**
   * Get user's DAOs
   */
  async getUserDAOs() {
    const headers = await this.createAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/user/daos`, {
      method: 'POST',
      headers
    });
    
    const data = await response.json();
    console.log('User DAOs:', JSON.stringify(data, null, 2));
    
    return data;
  }

  /**
   * Check access to specific file
   */
  async checkFileAccess(cid) {
    const headers = await this.createAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/file/access/${cid}`, {
      method: 'POST',
      headers
    });
    
    const data = await response.json();
    console.log('File Access Check:', JSON.stringify(data, null, 2));
    
    return data;
  }

  /**
   * Download and decrypt file
   */
  async downloadFile(cid, fileName) {
    const headers = await this.createAuthHeaders();
    
    const body = {};
    if (fileName) {
      body.fileName = fileName;
    }
    
    const response = await fetch(`${API_BASE_URL}/file/download/${cid}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    console.log('Download Result:', JSON.stringify(data, null, 2));
    
    return data;
  }

  /**
   * List downloaded files
   */
  async listDownloadedFiles() {
    const headers = await this.createAuthHeaders();
    delete headers['Content-Type']; // Not needed for GET request
    
    const response = await fetch(`${API_BASE_URL}/files/downloaded`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    console.log('Downloaded Files:', JSON.stringify(data, null, 2));
    
    return data;
  }

  /**
   * Get all DAOs in the system
   */
  async getAllDAOs() {
    const response = await fetch(`${API_BASE_URL}/daos`);
    const data = await response.json();
    console.log('All DAOs:', JSON.stringify(data, null, 2));
    
    return data;
  }
}

/**
 * Main example function
 */
async function main() {
  try {
    console.log('🚀 Starting DAO File Access Backend Example\n');
    
    // Initialize client
    const client = new BackendClient(USER_PRIVATE_KEY, USER_ADDRESS);
    
    console.log('👤 User Address:', USER_ADDRESS);
    console.log('📄 File CID:', FILE_CID);
    console.log('🔗 API Base URL:', API_BASE_URL);
    console.log('\n' + '='.repeat(50) + '\n');

    // Step 1: Check backend health
    console.log('1. Checking backend health...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend is healthy:', healthData.message);
    console.log('');

    // Step 2: Get all DAOs
    console.log('2. Getting all DAOs...');
    await client.getAllDAOs();
    console.log('');

    // Step 3: Check user access
    console.log('3. Checking user access...');
    const accessResult = await client.checkAccess();
    console.log('');

    // Step 4: Get user's DAOs
    console.log('4. Getting user DAOs...');
    await client.getUserDAOs();
    console.log('');

    if (accessResult.data.hasAccess) {
      console.log('✅ User has access! Proceeding with file operations...\n');
      
      // Step 5: Check file access
      console.log('5. Checking file access...');
      const fileAccessResult = await client.checkFileAccess(FILE_CID);
      console.log('');

      if (fileAccessResult.success && fileAccessResult.data.hasAccess) {
        console.log('✅ File access granted! Downloading...\n');
        
        // Step 6: Download file
        console.log('6. Downloading file...');
        const downloadResult = await client.downloadFile(FILE_CID, 'example-file.bin');
        console.log('');

        if (downloadResult.success) {
          console.log('✅ File downloaded successfully!');
          
          // Step 7: List downloaded files
          console.log('7. Listing downloaded files...');
          await client.listDownloadedFiles();
          
        } else {
          console.log('❌ File download failed:', downloadResult.message);
        }
      } else {
        console.log('❌ No access to the specified file');
      }
    } else {
      console.log('❌ User does not have access to any DAO');
      console.log('💡 Make sure you own a DAO or have purchased access to one');
    }

  } catch (error) {
    console.error('❌ Error in example:', error);
  }
}

// Run the example
if (process.argv.includes('--run')) {
  main().catch(console.error);
} else {
  console.log('DAO File Access Backend Example');
  console.log('');
  console.log('To run this example:');
  console.log('1. Update USER_PRIVATE_KEY and USER_ADDRESS constants');
  console.log('2. Update FILE_CID with a valid CID');
  console.log('3. Make sure the backend is running on localhost:3001');
  console.log('4. Run: node examples/client-example.mjs --run');
  console.log('');
  console.log('Or import this class in your own application:');
  console.log('import { BackendClient } from "./client-example.mjs";');
}

export { BackendClient };