const express = require("express");
const path = require("path");
const uploadRoutes = require("./routes/uploadRoutes");
const cors = require("cors");
require("dotenv").config();
const db = require("./models");

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Increase JSON limit for large metadata
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve static files
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Hello from Sticher Server!",
    status: "running",
    version: "1.0.0",
  });
});

// Use upload routes
app.use("/api", uploadRoutes);

// // Add a health check endpoint
// app.get("/health", (req, res) => {
//   res.json({ status: "ok", timestamp: new Date() });
// });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({
    error: "Server error",
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Sync database and start the server
const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log("Database connection established successfully");

    await db.sequelize.sync();
    console.log("Database synchronized successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server time: ${new Date().toISOString()}`);
      console.log(`Server URL: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
