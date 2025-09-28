# DAO File Access Backend

A Node.js backend service that provides secure access control for encrypted files using DAO membership verification and Lighthouse decryption. Users can download and decrypt files only if they have valid access to the associated DAO (either as owner or through purchased access tokens).

## Features

- 🔐 **Wallet Authentication**: Ethereum wallet signature-based authentication
- 🏛️ **DAO Access Control**: Verify user access to DAOs via smart contract integration
- 📁 **File Decryption**: Download and decrypt files from Lighthouse storage
- 🚦 **Rate Limiting**: Built-in rate limiting and security measures
- 🔍 **Access Verification**: Check user permissions before file access
- 📊 **Comprehensive API**: RESTful endpoints for all operations

## Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **ethers.js** for Ethereum integration
- **Lighthouse SDK** for decentralized file storage
- **Winston** for logging
- **Helmet** & **CORS** for security

## Installation

1. **Clone and navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Build the project:**

```bash
npm run build
```

5. **Start the server:**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Environment Configuration

Copy `.env.example` to `.env` and configure the following:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Ethereum Configuration
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0x...your_private_key
PUBLIC_KEY=0x...your_public_address

# Smart Contract Addresses
COMMUNITY_ACCESS_DAO_FACTORY_ADDRESS=0xEB37A065E20D0BB04b161B1d2985065Fb242866a

# Security Configuration
JWT_SECRET=your_jwt_secret_here
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## API Endpoints

### Authentication

#### Generate Auth Message

```
GET /api/auth/message?address=<ethereum_address>
```

Returns a message for the user to sign with their wallet.

### Access Control

#### Check User Access

```
POST /api/access/check
Headers: Authentication required
```

Check if authenticated user has access to any DAO.

#### Check Specific Address Access

```
GET /api/access/check/:address
```

Check access for a specific Ethereum address (public endpoint).

#### Check DAO Access

```
POST /api/access/dao/:daoAddress
Headers: Authentication required
```

Check if user has access to a specific DAO.

### DAO Information

#### Get DAO Info

```
GET /api/dao/:daoAddress/info
```

Retrieve information about a specific DAO.

#### Get All DAOs

```
GET /api/daos
```

List all DAOs in the system.

#### Get User DAOs

```
POST /api/user/daos
Headers: Authentication required
```

Get DAOs owned by the authenticated user.

### File Operations

#### Check File Access

```
POST /api/file/access/:cid
Headers: Authentication required
```

Check if user can access a specific file by CID.

#### Download File

```
POST /api/file/download/:cid
Headers: Authentication required
Body: { "fileName": "optional_custom_name.ext" }
```

Download and decrypt a file from Lighthouse.

#### Serve File

```
GET /api/file/serve/:fileName
Headers: Authentication required
```

Serve a previously downloaded file.

#### List Downloaded Files

```
GET /api/files/downloaded
Headers: Authentication required
```

List all files downloaded by the user.

#### Delete File

```
DELETE /api/file/:fileName
Headers: Authentication required
```

Delete a downloaded file from the server.

## Authentication

The API uses wallet signature authentication. Here's how it works:

1. **Get Message**: Call `GET /api/auth/message?address=<your_address>`
2. **Sign Message**: Sign the returned message with your Ethereum wallet
3. **Include Headers**: Include these headers in authenticated requests:
   - `x-wallet-address`: Your Ethereum address
   - `x-wallet-signature`: The signature
   - `x-wallet-message`: The original message
   - `x-wallet-timestamp`: The message timestamp

### Example Authentication Flow

```javascript
// 1. Get message to sign
const response = await fetch(`/api/auth/message?address=${userAddress}`);
const { message, timestamp } = await response.json();

// 2. Sign message with wallet (using ethers.js)
const signature = await signer.signMessage(message);

// 3. Use in subsequent requests
const headers = {
  "x-wallet-address": userAddress,
  "x-wallet-signature": signature,
  "x-wallet-message": message,
  "x-wallet-timestamp": timestamp.toString(),
};
```

## Usage Examples

### Check Access and Download File

```javascript
// Check if user has access
const accessCheck = await fetch("/api/access/check", {
  method: "POST",
  headers: authHeaders,
});

// Check specific file access
const fileAccess = await fetch(`/api/file/access/${cid}`, {
  method: "POST",
  headers: authHeaders,
});

// Download file if access is granted
const download = await fetch(`/api/file/download/${cid}`, {
  method: "POST",
  headers: {
    ...authHeaders,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ fileName: "my-file.pdf" }),
});
```

### Get User's DAOs

```javascript
const userDAOs = await fetch("/api/user/daos", {
  method: "POST",
  headers: authHeaders,
});

const { daos } = await userDAOs.json();
```

## Access Control Logic

The backend implements a multi-level access control system:

1. **Owner Access**: Users who own DAOs have full access to associated files
2. **Purchased Access**: Users who have purchased access tokens can download files
3. **Time-based Access**: Access tokens have expiration dates
4. **Lighthouse Integration**: Files must be accessible via Lighthouse encryption keys

## Security Features

- **Wallet Authentication**: All sensitive endpoints require wallet signature verification
- **Rate Limiting**: Prevents abuse with configurable request limits
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Configurable CORS policies
- **Helmet Security**: Security headers via Helmet middleware
- **Error Handling**: Proper error handling without information leakage

## File Management

- Downloaded files are stored in the `downloads/` directory
- Files are automatically cleaned up based on age
- Custom filenames can be specified during download
- File serving includes proper headers for download

## Logging

The backend uses Winston for structured logging:

- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output in development mode

## Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests (if available)
npm test

# Lint code
npm run lint
```

## Project Structure

```
backend/
├── src/
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   └── api.ts               # API route definitions
│   ├── services/
│   │   ├── AccessVerificationService.ts  # DAO access verification
│   │   └── LighthouseService.ts          # File decryption service
│   ├── utils/
│   │   └── helpers.ts           # Utility functions
│   └── server.ts                # Main server file
├── downloads/                   # Downloaded files directory
├── logs/                       # Log files
├── .env.example                # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "errors": ["Detailed validation errors"]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Add comprehensive error handling
5. Test thoroughly
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Check the API documentation at the root endpoint (`/`)
- Review error logs in the `logs/` directory
- Ensure environment variables are properly configured
- Verify smart contract addresses and RPC endpoints
