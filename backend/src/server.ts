import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import * as dotenv from "dotenv";
import apiRoutes from "./routes/api.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend-domain.com"] // Replace with your actual frontend domain
        : [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
          ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-wallet-address",
      "x-wallet-signature",
      "x-wallet-message",
      "x-wallet-timestamp",
    ],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "DAO File Access Backend is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
app.use("/api", apiRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "DAO File Access Backend API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
      authMessage: "GET /api/auth/message?address=<ethereum_address>",
      checkAccess: "POST /api/access/check (requires auth)",
      checkUserAccess: "GET /api/access/check/:address",
      checkDAOAccess: "POST /api/access/dao/:daoAddress (requires auth)",
      daoInfo: "GET /api/dao/:daoAddress/info",
      allDAOs: "GET /api/daos",
      userDAOs: "POST /api/user/daos (requires auth)",
      fileAccess: "POST /api/file/access/:cid (requires auth)",
      downloadFile: "POST /api/file/download/:cid (requires auth)",
      serveFile: "GET /api/file/serve/:fileName (requires auth headers)",
      listFiles: "GET /api/files/downloaded (requires auth headers)",
      deleteFile: "DELETE /api/file/:fileName (requires auth)",
    },
    authentication: {
      required: "Wallet signature authentication",
      headers: {
        "x-wallet-address": "Ethereum address",
        "x-wallet-signature": "Signed message",
        "x-wallet-message": "Original message that was signed",
        "x-wallet-timestamp": "Message timestamp",
      },
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 DAO File Access Backend is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

  // Log configuration
  console.log("\n📋 Configuration:");
  console.log(
    `- Factory Address: ${
      process.env.COMMUNITY_ACCESS_DAO_FACTORY_ADDRESS || "Default Sepolia"
    }`
  );
  console.log(
    `- RPC URL: ${
      process.env.ETHEREUM_RPC_URL ? "Configured" : "Using default"
    }`
  );
  console.log(
    `- Public Key: ${process.env.PUBLIC_KEY ? "Configured" : "Missing"}`
  );
  console.log(
    `- Private Key: ${process.env.PRIVATE_KEY ? "Configured" : "Missing"}`
  );
});

export default app;
