const fs = require("fs");
const path = require("path");

/**
 * Simple file-based storage for processed ZIP files
 * This provides persistence across server restarts
 */

// Define storage file path
const DATA_DIR = path.join(__dirname, "..", "data");
const STORAGE_FILE = path.join(DATA_DIR, "processed-files.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize storage from file or create empty map
let processedFiles = new Map();

// Load existing data if available
try {
  if (fs.existsSync(STORAGE_FILE)) {
    const fileData = fs.readFileSync(STORAGE_FILE, "utf8");
    const storedData = JSON.parse(fileData);
    // Convert array back to Map
    processedFiles = new Map(storedData);
    console.log(`Loaded ${processedFiles.size} files from storage`);
  }
} catch (err) {
  console.error("Error loading storage file:", err);
  // Continue with empty map if file can't be loaded
}

// Save data to disk
const saveToFile = () => {
  try {
    // Convert Map to array for JSON serialization
    const dataToStore = Array.from(processedFiles.entries());
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(dataToStore, null, 2));
    console.log(`Saved ${processedFiles.size} files to storage file`);
  } catch (err) {
    console.error("Error saving storage file:", err);
  }
};

/**
 * Store processed file data with a unique ID
 * @param {string} id Unique ID for the file
 * @param {Object} data Data to store
 */
const storeProcessedFile = (id, data) => {
  console.log(`Storing file with ID: ${id}`);
  processedFiles.set(id, {
    ...data,
    timestamp: Date.now(),
  });

  // Persist to disk
  saveToFile();
};

/**
 * Retrieve processed file data by ID
 * @param {string} id The file ID
 * @returns {Object|null} The file data or null if not found
 */
const getProcessedFile = (id) => {
  console.log(`Attempting to retrieve file with ID: ${id}`);
  console.log(`Available IDs: ${Array.from(processedFiles.keys()).join(", ")}`);

  if (processedFiles.has(id)) {
    console.log(`File found with ID: ${id}`);
    return processedFiles.get(id);
  }

  console.log(`File NOT found with ID: ${id}`);
  return null;
};

/**
 * List all processed files (limited info)
 * @returns {Array} Array of processed file info
 */
const listProcessedFiles = () => {
  const result = [];
  processedFiles.forEach((data, id) => {
    result.push({
      id,
      timestamp: data.timestamp,
      filename: data.filename,
    });
  });
  return result;
};

module.exports = {
  storeProcessedFile,
  getProcessedFile,
  listProcessedFiles,
};
