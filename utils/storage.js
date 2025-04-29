/**
 * Simple in-memory storage for processed ZIP files
 * In a production environment, this would be replaced with a database
 */
const processedFiles = new Map();

/**
 * Store processed file data with a unique ID
 * @param {string} id Unique ID for the file
 * @param {Object} data Data to store
 */
const storeProcessedFile = (id, data) => {
  processedFiles.set(id, {
    ...data,
    timestamp: Date.now(),
  });
};

/**
 * Retrieve processed file data by ID
 * @param {string} id The file ID
 * @returns {Object|null} The file data or null if not found
 */
const getProcessedFile = (id) => {
  return processedFiles.get(id) || null;
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
