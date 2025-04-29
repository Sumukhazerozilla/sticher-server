const express = require("express");

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Single route - Hello World
app.get("/", (req, res) => {
  res.json({ message: "Hello from Sticher Server!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the static files at http://localhost:${PORT}/static`);
});
