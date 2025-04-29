const express = require("express");
const path = require("path");
const uploadRoutes = require("./routes/uploadRoutes");

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/static", express.static(path.join(__dirname, "example-zip")));

// Home route
app.get("/", (req, res) => {
  res.json({ message: "Hello from Sticher Server!" });
});

// Use upload routes
app.use("/api", uploadRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the static files at http://localhost:${PORT}/static`);
});
